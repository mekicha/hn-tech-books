import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { AudioDirector } from "../lib/audio";
import { lines, characters } from "../lib/story";
describe("sound direction", () => {
  it("smooth-mode state handles speech, microphone, mute and pause", () => {
    const a = new AudioDirector();
    a.playing = true;
    a.setVolume(0.6);
    expect(a.effectiveVolume).toBe(0.6);
    a.duckForDialogue();
    expect(a.effectiveVolume).toBeCloseTo(0.6 * 0.13);
    a.startMicrophoneMode();
    a.restoreAfterDialogue();
    expect(a.mode).toBe("microphone");
    expect(a.effectiveVolume).toBeLessThan(0.01);
    a.endMicrophoneMode();
    expect(a.effectiveVolume).toBe(0.6);
    a.duckForDialogue();
    a.mute();
    a.unmute();
    expect(a.mode).toBe("exploration");
    expect(a.effectiveVolume).toBe(0.6);
    a.duckForDialogue();
    a.pause();
    expect(a.mode).toBe("exploration");
    expect(a.effectiveVolume).toBe(0);
  });
  it("clamps volume and handles silent spoken dialogue without getting stuck", async () => {
    const a = new AudioDirector();
    a.setVolume(5);
    expect(a.volume).toBe(1);
    a.setVolume(NaN);
    expect(a.volume).toBe(0.45);
    a.duckForDialogue();
    await a.speak("Hallo", "A1");
    expect(a.mode).toBe("exploration");
  });
  for (const level of ["A1", "A2"] as const)
    it(`ships nonempty German ${level} speech for all core branches`, () => {
      for (const key of [
        ...Object.keys(lines),
        ...Object.keys(characters).map((k) => "greeting-" + k),
      ]) {
        const file = readFileSync(`public/audio/${level}-${key}.mp3`);
        expect(file.length).toBeGreaterThan(5000);
        expect(file.toString("ascii", 0, 3)).toBe("ID3");
      }
    });
});
