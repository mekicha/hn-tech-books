export type Level = "A1" | "A2" | "B1";
export type StationId =
  | "warschauer"
  | "schlesisches"
  | "gorlitzer"
  | "kotti"
  | "moritz"
  | "heinrich"
  | "jannowitz"
  | "alex";
export type Intent = "bag" | "direction" | "greeting" | "help" | "unknown";
export const stations: {
  id: StationId;
  name: string;
  x: number;
  y: number;
  scene?: string;
}[] = [
  {
    id: "warschauer",
    name: "Warschauer Straße",
    x: 805,
    y: 340,
    scene: "platform",
  },
  { id: "schlesisches", name: "Schlesisches Tor", x: 655, y: 340 },
  { id: "gorlitzer", name: "Görlitzer Bahnhof", x: 505, y: 340 },
  { id: "kotti", name: "Kottbusser Tor", x: 340, y: 340, scene: "kiosk" },
  { id: "moritz", name: "Moritzplatz", x: 340, y: 255 },
  { id: "heinrich", name: "Heinrich-Heine-Straße", x: 340, y: 180 },
  { id: "jannowitz", name: "Jannowitzbrücke", x: 420, y: 110 },
  { id: "alex", name: "Alexanderplatz", x: 510, y: 40, scene: "machine" },
];
export const lines: Record<"U3" | "U8", StationId[]> = {
  U3: ["warschauer", "schlesisches", "gorlitzer", "kotti"],
  U8: ["kotti", "moritz", "heinrich", "jannowitz", "alex"],
};
export function neighbors(id: StationId) {
  return Object.values(lines).flatMap((line) => {
    const i = line.indexOf(id);
    return i < 0
      ? []
      : ([line[i - 1], line[i + 1]].filter(Boolean) as StationId[]);
  });
}
export function route(from: StationId, to: StationId): StationId[] {
  const queue: StationId[][] = [[from]];
  const seen = new Set<StationId>();
  while (queue.length) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    if (last === to) return path;
    if (seen.has(last)) continue;
    seen.add(last);
    neighbors(last).forEach((n) => queue.push([...path, n]));
  }
  return [];
}
export const nameOf = (id: StationId) =>
  stations.find((s) => s.id === id)!.name;
export type GameState = {
  version: 1;
  level: Level;
  station: StationId;
  visited: StationId[];
  inventory: string[];
  decisions: string[];
  songClue: boolean;
  discoveries: StationId[];
  navigationSolved: boolean;
  witnessSolved: boolean;
  ended: boolean;
  started: boolean;
  selectedTrack: Level;
  audio: { volume: number; muted: boolean; playing: boolean };
};
export function initialState(level: Level = "A1"): GameState {
  return {
    version: 1,
    level,
    station: "warschauer",
    visited: ["warschauer"],
    inventory: [],
    decisions: [],
    songClue: false,
    discoveries: [],
    navigationSolved: false,
    witnessSolved: false,
    ended: false,
    started: false,
    selectedTrack: level,
    audio: { volume: 0.35, muted: false, playing: false },
  };
}
export type Action =
  | { type: "hydrate"; state: GameState }
  | { type: "start"; level: Level }
  | { type: "arrive"; station: StationId }
  | { type: "witness"; intent: Intent }
  | { type: "song" }
  | { type: "ending"; code: string }
  | { type: "audio"; audio: Partial<GameState["audio"]> };
