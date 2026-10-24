import type {
  CharacterId,
  ClueId,
  Level,
  LocationId,
  ObjectId,
} from "./narrative";

/** Canon: no theft. Weber and Nora protected Eva's painting from a pipe leak.
 * Nora is safe but trapped behind a swollen archive door. Milo's tape records
 * the pump relay and her request for help. Lena screamed about hot coffee.
 * A complete ending rescues Nora and connects every piece of evidence. */
export const CANON =
  "A burst pipe threatened Eva Weber’s painting. Weber and restorer Nora moved it into the dry basement. A swollen archive door trapped Nora. Milo recorded her call and the pump relay. Lena’s scream was spilled coffee. No one stole the painting.";
export const locations: Record<
  LocationId,
  { name: string; de: string; kicker: string }
> = {
  hallway: {
    name: "The hallway",
    de: "Das Treppenhaus",
    kicker: "THIRD FLOOR · SOMETHING IS MISSING",
  },
  office: {
    name: "Weber’s office",
    de: "Das Hausmeisterbüro",
    kicker: "GROUND FLOOR · EVERY KEY HAS A STORY",
  },
  basement: {
    name: "The basement",
    de: "Der Keller",
    kicker: "BELOW THE BUILDING · THE TRUTH IS STILL HERE",
  },
};
export const characters: Record<
  CharacterId,
  {
    name: string;
    role: string;
    location: LocationId;
    description: string;
    greeting: Record<Level, string>;
    en: string;
  }
> = {
  lena: {
    name: "Lena",
    role: "NEIGHBOR / AMATEUR DETECTIVE",
    location: "hallway",
    description: "Knows everyone. Trusts almost no one.",
    greeting: {
      A1: "Ein Schrei? Das war ich. Mein Kaffee war heiß. Aber Nora ist weg. Und das Bild auch!",
      A2: "Der Schrei kam von mir – heißer Kaffee, lange Geschichte. Aber Nora und das Bild sind wirklich verschwunden.",
    },
    en: "The scream was me: hot coffee. But Nora and the painting really are missing.",
  },
  weber: {
    name: "Herr Weber",
    role: "CARETAKER / KEEPER OF THE RULES",
    location: "office",
    description: "A key for every door. A rule for every key.",
    greeting: {
      A1: "Guten Abend. Der Keller ist zu. Das sind die Regeln. Was möchten Sie?",
      A2: "Guten Abend. Der Keller bleibt vorerst geschlossen. Hausordnung. Kann ich sonst etwas für Sie tun?",
    },
    en: "Good evening. The basement is closed. House rules. What do you need?",
  },
  milo: {
    name: "Milo",
    role: "MUSICIAN / ACCIDENTAL WITNESS",
    location: "hallway",
    description: "Collects sounds. Occasionally hears things.",
    greeting: {
      A1: "Ich mache Musik. Um 23:56 habe ich etwas gehört. Keine Gitarre. Vielleicht eine Pumpe?",
      A2: "Ich sammle nachts Geräusche für meinen nächsten Song. Um 23:56 habe ich eine Pumpe und eine Stimme aufgenommen.",
    },
    en: "I collect sounds. At 23:56 I recorded a pump and a voice.",
  },
};
export const clueData: Record<
  ClueId,
  { title: string; de: string; en: string; connects: ClueId[]; icon: string }
