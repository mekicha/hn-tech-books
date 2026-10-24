import type { Level } from "./narrative";
export type SoundEvent =
  "step" | "door" | "clue" | "rewind" | "midnight" | "ending";
/** Original Web Audio ambience and cues. Speech assets are local synthetic German. */
export class AudioDirector {
  context?: AudioContext;
  master?: GainNode;
  filter?: BiquadFilterNode;
  playing = false;
  muted = false;
  volume = 0.45;
  mode: "exploration" | "dialogue" | "microphone" = "exploration";
  private timer?: ReturnType<typeof setInterval>;
  private rain?: AudioBufferSourceNode;
  private voice?: AudioBufferSourceNode;
  private voiceGain?: GainNode;
  private token = 0;
  private beat = 0;
  private cache = new Map<string, AudioBuffer>();
  private seen = new Set<number>();
  onError?: (message: string) => void;
  get effectiveVolume() {
    return this.playing && !this.muted
      ? this.volume *
          (this.mode === "microphone"
            ? 0.015
            : this.mode === "dialogue"
              ? 0.13
              : 1)
      : 0;
  }
  async start() {
    try {
      this.context ??= new AudioContext();
      if (!this.master) {
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.filter = this.context.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = 2800;
        this.master.connect(this.filter);
        this.filter.connect(this.context.destination);
        this.createRain();
      }
      await this.context.resume();
      this.playing = true;
      this.mode = "exploration";
      this.ramp();
      if (!this.timer) {
        this.tick();
        this.timer = setInterval(() => this.tick(), 850);
      }
    } catch {
      this.playing = false;
      this.onError?.(
        "Audio could not start. All dialogue and clues are readable.",
      );
    }
  }
  private createRain() {
    if (!this.context || !this.master) return;
    const length = this.context.sampleRate * 3,
      buffer = this.context.createBuffer(1, length, this.context.sampleRate),
      data = buffer.getChannelData(0);
    let seed = 47,
      last = 0;
    for (let i = 0; i < length; i++) {
      seed = (seed * 16807) % 2147483647;
      last = 0.88 * last + 0.12 * ((seed / 2147483647) * 2 - 1);
      data[i] = last * 0.15;
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.master);
    source.start();
    this.rain = source;
  }
  private tone(
    f: number,
    t: number,
    duration: number,
    v = 0.09,
    type: OscillatorType = "sine",
  ) {
    if (!this.context || !this.master) return;
    const o = this.context.createOscillator(),
      g = this.context.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  private tick() {
    if (!this.playing || !this.context) return;
    const t = this.context.currentTime,
      step = this.beat++;
    this.tone(step % 2 ? 880 : 1046, t, 0.04, 0.014, "triangle");
    if (step % 4 === 0) {
      const note = [146.83, 174.61, 220, 164.81][Math.floor(step / 4) % 4];
      this.tone(note, t, 3, 0.07, "triangle");
      this.tone(note * 1.5, t, 2.8, 0.035);
    }
  }
  private ramp() {
    if (!this.context || !this.master) return;
    const t = this.context.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.effectiveVolume, t, 0.13);
    if (this.voiceGain)
      this.voiceGain.gain.setTargetAtTime(
        this.playing && !this.muted && this.mode !== "microphone"
          ? this.volume
          : 0,
        t,
        0.07,
      );
  }
  setVolume(v: number) {
    this.volume = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.45;
    this.ramp();
  }
  mute() {
    this.muted = true;
    this.cancelVoice();
    if (this.mode === "dialogue") this.mode = "exploration";
    this.ramp();
  }
  unmute() {
    this.muted = false;
    this.ramp();
  }
  pause() {
    this.playing = false;
    this.cancelVoice();
    if (this.mode === "dialogue") this.mode = "exploration";
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.ramp();
  }
  duckForDialogue() {
    this.cancelVoice();
    this.mode = "dialogue";
    this.ramp();
  }
  restoreAfterDialogue() {
    if (this.mode === "dialogue") {
      this.mode = "exploration";
      this.ramp();
    }
  }
  startMicrophoneMode() {
    this.cancelVoice();
    this.mode = "microphone";
    this.ramp();
  }
  endMicrophoneMode() {
    this.mode = "exploration";
    this.ramp();
  }
  effect(kind: SoundEvent, id: number) {
    if (this.seen.has(id)) return;
    this.seen.add(id);
    if (this.seen.size > 100)
      this.seen.delete(this.seen.values().next().value!);
    if (!this.context || !this.playing) return;
    const t = this.context.currentTime;
    if (kind === "rewind" || kind === "midnight") {
      this.cancelVoice();
      this.mode = "exploration";
      this.ramp();
      if (this.filter) {
        this.filter.frequency.cancelScheduledValues(t);
        this.filter.frequency.setTargetAtTime(140, t, 0.05);
        this.filter.frequency.setTargetAtTime(2800, t + 0.65, 0.16);
      }
      [660, 523, 392, 293, 146].forEach((f, i) =>
        this.tone(f, t + i * 0.1, 0.6, 0.16, "triangle"),
      );
      if (kind === "midnight") this.tone(55, t, 2, 0.16);
    }
    if (kind === "clue")
      [523.25, 659.25, 783.99].forEach((f, i) =>
        this.tone(f, t + i * 0.12, 0.7, 0.14),
      );
    if (kind === "step") {
      this.tone(70, t, 0.12, 0.12);
      this.tone(85, t + 0.19, 0.1, 0.1);
    }
    if (kind === "door") {
      this.tone(110, t, 0.4, 0.07, "sawtooth");
      this.tone(58, t + 0.3, 0.15, 0.17);
    }
    if (kind === "ending")
      [261.63, 329.63, 392, 523.25, 659.25, 783.99, 523.25].forEach((f, i) =>
        this.tone(f, t + i * 0.22, 1.4, 0.16, "triangle"),
      );
  }
  async speak(text: string, level: Level, voiceKey?: string) {
    if (!this.playing || this.muted || this.mode === "microphone") {
      this.restoreAfterDialogue();
      return;
    }
    this.duckForDialogue();
    const token = this.token;
    if (voiceKey) {
      try {
        if (!this.context) throw new Error("No context");
        const url = `/audio/${level}-${voiceKey}.mp3`;
        let buffer = this.cache.get(url);
        if (!buffer) {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Speech unavailable");
          buffer = await this.context.decodeAudioData(
            await response.arrayBuffer(),
          );
          this.cache.set(url, buffer);
        }
        if (token !== this.token || !this.playing || this.muted) return;
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        this.voiceGain ??= this.context.createGain();
        this.voiceGain.disconnect();
        this.voiceGain.connect(this.context.destination);
        this.voiceGain.gain.value = this.volume;
        source.connect(this.voiceGain);
        source.onended = () => {
          source.disconnect();
          if (token === this.token) this.restoreAfterDialogue();
        };
        this.voice = source;
        source.start();
        return;
      } catch {
        /* Dynamic browser speech is the supported fallback. */
      }
    }
    if (token !== this.token) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.restoreAfterDialogue();
      return;
    }
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("de"));
    if (!voice) {
      this.restoreAfterDialogue();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    u.voice = voice;
    u.rate = level === "A1" ? 0.76 : 0.9;
    u.volume = this.volume;
    u.onend = u.onerror = () => {
      if (token === this.token) this.restoreAfterDialogue();
    };
    window.speechSynthesis.speak(u);
  }
  private cancelVoice() {
    this.token++;
    if (this.voice) {
      try {
        this.voice.stop();
      } catch {}
      this.voice = undefined;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  }
  dispose() {
    this.pause();
    this.rain?.stop();
    void this.context?.close();
  }
}