export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "hydrate":
      return a.state;
    case "start":
      return {
        ...initialState(a.level),
        started: true,
        audio: { ...s.audio, playing: true },
      };
    case "arrive":
      if (!stations.some((x) => x.id === a.station) || s.ended) return s;
      return {
        ...s,
        station: a.station,
        visited: [...new Set([...s.visited, a.station])],
        navigationSolved: s.navigationSolved || a.station === "kotti",
        discoveries: [
          ...new Set([
            ...s.discoveries,
            ...(a.station === "kotti" ? [a.station] : []),
          ]),
        ],
      };
    case "witness":
      if (s.station !== "kotti") return s;
      return {
        ...s,
        decisions: [...s.decisions, a.intent],
        witnessSolved: s.witnessSolved || a.intent === "bag",
        inventory:
          a.intent === "bag"
            ? [
                ...new Set([
                  ...s.inventory,
                  "Deniz’s receipt · Locker 07 · Alexanderplatz",
                ]),
              ]
            : s.inventory,
      };
    case "song":
      return {
        ...s,
        songClue: true,
        inventory: [
          ...new Set([
            ...s.inventory,
            "Lyric note · The yellow bag went to Kotti",
          ]),
        ],
      };
    case "ending":
      return s.station === "alex" && s.witnessSolved && a.code.trim() === "07"
        ? {
            ...s,
            ended: true,
            inventory: [
              ...new Set([...s.inventory, "Ayo’s original recording"]),
            ],
          }
        : s;
    case "audio":
      return { ...s, audio: { ...s.audio, ...a.audio } };
  }
}
export const SAVE_KEY = "ubahn-rush-v1";
export function restore(raw: string | null): GameState {
  try {
    const x = JSON.parse(raw || "null");
    if (
      !x ||
      x.version !== 1 ||
      !["A1", "A2", "B1"].includes(x.level) ||
      !stations.some((s) => s.id === x.station)
    )
      return initialState();
    if (
      !["inventory", "visited", "decisions", "discoveries"].every(
        (k) =>
          Array.isArray(x[k]) &&
          x[k].every((v: unknown) => typeof v === "string"),
      )
    )
      return initialState();
    if (
      !x.audio ||
      typeof x.audio.volume !== "number" ||
      !Number.isFinite(x.audio.volume)
    )
      return initialState();
    const base = initialState(x.level);
    return {
      ...base,
      ...x,
      selectedTrack: x.level,
      audio: {
        volume: Math.min(1, Math.max(0, x.audio.volume)),
        muted: !!x.audio.muted,
        playing: false,
      },
      started: !!x.started,
      ended: !!x.ended,
      witnessSolved: !!x.witnessSolved,
      navigationSolved: !!x.navigationSolved,
      songClue: !!x.songClue,
    };
  } catch {
    return initialState();
  }
}
export function inferIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/tasch|bag|gelb|rucksack|beutel|recording|aufnahme/.test(t)) return "bag";
  if (/wo|bahn|richtung|alex|where|zug/.test(t)) return "direction";
  if (/hallo|hi\b|guten|hey|hello/.test(t)) return "greeting";
  if (/hilfe|help|versteh|hint/.test(t)) return "help";
  return "unknown";
}
export const copy: Record<
  Level,
  {
    intro: string;
    direction: string;
    directionEn: string;
    bag: string;
    witness: string;
    bert: string;
    hint: string;
  }
