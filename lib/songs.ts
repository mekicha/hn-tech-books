import type { Level } from "./game";
export type Song = {
  title: string;
  style: string;
  bpm: number;
  rate: number;
  notes: number[];
  lyrics: { de: string; en: string; clue?: boolean }[];
};
export const songs: Record<Level, Song> = {
  A1: {
    title: "Ich fahr’ durch Berlin",
    style: "Warm indie pop · synthetic spoken German",
    bpm: 88,
    rate: 0.72,
    notes: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 392],
    lyrics: [
      {
        de: "Ich fahre mit der Bahn. Ich sehe diese Stadt.",
        en: "I ride the train. I see this city.",
      },
      {
        de: "Ich steige hier aus. Mein Freund wartet da.",
        en: "I get off here. My friend waits there.",
      },
      {
        de: "Eine gelbe Tasche fährt zum Kottbusser Tor.",
        en: "A yellow bag travels to Kottbusser Tor.",
        clue: true,
      },
      {
        de: "Hörst du unser Lied? Wir singen es im Chor.",
        en: "Do you hear our song? We sing it together.",
      },
      {
        de: "Die Nacht ist hell. Berlin ist groß.",
        en: "The night is bright. Berlin is big.",
      },
      {
        de: "Wir finden unser Lied. Komm, fahren wir los!",
        en: "We find our song. Come on, let’s go!",
      },
    ],
  },
  A2: {
    title: "Wo bist du?",
    style: "Indie electronic · synthetic spoken German",
    bpm: 104,
    rate: 0.88,
    notes: [293.66, 349.23, 440, 523.25, 440, 392, 349.23, 293.66],
    lyrics: [
      {
        de: "Die Türen schließen, und ich suche dich.",
        en: "The doors close, and I look for you.",
      },
      {
        de: "In dieser großen Stadt verlierst du mich nicht.",
        en: "In this big city you won’t lose me.",
      },
      {
        de: "Die gelbe Tasche reist zum Kottbusser Tor.",
        en: "The yellow bag travels to Kottbusser Tor.",
        clue: true,
      },
      {
        de: "Am Kiosk singt jemand die Melodie vor.",
        en: "At the kiosk someone sings the melody.",
      },
      {
        de: "Wo bist du? Die Nacht bleibt noch wach.",
        en: "Where are you? The night stays awake.",
      },
      {
        de: "Wir folgen den Gleisen, dem Rhythmus der Stadt.",
        en: "We follow the tracks, the rhythm of the city.",
      },
    ],
  },
  B1: {
    title: "Letzte Bahn nach Mitternacht",
    style: "Atmospheric electropop · synthetic spoken German",
    bpm: 116,
    rate: 1,
    notes: [220, 261.63, 329.63, 392, 369.99, 329.63, 261.63, 246.94],
    lyrics: [
      {
        de: "Unter Straßen, die noch voller Leben sind,",
        en: "Beneath streets still full of life,",
      },
      {
        de: "trägt die letzte Bahn Geschichten durch den Wind.",
        en: "the last train carries stories through the wind.",
      },
      {
        de: "Eine gelbe Tasche zog zum Kottbusser Tor,",
        en: "A yellow bag made its way to Kottbusser Tor,",
        clue: true,
      },
      {
        de: "zwischen all den Stimmen kam ihr Lied hervor.",
        en: "among all the voices its song emerged.",
      },
      {
        de: "Was wir nachts verlieren, finden wir im Klang.",
        en: "What we lose at night, we find in sound.",
      },
      {
        de: "Bis der Morgen anbricht, hält die Stadt uns wach.",
        en: "Until morning breaks, the city keeps us awake.",
      },
    ],
  },
};
