import { describe, it, expect } from "vitest";
import {
  copy,
  fallback,
  inferIntent,
  initialState,
  lines,
  neighbors,
  reducer,
  restore,
  route,
  stations,
} from "../lib/game";
import { songs } from "../lib/songs";
import { AudioDirector } from "../lib/audio";
describe("Berlin graph", () => {
  it("has accurate U3 and U8 adjacency and a single transfer", () => {
    expect(neighbors("kotti")).toEqual(["gorlitzer", "moritz"]);
    expect(neighbors("warschauer")).toEqual(["schlesisches"]);
    expect(route("warschauer", "alex")).toEqual([
      "warschauer",
      "schlesisches",
      "gorlitzer",
      "kotti",
      "moritz",
      "heinrich",
      "jannowitz",
      "alex",
    ]);
    expect(route("alex", "warschauer")).toEqual(
      route("warschauer", "alex").reverse(),
    );
  });
  it("connects every station through symmetric edges", () => {
    for (const s of stations) {
      expect(route("warschauer", s.id).at(-1)).toBe(s.id);
      for (const n of neighbors(s.id)) expect(neighbors(n)).toContain(s.id);
    }
    expect(lines.U3.filter((x) => lines.U8.includes(x))).toEqual(["kotti"]);
  });
});
describe.each(["A1", "A2", "B1"] as const)(
  "%s complete playable mystery",
  (level) => {
    it("selects level, solves both puzzles, collects song clue, and ends only with validated evidence", () => {
      let s = reducer(initialState(), { type: "start", level });
      expect(s.level).toBe(level);
      expect(s.selectedTrack).toBe(level);
      expect(songs[level].lyrics.length).toBeGreaterThan(3);
      s = reducer(s, { type: "witness", intent: "bag" });
      expect(s.witnessSolved).toBe(false);
      s = reducer(s, { type: "arrive", station: "alex" });
      s = reducer(s, { type: "ending", code: "07" });
      expect(s.ended).toBe(false);
      s = reducer(s, { type: "arrive", station: "kotti" });
      expect(s.navigationSolved).toBe(true);
      s = reducer(s, { type: "witness", intent: "greeting" });
      expect(s.witnessSolved).toBe(false);
      s = reducer(s, { type: "witness", intent: "bag" });
      expect(s.inventory).toContain(
        "Deniz’s receipt · Locker 07 · Alexanderplatz",
      );
      s = reducer(s, { type: "song" });
      s = reducer(s, { type: "song" });
      expect(s.inventory.filter((x) => x.startsWith("Lyric"))).toHaveLength(1);
      s = reducer(s, { type: "arrive", station: "alex" });
      expect(reducer(s, { type: "ending", code: "06" }).ended).toBe(false);
      s = reducer(s, { type: "ending", code: "07" });
      expect(s.ended).toBe(true);
      expect(s.inventory).toContain("Ayo’s original recording");
      const saved = restore(JSON.stringify(s));
      expect(saved).toEqual({ ...s, audio: { ...s.audio, playing: false } });
    });
    it("has matching lyrics, translations, direction, and fallback dialogue", () => {
      for (const l of songs[level].lyrics) {
        expect(l.de.length).toBeGreaterThan(10);
        expect(l.en.length).toBeGreaterThan(10);
      }
      expect(songs[level].lyrics.find((x) => x.clue)?.de).toContain(
        "Kottbusser Tor",
      );
      expect(copy[level].witness).toContain("07");
      expect(fallback("bag", level)).toBe(copy[level].witness);
      expect(copy[level].direction).toContain("U3");
    });
  },
);
describe("intent fallback and persistence", () => {
  it.each([
    "hallo gelbe tasch gesehn",
    "Have you seen a yellow bag?",
    "meine Aufnahme ist weg",
    "Wo ist die Tasche?",
  ])("recognizes imperfect German or English: %s", (text) =>
    expect(inferIntent(text)).toBe("bag"),
  );
  it("handles unknown and direction intents without giving a clue", () => {
    expect(inferIntent("Kartoffel")).toBe("unknown");
    expect(inferIntent("Welche Richtung?")).toBe("direction");
  });
  it("rejects corrupt, stale or incomplete saves", () => {
    expect(restore("{")).toEqual(initialState());
    expect(restore(JSON.stringify({ version: 2 }))).toEqual(initialState());
    expect(
      restore(JSON.stringify({ version: 1, level: "A1", station: "kotti" })),
    ).toEqual(initialState());
  });
  it("persists audio preferences without autoplay on reload", () => {
    const s = reducer(initialState(), {
      type: "audio",
      audio: { volume: 0.8, muted: true, playing: true },
    });
    expect(restore(JSON.stringify(s)).audio).toEqual({
      volume: 0.8,
      muted: true,
      playing: false,
    });
  });
});
describe("reactive audio state", () => {
  it("ducks, suppresses microphone, restores, mutes, clamps volume, and pauses safely", () => {
    const a = new AudioDirector();
    a.playing = true;
    a.setVolume(0.6);
    expect(a.effectiveVolume).toBe(0.6);
    a.duckForDialogue();
    expect(a.effectiveVolume).toBeCloseTo(0.09);
    a.startMicrophoneMode();
    expect(a.effectiveVolume).toBeLessThan(0.01);
    a.restoreAfterDialogue();
    expect(a.mode).toBe("microphone");
    a.endMicrophoneMode();
    expect(a.effectiveVolume).toBe(0.6);
    a.onTrainDepart();
    expect(a.mode).toBe("travel");
    a.onStationArrive("kotti");
    expect(a.mode).toBe("exploration");
    a.mute();
    expect(a.effectiveVolume).toBe(0);
    a.unmute();
    a.setVolume(9);
    expect(a.volume).toBe(1);
    a.pauseTrack();
    expect(a.playing).toBe(false);
    expect(a.effectiveVolume).toBe(0);
  });
  it("deduplicates arrival, clue and ending cues, resets on rewind", () => {
    const a = new AudioDirector();
    let n = 0;
    Object.assign(a, { sting: () => n++ });
    a.onStationArrive("kotti");
    a.onStationArrive("kotti");
    a.onClueDiscovered("song");
    a.onClueDiscovered("song");
    a.onMysterySolved();
    a.onMysterySolved();
    expect(n).toBe(3);
    a.onRewind();
    a.onStationArrive("kotti");
    expect(n).toBe(5);
  });
});
describe("cancelled dialogue lifecycle", () => {
  it("restores exploration when mute or pause cancels an unfinished voice", () => {
    const a = new AudioDirector();
    a.playing = true;
    a.duckForDialogue();
    a.mute();
    a.unmute();
    expect(a.mode).toBe("exploration");
    expect(a.effectiveVolume).toBe(a.volume);
    a.duckForDialogue();
    a.pauseTrack();
    expect(a.mode).toBe("exploration");
  });
  it("does not leave a pre-ducked request stuck when sound is off", () => {
    const a = new AudioDirector();
    a.duckForDialogue();
    a.speak("Hallo");
    expect(a.mode).toBe("exploration");
  });
});
