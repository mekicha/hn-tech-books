import { Level, StationId } from "./game";
import { voiceAsset } from "./voices";
import { songs } from "./songs";
export type AudioMode = "exploration" | "dialogue" | "microphone" | "travel";
/** Original oscillator score with local synthetic German speech assets. */
export class AudioDirector {
  context?: AudioContext;
  master?: GainNode;
  filter?: BiquadFilterNode;
  level: Level = "A1";
  playing = false;
  muted = false;
  volume = 0.35;
  mode: AudioMode = "exploration";
  private voice?: AudioBufferSourceNode;
  private voiceGain?: GainNode;
  private cache = new Map<string, AudioBuffer>();
  private timer?: ReturnType<typeof setInterval>;
  private beat = 0;
  private seen = new Set<string>();
  private generation = 0;
  private speechGeneration = 0;
  onLyric?: (index: number) => void;
  onError?: (message: string) => void;
  get effectiveVolume() {
    return this.playing && !this.muted
      ? this.volume *
          (this.mode === "microphone"
            ? 0.015
            : this.mode === "dialogue"
              ? 0.15
              : 1)
      : 0;
  }
  private async init() {
    if (typeof window === "undefined") return;
    this.context ??= new AudioContext();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.filter = this.context.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 5000;
      this.master.connect(this.filter);
      this.filter.connect(this.context.destination);
    }
    await this.context.resume();
  }
  private ramp() {
    if (!this.context || !this.master) return;
    if (this.voiceGain)
      this.voiceGain.gain.setTargetAtTime(
        this.playing && !this.muted && this.mode !== "microphone"
          ? this.volume
          : 0,
        this.context.currentTime,
        0.08,
      );
    const t = this.context.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.effectiveVolume, t, 0.13);
  }
  private tone(
    f: number,
    time: number,
    duration: number,
    volume = 0.12,
    type: OscillatorType = "sine",
  ) {
    if (!this.context || !this.master) return;
    const o = this.context.createOscillator(),
      g = this.context.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(volume, time + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(time);
    o.stop(time + duration + 0.02);
  }
  async playTrack(level: Level) {
    const generation = ++this.generation;
    try {
      await this.init();
      if (generation !== this.generation) return;
      this.level = level;
      this.playing = true;
      this.beat = 0;
      this.stopTimer();
      this.ramp();
      this.tick();
      this.timer = setInterval(() => this.tick(), 60000 / songs[level].bpm / 2);
    } catch {
      this.playing = false;
      this.onError?.(
        "Audio could not start. You can still play with subtitles.",
      );
    }
  }
  private tick() {
    if (!this.context || !this.playing) return;
    const s = songs[this.level],
      t = this.context.currentTime,
      step = this.beat++;
    const note = s.notes[step % s.notes.length];
    this.tone(note, t, 0.65, 0.1, "triangle");
    if (step % 4 === 0) {
      this.tone(note / 2, t, 1.2, 0.19);
      this.tone(note * 1.5, t, 1.4, 0.035);
    }
    if (this.seen.has("witness") || this.seen.has("song"))
      this.tone(note * 2, t, 0.4, 0.025);
    if (step % 2 === 0)
      this.tone(
        step % 4 === 0 ? 55 : 155,
        t,
        0.12,
        this.mode === "travel" ? 0.19 : 0.08,
        "sine",
      );
    if (step % 32 === 0 && this.mode === "exploration") {
      const i = Math.floor(step / 32) % s.lyrics.length;
      this.onLyric?.(i);
      this.cancelSpeech();
      void this.playVoice(
        `/audio/${this.level}-${i}.mp3`,
        s.lyrics[i].de,
        false,
        this.speechGeneration,
      );
    }
  }
  pauseTrack() {
    this.generation++;
    this.playing = false;
    if (this.mode === "dialogue") this.mode = "exploration";
    this.stopTimer();
    this.cancelSpeech();
    this.ramp();
  }
  async resumeTrack() {
    await this.playTrack(this.level);
  }
  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.ramp();
  }
  mute() {
    this.muted = true;
    if (this.mode === "dialogue") this.mode = "exploration";
    this.cancelSpeech();
    this.ramp();
  }
  unmute() {
    this.muted = false;
    this.ramp();
  }
  duckForDialogue() {
    this.mode = "dialogue";
    this.cancelSpeech();
    this.ramp();
  }
  restoreAfterDialogue() {
    if (this.mode === "dialogue") {
      this.mode = "exploration";
      this.ramp();
    }
  }
  startMicrophoneMode() {
    this.mode = "microphone";
    this.cancelSpeech();
    this.ramp();
  }
  endMicrophoneMode() {
    this.mode = "exploration";
    this.ramp();
  }
  onTrainDepart() {
    this.mode = "travel";
    this.cancelSpeech();
    this.ramp();
    if (this.playing && this.context) {
      const t = this.context.currentTime;
      [120, 160, 220, 320].forEach((f, i) =>
        this.tone(f, t + i * 0.14, 0.35, 0.05, "sawtooth"),
      );
    }
  }
  onStationArrive(id: StationId) {
    this.mode = "exploration";
    this.ramp();
    if (id === "kotti")
      this.once("station:kotti", () => this.sting([523.25, 659.25]));
  }
  onClueDiscovered(key = "clue") {
    this.once(key, () => this.sting([523.25, 659.25, 783.99]));
  }
  onMysterySolved() {
    this.mode = "exploration";
    this.ramp();
    this.once("ending", () => this.sting([...songs[this.level].notes, 523.25]));
  }
  onRewind() {
    this.seen.clear();
    this.cancelSpeech();
    if (this.filter && this.context) {
      const t = this.context.currentTime;
      this.filter.frequency.setTargetAtTime(180, t, 0.07);
      this.filter.frequency.setTargetAtTime(5000, t + 0.6, 0.2);
    }
    this.sting([783.99, 659.25, 523.25, 261.63]);
  }
  private once(key: string, fn: () => void) {
    if (this.seen.has(key)) return;
    this.seen.add(key);
    fn();
  }
  private sting(notes: number[]) {
    if (!this.context || !this.playing) return;
    notes.forEach((n, i) =>
      this.tone(n, this.context!.currentTime + i * 0.14, 0.7, 0.2),
    );
  }
  speak(text: string, dialogue = true, onEnd?: () => void) {
    if (
      typeof window === "undefined" ||
      this.muted ||
      !this.playing ||
      this.mode === "microphone"
    ) {
      if (dialogue) this.restoreAfterDialogue();
      onEnd?.();
      return;
    }
    this.cancelSpeech();
    if (dialogue) this.duckForDialogue();
    const token = this.speechGeneration;
    const url = voiceAsset(text, this.level);
    if (url) void this.playVoice(url, text, dialogue, token, onEnd);
    else this.browserSpeech(text, dialogue, token, onEnd);
  }
  private async playVoice(
    url: string,
    text: string,
    dialogue: boolean,
    token: number,
    onEnd?: () => void,
  ) {
    try {
      if (!this.context) throw new Error("Audio not initialized");
      let buffer = this.cache.get(url);
      if (!buffer) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Speech asset unavailable");
        buffer = await this.context.decodeAudioData(
          await response.arrayBuffer(),
        );
        this.cache.set(url, buffer);
      }
      if (
        token !== this.speechGeneration ||
        !this.playing ||
        this.muted ||
        this.mode === "microphone"
      )
        return;
      const source = this.context.createBufferSource();
      this.voiceGain ??= this.context.createGain();
      this.voiceGain.disconnect();
      this.voiceGain.connect(this.context.destination);
      this.voiceGain.gain.value = this.volume;
      source.buffer = buffer;
      source.connect(this.voiceGain);
      this.voice = source;
      source.onended = () => {
        if (token !== this.speechGeneration) return;
        if (dialogue) this.restoreAfterDialogue();
        onEnd?.();
      };
      source.start();
    } catch {
      if (token !== this.speechGeneration) return;
      this.browserSpeech(text, dialogue, token, onEnd);
    }
  }
  private browserSpeech(
    text: string,
    dialogue: boolean,
    token: number,
    onEnd?: () => void,
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (dialogue) this.restoreAfterDialogue();
      onEnd?.();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = songs[this.level].rate;
    utterance.volume = this.volume;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("de"));
    if (!voice) {
      if (dialogue) this.restoreAfterDialogue();
      onEnd?.();
      return;
    }
    utterance.voice = voice;
    utterance.onend = utterance.onerror = () => {
      if (token !== this.speechGeneration) return;
      if (dialogue) this.restoreAfterDialogue();
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  }
  private cancelSpeech() {
    this.speechGeneration++;
    if (this.voice) {
      try {
        this.voice.stop();
      } catch {
        /* already stopped */
      }
      this.voice = undefined;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  }
  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
  dispose() {
    this.pauseTrack();
    void this.context?.close();
  }
}