> = {
  note: {
    title: "A note in blue ink",
    de: "„Das Bild muss trocken bleiben. — N.“",
    en: "“The painting must stay dry. — N.”",
    connects: ["log", "witness"],
    icon: "01",
  },
  photo: {
    title: "Eva’s photograph",
    de: "Eva Weber malte das Bild. Nora wollte es restaurieren.",
    en: "Eva Weber painted it. Nora offered to restore it. This matters to Weber.",
    connects: ["frame", "nora"],
    icon: "02",
  },
  witness: {
    title: "Lena’s statement",
    de: "Nora und Weber trugen etwas nach unten. Nora hatte eine blaue Decke.",
    en: "Lena saw Nora and Weber carrying something downstairs in a blue blanket.",
    connects: ["note", "frame"],
    icon: "03",
  },
  log: {
    title: "The maintenance record",
    de: "23:56 · Rohrbruch. Pumpe aus. Archiv-Tür klemmt. Notöffnung: roter Hebel.",
    en: "23:56 · Burst pipe. Pump off. Archive door sticks. Emergency release: red lever.",
    connects: ["recording", "note"],
    icon: "04",
  },
  recording: {
    title: "Milo’s midnight tape",
    de: "Nora: „Das Bild ist sicher. Ich bin im Archiv! Der rote Hebel ist draußen!“",
    en: "Nora: “The painting is safe. I’m in the archive! The red lever is outside!”",
    connects: ["log", "nora"],
    icon: "05",
  },
  frame: {
    title: "A dry canvas",
    de: "Das Bild ist unter der blauen Decke. Kein Diebstahl. Eine Rettung.",
    en: "The painting is under the blue blanket. This was a rescue, not a theft.",
    connects: ["witness", "photo"],
    icon: "06",
  },
  nora: {
    title: "Nora’s account",
    de: "„Weber und ich retteten Evas Bild. Dann klemmte die Tür. Danke!“",
    en: "“Weber and I saved Eva’s painting. Then the door jammed. Thank you!”",
    connects: ["photo", "recording"],
    icon: "07",
  },
};
export type SceneObject = {
  id: ObjectId;
  location: LocationId;
  label: string;
  de: string;
  en: string;
  x: number;
  y: number;
  clue?: ClueId;
};
export const objects: SceneObject[] = [
  {
    id: "note",
    location: "hallway",
    label: "Suspicious note",
    de: "Ein Zettel: „Das Bild muss trocken bleiben. — N.“ Wer ist N?",
    en: "A note: “The painting must stay dry. — N.” Who is N?",
    x: 62,
    y: 56,
    clue: "note",
  },
  {
    id: "painting-space",
    location: "hallway",
    label: "Empty painting hooks",
    de: "Hier hing ein Bild. Der Rahmen ist weg. An der Wand ist Wasser.",
    en: "A painting hung here. The frame is gone. There is water on the wall.",
    x: 48,
    y: 37,
  },
  {
    id: "noticeboard",
    location: "hallway",
    label: "Noticeboard",
    de: "„Nora, Restauratorin. Wohnung 4.“ Darunter: „Bitte keine Trompete nach 22 Uhr.“ Armer Milo.",
    en: "“Nora, art restorer. Apartment 4.” Below: “No trumpet after 10 pm.” Poor Milo.",
    x: 21,
    y: 48,
  },
  {
    id: "apartment",
    location: "hallway",
    label: "Nora’s apartment",
    de: "Keine Antwort. Ein nasser Fußabdruck führt nach unten.",
    en: "No answer. A wet footprint leads downstairs.",
    x: 77,
    y: 47,
  },
  {
    id: "light",
    location: "hallway",
    label: "Flickering light",
    de: "Das Licht flackert. Es riecht nach Regen. Oder nach einem sehr schlechten Elektriker.",
    en: "The light flickers. It smells of rain. Or a very bad electrician.",
    x: 48,
    y: 15,
  },
  {
    id: "clock",
    location: "hallway",
    label: "Hallway clock",
    de: "Die Uhr geht vorwärts. Warum kennst du dieses Ticken schon?",
    en: "The clock moves forward. Why does this ticking feel familiar?",
    x: 89,
    y: 23,
  },
  {
    id: "basement-door",
    location: "hallway",
    label: "Basement door",
    de: "Die Kellertür ist zu. Weber hat den Schlüssel. Ein leises Klopfen kommt von unten.",
    en: "The basement door is locked. Weber has the key. A faint knock comes from below.",
    x: 9,
    y: 67,
  },
  {
    id: "log",
    location: "office",
    label: "Maintenance log",
    de: "23:56: Rohrbruch. Die Pumpe ist aus. Die Archiv-Tür klemmt. Notöffnung: roter Hebel.",
    en: "23:56: burst pipe. The pump is off. Archive door jammed. Emergency release: red lever.",
    x: 46,
    y: 62,
    clue: "log",
  },
  {
    id: "photo",
    location: "office",
    label: "Old photograph",
    de: "Weber mit Eva vor dem Bild. Hinten steht: „Für unser Haus. — Eva“. Nora wollte das Bild restaurieren.",
    en: "Weber and Eva beside the painting. On the back: “For our building. — Eva.” Nora offered to restore it.",
    x: 23,
    y: 36,
    clue: "photo",
  },
  {
    id: "keys",
    location: "office",
    label: "Key cabinet",
    de: "Viele Schlüssel. Ein Schild: „Nicht anfassen.“ Weber meint das ernst.",
    en: "Many keys. A sign: “Do not touch.” Weber means it.",
    x: 77,
    y: 31,
  },
  {
    id: "desk",
    location: "office",
    label: "Caretaker’s desk",
    de: "Ein kalter Tee. Zwei nasse Tassen. Weber war heute nicht allein.",
    en: "Cold tea. Two wet cups. Weber wasn’t alone tonight.",
    x: 33,
    y: 69,
  },
  {
    id: "drawer",
    location: "office",
    label: "Locked drawer",
    de: "Eine verschlossene Schublade. „Meine Briefe“, sagt Weber. Manche Türen gehören nicht zum Fall.",
    en: "A locked drawer. “My letters,” says Weber. Some doors aren’t part of this case.",
    x: 56,
    y: 75,
  },
  {
    id: "radio",
    location: "office",
    label: "Old radio",
    de: "„Regen in ganz Berlin.“ Danke, Radio. Wir haben Fenster.",
    en: "“Rain across Berlin.” Thanks, radio. We have windows.",
    x: 89,
    y: 57,
  },
  {
    id: "canvas",
    location: "basement",
    label: "Covered painting",
    de: "Unter der blauen Decke: das Bild! Es ist trocken und unbeschädigt. Aber wo ist Nora?",
    en: "Under the blue blanket: the painting! Dry and undamaged. But where is Nora?",
    x: 28,
    y: 50,
    clue: "frame",
  },
  {
    id: "boxes",
    location: "basement",
    label: "Storage boxes",
    de: "Auf den Kisten steht „Nora — Archiv“. Dahinter hörst du eine Stimme.",
    en: "The boxes read “Nora — Archive”. A voice comes from behind them.",
    x: 72,
    y: 65,
  },
  {
    id: "tape",
    location: "basement",
    label: "Recording player",
    de: "Ein altes Abspielgerät. Milo hat eine Aufnahme. Vielleicht hörst du damit mehr.",
    en: "An old player. Milo has a recording. Perhaps listening will reveal more.",
    x: 45,
    y: 67,
  },
  {
    id: "frame",
    location: "basement",
    label: "Empty restoration frame",
    de: "Ein leerer Arbeitsrahmen, Pinsel und blaue Farbe. Hier arbeitet eine Restauratorin.",
    en: "A restoration frame, brushes and blue paint. A restorer works here.",
    x: 16,
    y: 35,
  },
  {
    id: "archive",
    location: "basement",
    label: "Archive door / red lever",
    de: "Die Tür klemmt. Ein roter Hebel. Du brauchst die Wartungsnotiz und Milos Aufnahme, um ihn sicher zu benutzen.",
    en: "The door is jammed. A red lever. You need the maintenance record and Milo’s tape to use it safely.",
    x: 84,
    y: 40,
  },
];
export type Line = { de: string; en: string; outcome: string; voice?: string };
export const lines: Record<string, Record<Level, Line>> = {
  intro: {
    A1: {
      de: "Ein Schrei. Das Licht flackert. Das Bild ist weg. Und Nora? Es ist 23:57. Du hast diese Nacht schon einmal erlebt.",
      en: "A scream. The lights flicker. The painting is gone. And Nora? It is 23:57. You have lived this night before.",
      outcome: "The night begins.",
    },
    A2: {
      de: "Ein Schrei zerreißt die Stille. Das Bild ist verschwunden, Nora auch. Die Uhr zeigt 23:57. Irgendetwas an dieser Nacht kommt dir bekannt vor.",
      en: "A scream breaks the silence. The painting and Nora have disappeared. It is 23:57. Something about this night feels familiar.",
      outcome: "The night begins.",
    },
  },
  refuse: {
    A1: {
      de: "So reden Sie mit mir? Nein. Der Schlüssel bleibt hier. Haben Sie einen guten Grund?",
      en: "You speak to me like that? No. The key stays here. Do you have a good reason?",
      outcome: "Weber bristles. No key.",
    },
    A2: {
      de: "Mit Befehlen kommen Sie hier nicht weit. Ohne einen nachvollziehbaren Grund bleibt der Schlüssel bei mir.",
      en: "Orders won’t get you far. Without a clear reason, the key stays with me.",
      outcome: "Weber bristles. No key.",
    },
  },
  reason: {
    A1: {
      de: "Den Schlüssel? Warum brauchen Sie ihn? Haben Sie etwas gesehen? Erzählen Sie mir davon.",
      en: "The key? Why do you need it? Have you seen something? Tell me about it.",
      outcome: "Weber listens. He needs a reason.",
    },
    A2: {
      de: "Grundsätzlich schon. Aber erklären Sie mir bitte, warum Sie in den Keller müssen. Haben Sie etwas Konkretes entdeckt?",
      en: "Possibly. But please explain why you need the basement. Have you found something specific?",
      outcome: "Weber listens. He needs a reason.",
    },
  },
  evidence: {
    A1: {
      de: "Wasser? Der Zettel und das Protokoll… Sie haben recht. Nora könnte unten sein. Hier ist der Schlüssel. Schnell!",
      en: "Water? The note and the log… You’re right. Nora could be downstairs. Here is the key. Hurry!",
      outcome: "Evidence changes his mind. Key acquired.",
    },
    A2: {
      de: "Der Rohrbruch und Noras Nachricht passen zusammen. Vielleicht sitzt sie noch unten fest. Nehmen Sie den Schlüssel – bitte beeilen Sie sich!",
      en: "The burst pipe and Nora’s note fit together. She may be trapped below. Take the key and hurry!",
      outcome: "Evidence changes his mind. Key acquired.",
    },
  },
  firstloop: {
    A1: {
      de: "Die Tür ist nass. Ich prüfe das erst. Warten Sie kurz. Was? Die Uhr…",
      en: "The door is wet. I must check first. Wait a moment. What? The clock…",
      outcome: "Something interrupts. Remember the evidence.",
    },
    A2: {
      de: "Bevor ich jemanden hinunterlasse, muss ich die Sicherheit prüfen. Moment mal – ist es wirklich schon Mitternacht?",
      en: "Before I let anyone down, I must check it is safe. Wait—is it midnight already?",
      outcome: "Something interrupts. Remember the evidence.",
    },
  },
  missing: {
    A1: {
      de: "Ein Gefühl ist kein Beweis. Sehen Sie sich den Zettel und das Wartungsprotokoll an. Dann sprechen wir weiter.",
      en: "A feeling isn’t evidence. Look at the note and maintenance log. Then we can talk.",
      outcome: "Find evidence, not perfect grammar.",
    },
    A2: {
      de: "Ihre Sorge verstehe ich. Aber bevor wir handeln, brauchen wir konkrete Hinweise: die Nachricht und das Wartungsprotokoll.",
      en: "I understand your concern, but we need concrete evidence: the note and maintenance log.",
      outcome: "Find evidence, not perfect grammar.",
    },
  },
  witness: {
    A1: {
      de: "Ich sah Nora mit Weber. Sie trugen etwas in einer blauen Decke nach unten. Kein Dieb trägt Hausschuhe. Oder?",
      en: "I saw Nora and Weber carrying something downstairs in a blue blanket. A thief doesn’t wear slippers. Right?",
      outcome: "Lena’s statement joins the journal.",
    },
    A2: {
      de: "Nora und Weber haben zusammen etwas in einer blauen Decke nach unten getragen. Sehr verdächtige Hausschuhe, muss ich sagen.",
      en: "Nora and Weber carried something downstairs in a blue blanket. Very suspicious slippers, I must say.",
      outcome: "Lena’s statement joins the journal.",
    },
  },
  recording: {
    A1: {
      de: "Hier, meine Aufnahme! Nora sagt: „Das Bild ist sicher. Ich bin im Archiv. Der rote Hebel ist draußen!“ Das ist kein Song. Noch nicht.",
      en: "Here’s my tape! Nora says: “The painting is safe. I’m in the archive. The red lever is outside!” Not a song. Yet.",
      outcome: "Milo shares the midnight tape.",
    },
    A2: {
      de: "Hör mal: „Das Bild ist sicher. Ich sitze im Archiv fest. Der rote Hebel ist draußen!“ Das war Nora. Meine erste Aufnahme mit einer echten Handlung.",
      en: "Listen: “The painting is safe. I’m trapped in the archive. The red lever is outside!” That was Nora. My first recording with an actual plot.",
      outcome: "Milo shares the midnight tape.",
    },
  },
  sentimental: {
    A1: {
      de: "Eva hat das Bild gemalt. Meine Frau. Nora wollte es retten. Ich wollte nur nicht noch etwas verlieren.",
      en: "Eva painted it. My wife. Nora wanted to save it. I just didn’t want to lose anything else.",
      outcome: "Behind the rules, a reason.",
    },
    A2: {
      de: "Meine Frau Eva hat dieses Bild gemalt. Nora wollte es restaurieren. Ich wollte nicht zugeben, wie viel es mir bedeutet.",
      en: "My wife Eva painted it. Nora offered to restore it. I couldn’t admit how much it means to me.",
      outcome: "Behind the rules, a reason.",
    },
  },
  nora: {
    A1: {
      de: "Danke! Die Tür war zu. Weber und ich haben das Bild vor dem Wasser gerettet. Er war kein Dieb. Nur sehr nervös.",
      en: "Thank you! The door was stuck. Weber and I saved the painting from the water. He wasn’t a thief. Just very nervous.",
      outcome: "Nora is safe. The last piece falls into place.",
    },
    A2: {
      de: "Endlich! Die feuchte Tür hat sich verklemmt. Weber und ich haben Evas Bild vor dem Rohrbruch gerettet. Ein Diebstahl? Nein, eine ziemlich chaotische Rettungsaktion.",
      en: "Finally! The damp door jammed. Weber and I saved Eva’s painting from the burst pipe. Not a theft—a very chaotic rescue.",
      outcome: "Nora is safe. The last piece falls into place.",
    },
  },
  midnight: {
    A1: {
      de: "Mitternacht. Der Regen fällt rückwärts. Die Türen sind wieder zu. Aber du erinnerst dich. Noch einmal.",
      en: "Midnight. The rain falls backward. The doors are locked again. But you remember. Once more.",
      outcome: "The building resets. Your knowledge stays.",
    },
    A2: {
      de: "Mitternacht. Die Regentropfen steigen nach oben. Alles beginnt von vorn – nur deine Erinnerungen bleiben. Diesmal kannst du etwas verändern.",
      en: "Midnight. Raindrops rise upward. Everything begins again, but you remember. This time you can change something.",
      outcome: "The building resets. Your knowledge stays.",
    },
  },
  unclear: {
    A1: {
      de: "Ich verstehe nicht ganz. Was suchen Sie? Das Bild, Nora oder den Schlüssel?",
      en: "I’m not quite sure. Are you looking for the painting, Nora, or the key?",
      outcome: "Try a clearer idea. Grammar can be imperfect.",
    },
    A2: {
      de: "Ich bin nicht sicher, worauf Sie hinauswollen. Geht es um das Bild, um Nora oder um den Kellerschlüssel?",
      en: "I’m not sure what you mean. Is it about the painting, Nora or the basement key?",
      outcome: "Try a clearer idea. Grammar can be imperfect.",
    },
  },
};
export function storyLine(key: keyof typeof lines, level: Level): Line {
  return { ...lines[key][level], voice: key };
}
export const starters: Record<CharacterId, string[]> = {
  lena: ["Hast du das Bild gesehen?", "Wo ist Nora?", "Was ist passiert?"],
  weber: [
    "Gib mir den Schlüssel!",
    "Könnte ich bitte den Schlüssel bekommen?",
    "Ich brauche den Schlüssel. Wasser im Keller!",
  ],
  milo: ["Was hast du gehört?", "Kann ich die Aufnahme hören?", "Wo ist Nora?"],
};
