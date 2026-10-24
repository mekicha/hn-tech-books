// Offline generation tool; no hosted voice service or runtime subscription.
import ESpeakNg from "espeak-ng";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import { lines, characters } from "../lib/story.ts";
const require = createRequire(import.meta.url);
const wasm = await readFile(
  require.resolve("espeak-ng").replace(/espeak-ng\.js$/, "espeak-ng.wasm"),
);
await mkdir(new URL("../public/audio/", import.meta.url), { recursive: true });
for (const level of ["A1", "A2"]) {
  const passages = [
    ...Object.entries(lines).map(([key, variant]) => [key, variant[level].de]),
    ...Object.entries(characters).map(([key, c]) => [
      "greeting-" + key,
      c.greeting[level],
    ]),
  ];
  for (const [key, de] of passages) {
    const synth = await ESpeakNg({
      wasmBinary: wasm,
      arguments: [
        "-v",
        "de",
        "-s",
        level === "A1" ? "120" : "145",
        "-w",
        "line.wav",
        de,
      ],
      print: () => {},
      printErr: () => {},
    });
    const wav = synth.FS.readFile("line.wav");
    if (wav.length < 1000) throw new Error("Empty voice output");
    const dest = fileURLToPath(
      new URL(`../public/audio/${level}-${key}.mp3`, import.meta.url),
    );
    const result = spawnSync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        "pipe:0",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "64k",
        dest,
      ],
      { input: wav },
    );
    if (result.status !== 0)
      throw new Error("FFmpeg required: " + String(result.stderr));
    console.log(`${level}-${key}.mp3`);
  }
}
