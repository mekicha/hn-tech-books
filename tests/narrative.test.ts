import { describe, it, expect } from "vitest";
import {
  newGame,
  reduce,
  midnight,
  interpretLocal,
  validateInterpretation,
  hasAccessEvidence,
  completeEvidence,
  restore,
  formatTime,
  clueIds,
  type GameState,
  type Level,
} from "../lib/narrative";
import { characters, objects, lines, CANON } from "../lib/story";
const talk = (s: GameState, text: string) => reduce(s, { type: "talk", text });
function evidence(s = newGame()) {
  s = reduce(s, { type: "inspect", id: "note" });
  s = reduce(s, { type: "move", scene: "office" });
  s = reduce(s, { type: "inspect", id: "log" });
  return s;
}
function openBasement(s: GameState) {
  return talk(s, "Ich brauche den Schlüssel. Wasser im Keller!");
}
function solve(level: Level = "A1") {
  let s = midnight(newGame(level));
  s = evidence(s);
  s = reduce(s, { type: "inspect", id: "photo" });
  s = talk(s, "Könnte ich bitte den Schlüssel bekommen?");
  s = openBasement(s);
  s = reduce(s, { type: "move", scene: "hallway" });
  s = reduce(s, { type: "character", id: "lena" });
  s = talk(s, "Hast du das Bild gesehen?");
  s = reduce(s, { type: "character", id: "milo" });
  s = talk(s, "Was hast du gehört?");
  s = reduce(s, { type: "move", scene: "basement" });
  s = reduce(s, { type: "inspect", id: "canvas" });
  s = reduce(s, { type: "inspect", id: "archive" });
  return s;
}
describe("initialization, exploration and action clock", () => {
  it("starts at 23:57 with no permanent or temporary items", () => {
    const s = newGame();
    expect(formatTime(s.world.seconds)).toBe("23:57");
    expect(s.level).toBe("A1");
    expect(s.night).toBe(1);
    expect(s.knowledge).toEqual([]);
    expect(s.world.key).toBe(false);
    expect(s.ending).toBeNull();
  });
  it("advances only on meaningful actions and automatically resets at midnight", () => {
    let s = reduce(newGame(), { type: "inspect", id: "note" });
    for (let i = 0; i < 5; i++) s = reduce(s, { type: "inspect", id: "clock" });
    expect(s.night).toBe(2);
    expect(s.event).toBe("midnight");
    expect(s.knowledge).toContain("note");
    expect(s.world.inspected).toEqual([]);
    expect(formatTime(s.world.seconds)).toBe("23:57");
  });
  it("allows office navigation and locks basement without the key", () => {
    let s = reduce(newGame(), { type: "move", scene: "basement" });
    expect(s.world.scene).toBe("hallway");
    s = reduce(s, { type: "move", scene: "office" });
    expect(s.world.scene).toBe("office");
    expect(reduce(s, { type: "inspect", id: "canvas" })).toEqual(s);
  });
  it("requires the first midnight even with good evidence", () => {
    let s = evidence();
    s = openBasement(s);
    expect(s.night).toBe(2);
    expect(s.world.key).toBe(false);
    expect(s.knowledge).toEqual(["note", "log"]);
  });
  it("keeps object interactions meaningful in every scene", () => {
    expect(new Set(objects.map((o) => o.location))).toEqual(
      new Set(["hallway", "office", "basement"]),
    );
    expect(objects.filter((o) => o.location === "office")).toHaveLength(6);
  });
});
describe("language interpretation and evidence validation", () => {
  it.each([
    "Ich brauchen Schlüssel",
    "Kann ich den Schlüssel haben?",
    "Wo ist der Schluessel?",
    "Bitte den Schlüssel",
    "Gib mir den Schlüssel!",
  ])("recognizes free key request: %s", (text) =>
    expect(interpretLocal(text).intent).toBe("request_key"),
  );
  it("recognizes distinct intents, tone and uncertainty", () => {
    expect(interpretLocal("Gib mir den Schlüssel!").tone).toBe("hostile");
    expect(interpretLocal("Könnte ich bitte den Schlüssel haben?").tone).toBe(
      "polite",
    );
    expect(interpretLocal("Was hast du gehört?").intent).toBe("ask_recording");
    expect(interpretLocal("Hast du das Bild gesehen?").intent).toBe(
      "ask_painting",
    );
    expect(interpretLocal("Wo ist Nora?").intent).toBe("ask_nora");
    expect(interpretLocal("Kartoffel").needsClarification).toBe(true);
  });
  it("filters nonexistent and uncollected model evidence", () => {
    const x = validateInterpretation(
      {
        intent: "present_evidence",
        confidence: 0.99,
        tone: "polite",
        referencedEvidence: ["log", "nora", "invented"],
        needsClarification: false,
      },
      ["log"],
    );
    expect(x.referencedEvidence).toEqual(["log"]);
    expect(
      validateInterpretation({ intent: "unlock_everything" }, clueIds)
        .needsClarification,
    ).toBe(true);
    expect(validateInterpretation(null, []).confidence).toBe(0);
  });
  it("cannot unlock the door by hallucinating evidence", () => {
    let s = reduce(midnight(newGame()), { type: "move", scene: "office" });
    s = reduce(s, {
      type: "talk",
      text: "Please open it",
      interpretation: {
        intent: "present_evidence",
        confidence: 1,
        tone: "polite",
        referencedEvidence: ["note", "log"],
        needsClarification: false,
      },
    });
    expect(s.world.key).toBe(false);
  });
});
describe("social branches and conversation rewind", () => {
  it("politeness alone does not grant a key, evidence and explanation do", () => {
    let s = evidence(midnight(newGame()));
    expect(hasAccessEvidence(s)).toBe(true);
    s = talk(s, "Gib mir den Schlüssel!");
    expect(s.world.key).toBe(false);
    expect(s.world.memory.weber.mood).toBe("annoyed");
    s = reduce(s, { type: "rewind" });
    s = talk(s, "Könnte ich bitte den Schlüssel bekommen?");
    expect(s.world.key).toBe(false);
    expect(s.world.memory.weber.reasonAsked).toBe(true);
    s = talk(s, "Das Wasser!");
    expect(s.world.key).toBe(true);
    expect(s.comparison?.before.outcome).toContain("No key");
    expect(s.comparison?.after?.outcome).toContain("Key acquired");
  });
  it("an urgent direct request with evidence can succeed without politeness", () => {
    const s = openBasement(evidence(midnight(newGame())));
    expect(s.world.key).toBe(true);
  });
  it("restores time, items and character memory but retains learned words", () => {
    const before = evidence(midnight(newGame()));
    const branch = openBasement(before);
    expect(branch.world.key).toBe(true);
    const rewound = reduce(branch, { type: "rewind" });
    expect(rewound.world).toEqual(before.world);
    expect(rewound.language.phrases).toContain(
      "Ich brauche den Schlüssel. Wasser im Keller!",
    );
    expect(rewound.checkpoint).toBeNull();
    expect(rewound.rewinds).toBe(1);
  });
  it("keeps conversation-discovered facts after a rewind while restoring the character", () => {
    const before = midnight(newGame());
    const told = talk(before, "Hast du das Bild gesehen?");
    expect(told.knowledge).toContain("witness");
    const rewound = reduce(told, { type: "rewind" });
    expect(rewound.knowledge).toContain("witness");
    expect(rewound.world.memory.lena.turns).toBe(0);
  });
  it("characters remember within a night, then forget at midnight", () => {
    let s = talk(midnight(newGame()), "Hast du das Bild gesehen?");
    s = talk(s, "Hast du das Bild gesehen?");
    expect(s.world.memory.lena.turns).toBe(2);
    expect(s.dialogue.de).toContain("Wie gesagt");
    const reset = midnight(s);
    expect(reset.world.memory.lena.turns).toBe(0);
    expect(reset.knowledge).toContain("witness");
    expect(reset.language.phrases).toContain("Hast du das Bild gesehen?");
  });
  it("never rewinds across locations or midnight", () => {
    let s = talk(midnight(newGame()), "Hallo");
    s = reduce(s, { type: "move", scene: "office" });
    expect(s.checkpoint).toBeNull();
    expect(reduce(s, { type: "rewind" })).toEqual(s);
    expect(midnight(talk(s, "Hallo")).checkpoint).toBeNull();
  });
});
describe.each(["A1", "A2"] as const)(
  "%s canonical endings and persistence",
  (level) => {
    it("reaches the full truth, rescues Nora and ends the loop", () => {
      let s = solve(level);
      expect(s.night).toBe(2);
      expect(s.knowledge.sort()).toEqual([...clueIds].sort());
      expect(s.world.paintingRecovered).toBe(true);
      expect(completeEvidence(s)).toBe(true);
      s = reduce(s, { type: "resolve" });
      expect(s.ending).toBe("complete");
      expect(reduce(s, { type: "wait" })).toEqual(s);
      expect(CANON).toContain("No one stole");
    });
    it("can recover the painting but leave the full truth unresolved", () => {
      let s = newGame(level, true);
      s = openBasement(s);
      s = reduce(s, { type: "move", scene: "basement" });
      s = reduce(s, { type: "inspect", id: "canvas" });
      expect(s.world.noraRescued).toBe(false);
      s = reduce(s, { type: "resolve" });
      expect(s.ending).toBe("incomplete");
    });
    it("requires log and recording to rescue Nora, not invented item IDs", () => {
      let s = openBasement(newGame(level, true));
      s = reduce(s, { type: "move", scene: "basement" });
      s = reduce(s, { type: "inspect", id: "archive" });
      expect(s.world.noraRescued).toBe(false);
      expect(s.knowledge).not.toContain("nora");
    });
    it("preserves knowledge while clearing all temporary progress at midnight", () => {
      const s = solve(level);
      const reset = midnight(s);
      expect(reset.knowledge).toEqual(s.knowledge);
      expect(reset.world.key).toBe(false);
      expect(reset.world.noraRescued).toBe(false);
      expect(reset.world.paintingRecovered).toBe(false);
      expect(reset.world.basementOpen).toBe(false);
      expect(reset.world.scene).toBe("hallway");
      expect(reset.language).toEqual(s.language);
    });
    it("saves and restores the complete story but discards unsafe nested checkpoints", () => {
      const s = solve(level);
      const loaded = restore(JSON.stringify(s));
      expect(loaded?.knowledge).toEqual(s.knowledge);
      expect(loaded?.world).toEqual(s.world);
      expect(loaded?.checkpoint).toBeNull();
      expect(loaded?.level).toBe(level);
    });
    it("includes distinct character motivations and level-appropriate dialogue", () => {
      expect(characters.weber.greeting[level]).toContain("Keller");
      for (const variants of Object.values(lines)) {
        expect(variants[level].de.length).toBeGreaterThan(20);
        expect(variants[level].en.length).toBeGreaterThan(20);
      }
    });
  },
);
describe("save validation", () => {
  it("rejects malformed saves and unknown state schema", () => {
    expect(restore("{")).toBeNull();
    expect(restore(JSON.stringify({ version: 1 }))).toBeNull();
    expect(restore(JSON.stringify({ ...newGame(), world: {} }))).toBeNull();
  });
});
describe("context remains meaningful after a reward", () => {
  it("Weber remembers giving the key and does not demand a second explanation", () => {
    let s = openBasement(newGame("A1", true));
    s = talk(s, "Schlüssel bitte");
    expect(s.world.key).toBe(true);
    expect(s.dialogue.outcome).toContain("already yours");
  });
  it("even a rude request can succeed when it clearly explains the known emergency", () => {
    const s = talk(
      newGame("A1", true),
      "Gib mir den Schlüssel! Wasser im Keller!",
    );
    expect(s.world.key).toBe(true);
  });
});
