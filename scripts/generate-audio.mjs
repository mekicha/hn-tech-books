// Node >=22.18 can strip the type-only syntax in songs.ts.
import ESpeakNg from "espeak-ng";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import { copy, fallback } from "../lib/game.ts";
import { songs } from "../lib/songs.ts";
const require = createRequire(import.meta.url);
const wasm = await readFile(
  require.resolve("espeak-ng").replace(/espeak-ng\.js$/, "espeak-ng.wasm"),
);
await mkdir(new URL("../public/audio/", import.meta.url), { recursive: true });
for (const [level, song] of Object.entries(songs)) {
  const c = copy[level];
  const voices = {
    intro: c.intro,
    direction: c.direction,
    witness: c.witness,
    bert: c.bert,
    hint: c.hint,
    greeting: fallback("greeting", level),
    routes: fallback("direction", level),
    unknown: fallback("unknown", level),
  };
  for (const [i, line] of [
    ...song.lyrics.map((line, i) => [i, line]),
    ...Object.entries(voices).map(([key, de]) => ["voice-" + key, { de }]),
  ]) {
    const synth = await ESpeakNg({
      wasmBinary: wasm,
      arguments: [
        "-v",
        "de",
        "-s",
        String({ A1: 120, A2: 145, B1: 170 }[level]),
        "-w",
        "line.wav",
        line.de,
      ],
      print: () => {},
      printErr: () => {},
    });
    const wav = synth.FS.readFile("line.wav");
    if (wav.length < 1000) throw new Error("Empty speech output");
    const destination = fileURLToPath(
      new URL(`../public/audio/${level}-${i}.mp3`, import.meta.url),
    );
    const conversion = spawnSync(
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
        destination,
      ],
      { input: wav },
    );
    if (conversion.status !== 0)
      throw new Error(
        "ffmpeg is required to regenerate audio: " + String(conversion.stderr),
      );
    console.log(`${level}-${i}.mp3`);
  }
}
