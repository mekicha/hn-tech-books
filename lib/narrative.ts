import { observeLanguage, type LanguageMemory } from "./learning";
import { characters, objects, storyLine, type Line } from "./story";
export type Level = "A1" | "A2";
export type LocationId = "hallway" | "office" | "basement";
export type CharacterId = "lena" | "weber" | "milo";
export type ClueId =
  "note" | "photo" | "witness" | "log" | "recording" | "frame" | "nora";
export type ObjectId =
  | "note"
  | "painting-space"
  | "noticeboard"
  | "apartment"
  | "light"
  | "clock"
  | "basement-door"
  | "log"
  | "photo"
  | "keys"
  | "desk"
  | "drawer"
  | "radio"
  | "canvas"
  | "boxes"
  | "tape"
  | "frame"
  | "archive";
export const intents = [
  "request_key",
  "explain",
  "ask_painting",
  "ask_nora",
  "ask_events",
  "ask_recording",
  "present_evidence",
  "greeting",
  "help",
  "unknown",
] as const;
export type Intent = (typeof intents)[number];
export const clueIds: ClueId[] = [
  "note",
  "photo",
  "witness",
  "log",
  "recording",
  "frame",
  "nora",
];
export type Interpretation = {
  intent: Intent;
  confidence: number;
  tone: "polite" | "direct" | "urgent" | "hostile";
  referencedEvidence: ClueId[];
  needsClarification: boolean;
};
export type Memory = {
  turns: number;
  asked: Intent[];
  mood: "guarded" | "annoyed" | "listening" | "helpful";
  reasonAsked: boolean;
};
export type World = {
  scene: LocationId;
  seconds: number;
  key: boolean;
  basementOpen: boolean;
  paintingRecovered: boolean;
  noraRescued: boolean;
  inspected: ObjectId[];
  memory: Record<CharacterId, Memory>;
};
export type Dialogue = Line & { speaker: CharacterId | "narrator" | "nora" };
export type Attempt = { phrase: string; outcome: string };
export type GameState = {
  version: 2;
  started: boolean;
  level: Level;
  night: number;
  knowledge: ClueId[];
  language: LanguageMemory;
  world: World;
  active: CharacterId;
  dialogue: Dialogue;
  checkpoint: {
    world: World;
    dialogue: Dialogue;
    active: CharacterId;
    attempt: Attempt;
  } | null;
  comparison: { before: Attempt; after: Attempt | null } | null;
  rewinds: number;
  ending: "complete" | "incomplete" | null;
  event:
    | "none"
    | "step"
    | "door"
    | "clue"
    | "dialogue"
    | "rewind"
    | "midnight"
    | "ending";
  eventId: number;
  demo: boolean;
  preferences: { volume: number; muted: boolean; english: boolean };
};
const unique = <T>(xs: T[]) => [...new Set(xs)];
export function freshWorld(): World {
  const memory = () =>
    ({ turns: 0, asked: [], mood: "guarded", reasonAsked: false }) as Memory;
  return {
    scene: "hallway",
    seconds: 86220,
    key: false,
    basementOpen: false,
    paintingRecovered: false,
    noraRescued: false,
    inspected: [],
    memory: { lena: memory(), weber: memory(), milo: memory() },
  };
}
export function newGame(level: Level = "A1", demo = false): GameState {
  const s: GameState = {
    version: 2,
    started: true,
    level,
    night: 1,
    knowledge: [],
    language: { phrases: [], intents: [], vocabulary: [] },
    world: freshWorld(),
    active: "lena",
    dialogue: { ...storyLine("intro", level), speaker: "narrator" },
    checkpoint: null,
    comparison: null,
    rewinds: 0,
    ending: null,
    event: "none",
    eventId: 0,
    demo,
    preferences: { volume: 0.45, muted: false, english: level === "A1" },
  };
  if (demo) {
    s.night = 2;
    s.knowledge = ["note", "log"];
    s.world.scene = "office";
    s.active = "weber";
    s.dialogue = {
      de: characters.weber.greeting[level],
      en: characters.weber.en,
      outcome:
        "Demo: the journal already contains the note and maintenance record.",
      speaker: "weber",
      voice: "greeting-weber",
    };
  }
  return s;
}
export function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 3600) % 24).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}`;
}
export function hasAccessEvidence(s: GameState) {
  return (
    s.knowledge.includes("log") &&
    (s.knowledge.includes("note") || s.knowledge.includes("witness"))
  );
}
export function completeEvidence(s: GameState) {
  return clueIds.every((c) => s.knowledge.includes(c)) && s.world.noraRescued;
}
function event(s: GameState, kind: GameState["event"]): GameState {
  return { ...s, event: kind, eventId: s.eventId + 1 };
}
function line(
  s: GameState,
  key: string,
  speaker: Dialogue["speaker"] = "narrator",
): GameState {
  return { ...s, dialogue: { ...storyLine(key, s.level), speaker } };
}
function narrate(
  s: GameState,
  de: string,
  en: string,
  outcome = "A detail worth remembering.",
): GameState {
  return { ...s, dialogue: { de, en, outcome, speaker: "narrator" } };
}
function collect(s: GameState, id: ClueId): GameState {
  return { ...s, knowledge: unique([...s.knowledge, id]) };
}
export function midnight(s: GameState): GameState {
  return event(
    line(
      {
        ...s,
        night: s.night + 1,
        world: freshWorld(),
        active: "lena",
        checkpoint: null,
        comparison: null,
      },
      "midnight",
    ),
    "midnight",
  );
}
function advance(s: GameState, cost: number): GameState {
  if (s.ending) return s;
  const seconds = s.world.seconds + cost;
  if (seconds >= 86400) return midnight(s);
  return { ...s, world: { ...s.world, seconds } };
}
export function interpretLocal(text: string): Interpretation {
  const t = text.toLowerCase().normalize("NFC");
  let intent: Intent = "unknown";
  if (/schl[üu]ss|schluess|key|keller.*(geh|rein|auf)|basement/.test(t))
    intent = "request_key";
  else if (
    /aufnahme|geh[öo]rt|h[öo]ren|musik|ger[äa]usch|record|tape|sound/.test(t)
  )
    intent = "ask_recording";
  else if (/bild|gem[äa]lde|painting|kunst/.test(t)) intent = "ask_painting";
  else if (/nora|nachbar|vermisst|neighbor/.test(t)) intent = "ask_nora";
  else if (/wasser|rohr|nass|rett|gefahr|water|flood/.test(t))
    intent = "explain";
  else if (/zettel|protokoll|beweis|foto|photo|hinweis|evidence/.test(t))
    intent = "present_evidence";
  else if (/passiert|gesehen|warum|happened/.test(t)) intent = "ask_events";
  else if (/hilf|help|versteh/.test(t)) intent = "help";
  else if (/hallo|guten|hi\b|hey/.test(t)) intent = "greeting";
  const tone = /idiot|dumm|stupid|sofort|gib mir/.test(t)
    ? "hostile"
    : /schnell|gefahr|rett|hurry/.test(t)
      ? "urgent"
      : /bitte|k[öo]nnt|entschuld|danke|please/.test(t)
        ? "polite"
        : "direct";
  const evidence: ClueId[] = [];
  if (/zettel|notiz|note/.test(t)) evidence.push("note");
  if (/protokoll|rohr|wasser|log|water|flood/.test(t)) evidence.push("log");
  if (/foto|eva|photo/.test(t)) evidence.push("photo");
  if (/lena|zeug|witness/.test(t)) evidence.push("witness");
  if (/aufnahme|record|tape/.test(t)) evidence.push("recording");
  return {
    intent,
    confidence: intent === "unknown" ? 0.2 : 0.9,
    tone,
    referencedEvidence: evidence,
    needsClarification: intent === "unknown",
  };
}
export function validateInterpretation(
  raw: unknown,
  known: ClueId[],
): Interpretation {
  const x = raw as Partial<Interpretation> | null;
  if (
    !x ||
    !intents.includes(x.intent as Intent) ||
    !["polite", "direct", "urgent", "hostile"].includes(String(x.tone)) ||
    typeof x.confidence !== "number" ||
    !Number.isFinite(x.confidence) ||
    x.confidence < 0 ||
    x.confidence > 1 ||
    typeof x.needsClarification !== "boolean" ||
    !Array.isArray(x.referencedEvidence)
  )
    return {
      intent: "unknown",
      confidence: 0,
      tone: "direct",
      referencedEvidence: [],
      needsClarification: true,
    };
  return {
    intent: x.intent!,
    tone: x.tone!,
    confidence: x.confidence,
    needsClarification: x.needsClarification || x.confidence < 0.45,
    referencedEvidence: unique(
      x.referencedEvidence.filter(
        (e): e is ClueId =>
          clueIds.includes(e as ClueId) && known.includes(e as ClueId),
      ),
    ),
  };
}
export type Action =
  | { type: "new"; level: Level; demo?: boolean }
  | { type: "load"; state: GameState }
  | { type: "move"; scene: LocationId }
  | { type: "inspect"; id: ObjectId }
  | { type: "character"; id: CharacterId }
  | { type: "talk"; text: string; interpretation?: unknown }
  | { type: "rewind" }
  | { type: "wait" }
  | { type: "resolve" }
  | { type: "preferences"; value: Partial<GameState["preferences"]> };
export function reduce(s: GameState, a: Action): GameState {
  if (a.type === "new")
    return {
      ...newGame(a.level, a.demo),
      preferences: { ...s.preferences, english: a.level === "A1" },
      eventId: s.eventId + 1,
    };
  if (a.type === "load") return { ...a.state, event: "none" };
  if (a.type === "preferences")
    return { ...s, preferences: { ...s.preferences, ...a.value } };
  if (s.ending) return s;
  if (a.type === "rewind") {
    if (!s.checkpoint) return s;
    const c = s.checkpoint;
    return event(
      {
        ...s,
        world: structuredClone(c.world),
        active: c.active,
        dialogue: c.dialogue,
        checkpoint: null,
        comparison: { before: c.attempt, after: null },
        rewinds: s.rewinds + 1,
      },
      "rewind",
    );
  }
  if (a.type === "wait") return midnight(s);
  if (a.type === "move") {
    if (
      !["hallway", "office", "basement"].includes(a.scene) ||
      a.scene === s.world.scene
    )
      return s;
    if (a.scene === "basement" && !s.world.key)
      return event(
        narrate(
          s,
          "Die Kellertür ist zu. Herr Weber hat den Schlüssel.",
          "The basement is locked. Herr Weber has the key.",
          "Ask Weber. Give him a reason supported by evidence.",
        ),
        "door",
      );
    const active = a.scene === "office" ? "weber" : "lena";
    return advance(
      event(
        {
          ...s,
          world: {
            ...s.world,
            scene: a.scene,
            basementOpen: a.scene === "basement" || s.world.basementOpen,
          },
          active,
          checkpoint: null,
          comparison: null,
          dialogue:
            a.scene === "basement"
              ? {
                  speaker: "narrator",
                  de: "Eine blaue Decke. Ein leises Klopfen. Die Nacht hält den Atem an.",
                  en: "A blue blanket. A faint knock. The night holds its breath.",
                  outcome:
                    "Look carefully. The painting is only half the mystery.",
                }
              : {
                  speaker: active,
                  voice: "greeting-" + active,
                  de: characters[active].greeting[s.level],
                  en: characters[active].en,
                  outcome: "Choose a person or examine the scene.",
                },
        },
        a.scene === "basement" ? "door" : "step",
      ),
      s.night === 1 ? 20 : 8,
    );
  }
  if (a.type === "character") {
    if (characters[a.id]?.location !== s.world.scene) return s;
    return event(
      {
        ...s,
        active: a.id,
        checkpoint: null,
        comparison: null,
        dialogue: {
          speaker: a.id,
          voice: "greeting-" + a.id,
          de: characters[a.id].greeting[s.level],
          en: characters[a.id].en,
          outcome: s.world.memory[a.id].turns
            ? "They remember your conversation this night."
            : "A conversation can change the night.",
        },
      },
      "dialogue",
    );
  }
  if (a.type === "inspect") {
    const obj = objects.find(
      (o) => o.id === a.id && o.location === s.world.scene,
    );
    if (!obj) return s;
    const known = s.world.inspected.includes(a.id);
    let next: GameState = {
      ...s,
      world: { ...s.world, inspected: unique([...s.world.inspected, a.id]) },
      dialogue: {
        de: obj.de,
        en: obj.en,
        outcome: obj.clue
          ? "A clue joins your permanent journal."
          : "Look closer. Not every detail is evidence.",
        speaker: "narrator",
      },
    };
    if (
      a.id === "archive" &&
      s.knowledge.includes("log") &&
      s.knowledge.includes("recording")
    ) {
      next = collect(
        line(
          { ...next, world: { ...next.world, noraRescued: true } },
          "nora",
          "nora",
        ),
        "nora",
      );
    } else if (a.id === "tape" && s.knowledge.includes("recording"))
      next = line(next, "recording", "milo");
    if (obj.clue) next = collect(next, obj.clue);
    if (a.id === "canvas")
      next = { ...next, world: { ...next.world, paintingRecovered: true } };
    return advance(
      event(
        next,
        next.knowledge.length > s.knowledge.length
          ? "clue"
          : a.id === "archive" && next.world.noraRescued
            ? "door"
            : "step",
      ),
      s.night === 1 ? 30 : known ? 4 : 12,
    );
  }
  if (a.type === "resolve") {
    if (!s.world.paintingRecovered)
      return event(
        narrate(
          s,
          "Das Bild ist noch nicht gefunden. Die Nacht ist noch nicht vorbei.",
          "You have not found the painting yet. The night is not over.",
        ),
        "dialogue",
      );
    return event(
      {
        ...s,
        ending: completeEvidence(s) ? "complete" : "incomplete",
        checkpoint: null,
      },
      "ending",
    );
  }
  if (a.type === "talk") {
    const text = a.text.trim().slice(0, 500);
    if (!text || characters[s.active].location !== s.world.scene) return s;
    const interpretation = validateInterpretation(
      a.interpretation ?? interpretLocal(text),
      s.knowledge,
    );
    const { intent, tone } = interpretation;
    const actor = s.active;
    const oldMemory = s.world.memory[actor];
    const memory = {
      ...oldMemory,
      turns: oldMemory.turns + 1,
      asked: unique([...oldMemory.asked, intent]),
    };
    let next: GameState = {
      ...s,
      world: { ...s.world, memory: { ...s.world.memory, [actor]: memory } },
      language: observeLanguage(s.language, text, intent),
    };
    const clearlyExplains =
      interpretation.referencedEvidence.some((x) =>
        ["note", "log", "witness"].includes(x),
      ) ||
      /wasser|rohr|rett|water|flood|gefahr|nora.*(unten|keller)/i.test(text);
    if (interpretation.needsClarification) next = line(next, "unclear", actor);
    else if (actor === "weber") {
      if (s.world.key && intent === "request_key") {
        next = {
          ...next,
          dialogue: {
            speaker: "weber",
            de: "Sie haben den Schlüssel schon. Bitte finden Sie Nora. Und schließen Sie hinter sich ab!",
            en: "You already have the key. Please find Nora. And lock up behind you!",
            outcome: "Weber remembers: the key is already yours.",
          },
        };
      } else if (
        (intent === "request_key" ||
          intent === "explain" ||
          intent === "present_evidence") &&
        hasAccessEvidence(s) &&
        (clearlyExplains || (oldMemory.reasonAsked && intent !== "request_key"))
      ) {
        if (s.night === 1) {
          next = line(next, "firstloop", actor);
          next = { ...next, world: { ...next.world, seconds: 86388 } };
        } else {
          next = line(next, "evidence", actor);
          next = {
            ...next,
            world: {
              ...next.world,
              key: true,
              memory: {
                ...next.world.memory,
                weber: { ...memory, mood: "helpful", reasonAsked: false },
              },
            },
          };
        }
      } else if (intent === "request_key") {
        if (tone === "hostile") {
          next = line(next, "refuse", actor);
          next.world.memory.weber = { ...memory, mood: "annoyed" };
        } else {
          next = line(next, "reason", actor);
          next.world.memory.weber = {
            ...memory,
            mood: "listening",
            reasonAsked: true,
          };
        }
      } else if (["explain", "present_evidence"].includes(intent))
        next = line(next, "missing", actor);
      else if (
        s.knowledge.includes("photo") &&
        ["ask_painting", "ask_nora", "ask_events"].includes(intent)
      )
        next = line(next, "sentimental", actor);
      else if (["ask_painting", "ask_nora", "ask_events"].includes(intent))
        next = narrate(
          next,
          "Das Bild? Ich habe es nicht gestohlen. Nora hilft manchmal im Haus. Fragen Sie Lena.",
          "The painting? I did not steal it. Nora helps in the building. Ask Lena.",
          "Weber denies theft. Is he hiding something?",
        );
      else next = line(next, intent === "help" ? "missing" : "reason", actor);
    } else if (actor === "lena") {
      if (
        ["ask_painting", "ask_nora", "ask_events", "present_evidence"].includes(
          intent,
        )
      )
        next = collect(line(next, "witness", actor), "witness");
      else
        next = {
          ...next,
          dialogue: {
            speaker: actor,
            de:
              s.level === "A1"
                ? "Frag mich nach Nora oder dem Bild. Und bitte nicht nach meinem Kaffee."
                : "Frag ruhig nach Nora oder dem verschwundenen Bild. Mein Kaffee ist dagegen ein hoffnungsloser Fall.",
            en: "Ask me about Nora or the painting. Please don’t ask about my coffee.",
            outcome: "Lena has a story to tell.",
          },
        };
    } else if (actor === "milo") {
      if (
        [
          "ask_recording",
          "ask_nora",
          "ask_events",
          "ask_painting",
          "present_evidence",
        ].includes(intent)
      )
        next = collect(line(next, "recording", actor), "recording");
      else
        next = {
          ...next,
          dialogue: {
            speaker: actor,
            de: "Ich habe etwas aufgenommen. Frag mich nach dem Geräusch. Oder nach Nora.",
            en: "I recorded something. Ask me about the sound, or about Nora.",
            outcome: "Milo has a recording, not an alibi.",
          },
        };
    }
    // A previously answered question is remembered within this loop, not across midnight.
    if (
      oldMemory.asked.includes(intent) &&
      next.knowledge.length === s.knowledge.length &&
      !(next.world.key && !s.world.key) &&
      next.dialogue.voice
    ) {
      next = {
        ...next,
        dialogue: {
          ...next.dialogue,
          de: "Wie gesagt: " + next.dialogue.de,
          voice: undefined,
        },
      };
    }
    const attempt = { phrase: text, outcome: next.dialogue.outcome };
    next = {
      ...next,
      checkpoint: {
        world: structuredClone(s.world),
        dialogue: s.dialogue,
        active: actor,
        attempt,
      },
      comparison: s.comparison ? { ...s.comparison, after: attempt } : null,
    };
    return advance(
      event(
        next,
        next.knowledge.length > s.knowledge.length ||
          (next.world.key && !s.world.key)
          ? "clue"
          : "dialogue",
      ),
      s.night === 1 ? 35 : 14,
    );
  }
  return s;
}
export function objective(s: GameState): string {
  if (s.night === 1)
    return "Explore the building. Midnight is closer than it looks.";
  if (!s.knowledge.includes("note") || !s.knowledge.includes("log"))
    return "Connect the note in the hallway with Weber’s maintenance log.";
  if (!s.world.key)
    return "Give Weber a reason to open the basement. Evidence matters more than perfect German.";
  if (!s.world.paintingRecovered)
    return "Go downstairs. Look beneath the blue blanket.";
  if (!s.world.noraRescued)
    return "The painting is safe. Listen to Milo’s tape and use the archive’s red lever.";
  if (!completeEvidence(s))
    return "Nora is safe. Connect every clue to understand the whole story.";
  return "All the pieces fit. Close the case and let the night move on.";
}
export const SAVE_KEY = "nochmal-episode-1-v2";
export function restore(raw: string | null): GameState | null {
  try {
    const x = JSON.parse(raw || "null") as GameState;
    if (
      !x ||
      x.version !== 2 ||
      typeof x.started !== "boolean" ||
      typeof x.demo !== "boolean" ||
      !Number.isInteger(x.rewinds) ||
      x.rewinds < 0 ||
      !["A1", "A2"].includes(x.level) ||
      !Number.isInteger(x.night) ||
      x.night < 1 ||
      !x.world ||
      !["hallway", "office", "basement"].includes(x.world.scene) ||
      !Number.isFinite(x.world.seconds) ||
      x.world.seconds < 86220 ||
      x.world.seconds >= 86400
    )
      return null;
    if (
      !Array.isArray(x.knowledge) ||
      !x.knowledge.every((c) => clueIds.includes(c)) ||
      !Array.isArray(x.world.inspected) ||
      !x.world.inspected.every((id) => objects.some((o) => o.id === id))
    )
      return null;
    if (
      !x.language ||
      !["phrases", "intents", "vocabulary"].every(
        (k) =>
          Array.isArray(x.language[k as keyof typeof x.language]) &&
          x.language[k as keyof typeof x.language].every(
            (v) => typeof v === "string",
          ),
      )
    )
      return null;
    if (
      !x.preferences ||
      typeof x.preferences.volume !== "number" ||
      !Number.isFinite(x.preferences.volume) ||
      !["lena", "weber", "milo"].includes(x.active)
    )
      return null;
    if (
      !x.dialogue ||
      typeof x.dialogue.de !== "string" ||
      typeof x.dialogue.en !== "string" ||
      typeof x.dialogue.outcome !== "string" ||
      !["lena", "weber", "milo", "nora", "narrator"].includes(
        x.dialogue.speaker,
      )
    )
      return null;
    for (const id of ["lena", "weber", "milo"] as const) {
      const m = x.world.memory?.[id];
      if (
        !m ||
        !Number.isInteger(m.turns) ||
        !Array.isArray(m.asked) ||
        !m.asked.every((i) => intents.includes(i))
      )
        return null;
    }
    for (const k of [
      "key",
      "basementOpen",
      "paintingRecovered",
      "noraRescued",
    ] as const)
      if (typeof x.world[k] !== "boolean") return null;
    if (![null, "complete", "incomplete"].includes(x.ending)) return null;
    // Checkpoints carry nested world snapshots; discard on reload instead of trusting nested input.
    return {
      ...x,
      checkpoint: null,
      comparison: null,
      event: "none",
      eventId: 0,
      preferences: {
        volume: Math.max(0, Math.min(1, x.preferences.volume)),
        muted: !!x.preferences.muted,
        english: !!x.preferences.english,
      },
    };
  } catch {
    return null;
  }
}