> = {
  A1: {
    intro:
      "Oh nein! Meine gelbe Tasche ist weg. Mein Lied ist in der Tasche! Das Konzert beginnt bald. Hilfst du mir?",
    direction: "Nimm die U3. Fahr zum Kottbusser Tor. Frag Deniz am Kiosk.",
    directionEn: "Take the U3 to Kottbusser Tor. Ask Deniz at the kiosk.",
    bag: "Hallo! Hast du eine gelbe Tasche gesehen?",
    witness:
      "Ja! Eine Frau hatte die Tasche. Sie fährt zum Alexanderplatz. Sie arbeitet im Fundbüro. Hier: Schließfach 07. Deine Tasche ist sicher!",
    bert: "Guten Abend. Ich bin BERTI. Ich habe keine Gefühle. Aber ich mag Fahrkarten. Hast du die Nummer für das Schließfach?",
    hint: "Frag nach der gelben Tasche.",
  },
  A2: {
    intro:
      "Meine gelbe Tasche ist verschwunden! Darin ist die einzige Aufnahme für mein Konzert. Kannst du sie bitte finden?",
    direction:
      "Fahr mit der U3 bis Kottbusser Tor und sprich dort mit Deniz am Kiosk.",
    directionEn:
      "Ride the U3 to Kottbusser Tor and speak to Deniz at the kiosk.",
    bag: "Entschuldigung, hast du vielleicht eine gelbe Tasche gesehen?",
    witness:
      "Klar! Eine Mitarbeiterin vom Fundbüro hat sie mitgenommen. Sie ist zum Alexanderplatz gefahren. Auf diesem Zettel steht die Nummer: Schließfach 07.",
    bert: "Willkommen. Ich bin BERTI, dein sehr gewissenhafter Fahrkartenautomat. Für das Fundfach benötige ich eine zweistellige Nummer. Gefühle sind optional.",
    hint: "Beschreib die Tasche und frag, ob Deniz sie gesehen hat.",
  },
  B1: {
    intro:
      "Ausgerechnet heute verschwindet meine gelbe Tasche – mit der einzigen Aufnahme unseres Songs. Ohne sie fällt der Auftritt ins Wasser. Ich zähle auf dich!",
    direction:
      "Nimm die U3 Richtung Krumme Lanke und steig am Kottbusser Tor aus. Deniz am Kiosk hat bestimmt etwas mitbekommen.",
    directionEn:
      "Take the U3 toward Krumme Lanke; get off at Kottbusser Tor. Deniz may have seen something.",
    bag: "Sag mal, ist dir zufällig jemand mit einer gelben Tasche aufgefallen?",
    witness:
      "Allerdings. Eine Mitarbeiterin der Fundstelle hat die herrenlose Tasche eingesammelt und zum Alexanderplatz gebracht. Bevor du fragst: Nein, ich war’s nicht. Hier ist ihre Quittung: Fach 07.",
    bert: "BERTI zu Diensten. Die Fundstelle wird von mir verwaltet, da Menschen gelegentlich Feierabend machen. Bitte gib die zweistellige Fachnummer ein. Ironie wird nicht als Zahlungsmittel akzeptiert.",
    hint: "Frag nach der verschwundenen Tasche; perfekte Grammatik ist nicht nötig.",
  },
};
export function fallback(intent: Intent, level: Level): string {
  if (intent === "bag") return copy[level].witness;
  if (intent === "greeting")
    return level === "A1"
      ? "Hallo! Ich bin Deniz. Was suchst du?"
      : "Na, willkommen am Kotti! Was führt dich zu meinem weltberühmten Kiosk?";
  if (intent === "direction")
    return "Die U3 und die U8 treffen sich hier. Suchst du etwas?";
  if (intent === "help") return copy[level].hint;
  return level === "A1"
    ? "Ich verstehe nicht ganz. Suchst du eine Tasche?"
    : "Ich verkaufe Mate, keine Gedanken. Was genau suchst du? Eine Tasche vielleicht?";
}

export function translateDialogue(text: string, level: Level): string {
  if (text === copy[level].intro)
    return "Oh no! My yellow bag is missing, with the only recording for tonight’s concert. Can you help me find it?";
  if (text === copy[level].direction) return copy[level].directionEn;
  if (text === copy[level].witness)
    return "A lost-property worker took the yellow bag to Alexanderplatz. Here is the receipt: locker 07. Your bag is safe!";
  if (text === copy[level].bert)
    return "Welcome! I am BERTI, the very literal ticket machine. Enter the two-digit locker number from the receipt. Feelings are optional.";
  if (text === copy[level].hint)
    return "Ask Deniz whether he has seen the yellow bag. Your meaning matters more than perfect grammar.";
  if (text === fallback("greeting", level))
    return "Hello, welcome to my kiosk! What are you looking for?";
  if (text === fallback("direction", level))
    return "The U3 and U8 meet here. Are you looking for something?";
  if (text === fallback("unknown", level))
    return "I’m not quite sure what you mean. Are you looking for a bag?";
  if (text.startsWith("Kottbusser Tor."))
    return "Kottbusser Tor. It smells like coffee and a good story here.";
  if (text.startsWith("Nächster Halt:"))
    return (
      "Next stop: " +
      text.split(": ")[1]?.split(". Die")[0] +
      ". The city isn’t asleep yet."
    );
  if (text.startsWith("Für das"))
    return "You need a receipt for the locker. Ask Deniz at Kottbusser Tor. Data protection, even for bags.";
  if (text.startsWith("Dieses Fach"))
    return "That locker contains a single sock. Check the number on your receipt.";
  if (text.startsWith("Die Tasche ist da"))
    return "The bag and the recording are here! Ayo: You saved our concert. Next song: Thank you, Berlin!";
  if (text.startsWith("Diese Bahn") || text.startsWith("Falscher"))
    return "Wrong platform! That line doesn’t serve this route. Try the other line.";
  return "Follow the yellow bag. Ask for help when you need it.";
}
