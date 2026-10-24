import { copy, fallback } from "./game";
import type { Level } from "./game";
export function voiceLines(level: Level): Record<string, string> {
  return {
    intro: copy[level].intro,
    direction: copy[level].direction,
    witness: copy[level].witness,
    bert: copy[level].bert,
    hint: copy[level].hint,
    greeting: fallback("greeting", level),
    routes: fallback("direction", level),
    unknown: fallback("unknown", level),
  };
}
export function voiceAsset(text: string, level: Level) {
  const entry = Object.entries(voiceLines(level)).find(([, de]) => de === text);
  return entry ? `/audio/${level}-voice-${entry[0]}.mp3` : null;
}
