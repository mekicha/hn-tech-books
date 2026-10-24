import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { songs } from "../lib/songs";
import { voiceAsset, voiceLines } from "../lib/voices";
describe("bundled synthetic German", () => {
  for (const level of ["A1", "A2", "B1"] as const)
    it(`${level} includes playable lyric passages and dialogue without browser voices`, () => {
      for (const i of songs[level].lyrics.keys()) {
        const bytes = readFileSync(`public/audio/${level}-${i}.mp3`);
        expect(bytes.length).toBeGreaterThan(5000);
        expect(bytes.toString("ascii", 0, 3)).toBe("ID3");
      }
      for (const text of Object.values(voiceLines(level))) {
        const file = voiceAsset(text, level);
        expect(file).not.toBeNull();
        expect(existsSync("public" + file)).toBe(true);
      }
    });
});
