import type { Intent } from "./narrative";
export type LanguageMemory = {
  phrases: string[];
  intents: Intent[];
  vocabulary: string[];
};
const vocabulary: Partial<Record<Intent, string[]>> = {
  request_key: ["der Schlüssel", "der Keller"],
  ask_recording: ["die Aufnahme"],
  ask_painting: ["das Bild"],
  ask_nora: ["die Nachbarin"],
  explain: ["das Wasser", "helfen"],
  present_evidence: ["der Hinweis"],
};
/** Observations never grade input, grant items or interrupt a conversation. */
export function observeLanguage(
  previous: LanguageMemory,
  phrase: string,
  intent: Intent,
): LanguageMemory {
  return {
    phrases: [...new Set([...previous.phrases, phrase])].slice(-60),
    intents: [...new Set([...previous.intents, intent])],
    vocabulary: [
      ...new Set([
        ...previous.vocabulary,
        ...(vocabulary[intent] || ["der Hinweis"]),
      ]),
    ],
  };
}
