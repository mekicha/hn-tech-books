"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { AudioDirector } from "@/lib/audio";
import {
  copy,
  fallback,
  GameState,
  inferIntent,
  initialState,
  Intent,
  Level,
  nameOf,
  reducer,
  restore,
  route,
  SAVE_KEY,
  StationId,
  translateDialogue,
} from "@/lib/game";
import { songs } from "@/lib/songs";
import Scene, { Portrait } from "./Scene";
import Map from "./Map";
type RecognitionResult = {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export default function Game() {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initialState(),
  );
  const [loaded, setLoaded] = useState(false);
  const [level, setLevel] = useState<Level>("A1");
  const [departure, setDeparture] = useState(24);
  const [selected, setSelected] = useState<StationId>("kotti");
  const [traveling, setTraveling] = useState(false);
  const [line, setLine] = useState("U3");
  const [message, setMessage] = useState("");
  const [translation, setTranslation] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState("scripted");
  const [lyrics, setLyrics] = useState(false);
  const [lyricIndex, setLyricIndex] = useState(-1);
  const [translatedLine, setTranslatedLine] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const [audioError, setAudioError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const audio = useRef<AudioDirector | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const requestGeneration = useRef(0);
  const micTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const song = songs[state.level];
  useEffect(() => {
    if (!state.started || state.ended) return;
    const interval = setInterval(
      () => setDeparture((t) => (t <= 1 ? 24 : t - 1)),
      1000,
    );
    return () => clearInterval(interval);
  }, [state.started, state.ended]);
  useEffect(() => {
    audio.current = new AudioDirector();
    audio.current.onLyric = setLyricIndex;
    audio.current.onError = setAudioError;
    try {
      const saved = restore(localStorage.getItem(SAVE_KEY));
      dispatch({ type: "audio", audio: saved.audio });
      if (saved.started) {
        setRestored(saved);
        setLevel(saved.level);
        setTranslation(saved.level === "A1");
      }
    } catch {
      setStorageError(
        "Saving is unavailable in this browser. This session is still playable.",
      );
    }
    setLoaded(true);
    return () => {
      audio.current?.dispose();
      if (timer.current) clearTimeout(timer.current);
      if (micTimer.current) clearTimeout(micTimer.current);
      recognition.current?.stop();
      requestGeneration.current++;
    };
  }, []);
  // Hydrate after mount so browser storage never affects server markup.
  const [restored, setRestored] = useState<GameState | null>(null);
  useEffect(() => {
    if (restored) {
      hydrate(restored);
      setRestored(null);
    }
  }, [restored]);
  // restore() validates the saved schema before hydrating the complete story.
  function hydrate(saved: GameState) {
    dispatch({ type: "hydrate", state: saved });
    if (saved.songClue) audio.current?.onClueDiscovered("song");
    if (saved.witnessSolved) audio.current?.onClueDiscovered("witness");
    setLine(
      ["warschauer", "schlesisches", "gorlitzer"].includes(saved.station)
        ? "U3"
        : "U8",
    );
    setSelected(
      saved.station === "warschauer"
        ? "kotti"
        : saved.station === "kotti"
          ? "alex"
          : saved.station,
    );
  }
  useEffect(() => {
    if (!loaded || restored) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      setStorageError(
        "Progress cannot be saved. Keep this tab open to finish.",
      );
    }
  }, [state, loaded, restored]);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.setVolume(state.audio.volume);
    if (state.audio.muted) audio.current.mute();
    else audio.current.unmute();
  }, [state.audio.volume, state.audio.muted]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  function say(de: string) {
    setMessage(de);
    audio.current?.speak(de, true);
  }
  async function start() {
    dispatch({ type: "start", level });
    setTranslation(level === "A1");
    setMessage(copy[level].intro);
    await audio.current?.playTrack(level);
    if (!audio.current?.playing)
      dispatch({ type: "audio", audio: { playing: false } });
  }
  function travel() {
    if (traveling || selected === state.station) return;
    const path = route(state.station, selected);
    const needed =
      state.station === "warschauer"
        ? "U3"
        : path.some((s) =>
              ["moritz", "heinrich", "jannowitz", "alex"].includes(s),
            )
          ? "U8"
          : "U3";
    if (line !== needed) {
      say(
        state.level === "A1"
          ? "Diese Bahn fährt hier nicht. Die Tasche wartet nicht auf einen Bus! Wähle die andere Linie."
          : "Falscher Bahnsteig! Diese Linie fährt diese Strecke nicht. Selbst die Tasche weiß das. Versuch die andere Linie.",
      );
      return;
    }
    const destination = selected;
    setTraveling(true);
    setDeparture(24);
    setMessage("");
    audio.current?.onTrainDepart();
    timer.current = setTimeout(() => {
      dispatch({ type: "arrive", station: destination });
      audio.current?.onStationArrive(destination);
      setTraveling(false);
      setLine(
        destination === "kotti"
          ? "U8"
          : destination === "warschauer"
            ? "U3"
            : line,
      );
      if (destination === "kotti") {
        say(
          "Kottbusser Tor. Hier riecht es nach Kaffee und einer guten Geschichte.",
        );
        setNotice("A familiar melody. Kottbusser Tor was in the song.");
      } else if (destination === "alex") say(copy[state.level].bert);
      else
        say(
          "Nächster Halt: " +
            nameOf(destination) +
            ". Die Stadt schläft noch nicht.",
        );
    }, 2200);
  }
  async function talk(override?: string) {
    const input = (override || text).trim();
    if (!input || busy) return;
    setText("");
    setBusy(true);
    audio.current?.duckForDialogue();
    const generation = ++requestGeneration.current;
    let result: { intent: Intent; text: string; source: string } = {
      intent: inferIntent(input),
      text: fallback(inferIntent(input), state.level),
      source: "scripted",
    };
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          level: state.level,
          station: state.station,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        if (
          ["bag", "direction", "greeting", "help", "unknown"].includes(
            data.intent,
          ) &&
          typeof data.text === "string"
        )
          result = data;
      }
    } catch {
      /* Native offline fallback remains fully playable. */
    }
    if (generation !== requestGeneration.current) return;
    dispatch({ type: "witness", intent: result.intent });
    setSource(result.source);
    say(result.text);
    setBusy(false);
    if (result.intent === "bag" && !state.witnessSolved) {
      audio.current?.onClueDiscovered("witness");
      setNotice("Clue collected · A receipt for locker 07");
      setSelected("alex");
      setLine("U8");
    }
  }
  function microphone() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) {
      setNotice(
        "Speech recognition is not supported here. Type your German below.",
      );
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new Constructor();
    recognition.current = rec;
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      setText(e.results[0][0].transcript);
      setNotice("Words captured. Review your German, then send.");
    };
    const finish = () => {
      if (micTimer.current) clearTimeout(micTimer.current);
      setListening(false);
      audio.current?.endMicrophoneMode();
    };
    rec.onerror = () => {
      finish();
      setNotice(
        "Microphone unavailable. You can type or use the suggested question.",
      );
    };
    rec.onend = finish;
    try {
      audio.current?.startMicrophoneMode();
      setListening(true);
      rec.start();
      micTimer.current = setTimeout(() => {
        rec.stop();
        finish();
      }, 15000);
    } catch {
      finish();
      setNotice("Microphone could not start. Please use the text box.");
    }
  }
  function discoverSong() {
    if (state.songClue) return;
    dispatch({ type: "song" });
    audio.current?.onClueDiscovered("song");
    setNotice("A yellow thread · You caught the lyric clue!");
  }
  function unlock() {
    if (!state.witnessSolved) {
      say(
        "Für das Schließfach brauchst du eine Quittung. Frag Deniz am Kottbusser Tor. Datenschutz. Sogar für Taschen.",
      );
      return;
    }
    if (code.trim() !== "07") {
      say(
        "Dieses Fach enthält nur eine einzelne Socke. Bitte prüfe die Nummer auf deiner Quittung.",
      );
      return;
    }
    dispatch({ type: "ending", code });
    setMessage(
      "Die Tasche ist da! Und die Aufnahme auch. Ayo: „Du hast unser Konzert gerettet! Nächster Song: Danke, Berlin.“",
    );
    audio.current?.onMysterySolved();
  }
  function restart() {
    requestGeneration.current++;
    recognition.current?.stop();
    if (timer.current) clearTimeout(timer.current);
    if (micTimer.current) clearTimeout(micTimer.current);
    audio.current?.endMicrophoneMode();
    audio.current?.onRewind();
    dispatch({ type: "start", level: state.level });
    setSelected("kotti");
    setLine("U3");
    setCode("");
    setTranslation(state.level === "A1");
    setMessage(copy[state.level].intro);
    setBusy(false);
    setTraveling(false);
    setListening(false);
    setResetOpen(false);
    setLyricIndex(-1);
    void audio.current?.playTrack(state.level);
  }
  async function toggleMusic() {
    if (state.audio.playing) {
      audio.current?.pauseTrack();
      dispatch({ type: "audio", audio: { playing: false } });
    } else {
      await audio.current?.playTrack(state.level);
      dispatch({ type: "audio", audio: { playing: !!audio.current?.playing } });
    }
  }
  const progress = state.ended
    ? 3
    : state.witnessSolved
      ? 2
      : state.navigationSolved
        ? 1
        : 0;
  const character =
    state.station === "kotti"
      ? "deniz"
      : state.station === "alex"
        ? "berti"
        : "ayo";
  const defaultMessage =
    state.station === "kotti"
      ? copy[state.level].hint
      : state.station === "alex"
        ? copy[state.level].bert
        : copy[state.level].intro;
  const english = translateDialogue(message || defaultMessage, state.level);
  if (!loaded)
    return (
      <main className="loading">
        U–BAHN RUSH <span>Finding the platform…</span>
      </main>
    );
  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="U-Bahn Rush home">
          <span className="u-icon">U</span>
          <span>
            U–BAHN <b>RUSH</b>
            <small>A BERLIN UNDERGROUND STORY</small>
          </span>
        </a>
        <div className="top-right">
          <span className="live-dot" />
          <span>BERLIN, AFTER DARK</span>
          <span className="level-pill">
            {state.started ? state.level : level} DEUTSCH
          </span>
          {state.started && (
            <button
              className="icon-button"
              onClick={() => setResetOpen(true)}
              aria-label="Restart adventure"
            >
              ↺
            </button>
          )}
        </div>
      </header>
      {!state.started ? (
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow">A LITTLE LOST. A LOT OF BERLIN.</span>
            <h1>
              Last train.
              <br />
              Lost bag.
              <br />
              <em>Your story.</em>
            </h1>
            <p>
              Your friend’s song is somewhere in the city.
              <br />
              Follow the music. Talk to strangers. Find your German.
            </p>
            <div
              className="level-select"
              role="group"
              aria-label="Choose German level"
            >
              {(["A1", "A2", "B1"] as Level[]).map((l) => (
                <button
                  key={l}
                  aria-pressed={level === l}
                  className={level === l ? "active" : ""}
                  onClick={() => setLevel(l)}
                >
                  <b>{l}</b>
                  <span>
                    {l === "A1"
                      ? "Beginner"
                      : l === "A2"
                        ? "Elementary"
                        : "Intermediate"}
                  </span>
                </button>
              ))}
            </div>
            <button className="primary start-button" onClick={start}>
              Enter the underground <span>→</span>
            </button>
            <small className="intro-note">
              EPISODE 01 · 5–10 MIN · HEADPHONES WELCOME
            </small>
          </div>
          <div className="intro-art">
            <div className="poster-circle" />
            <div className="poster-type">
              BERLIN
              <br />
              <span>23:47</span>
            </div>
            <div className="poster-scene">
              <Scene station="warschauer" ended={false} />
            </div>
            <div className="poster-ticket">
              <span>ONE NIGHT. ONE MISSING SONG.</span>
              <strong>
                WO IST DIE
                <br />
                GELBE TASCHE?
              </strong>
              <div className="ticket-bars">┃│┃┃│┃│┃┃│┃┃││┃┃</div>
            </div>
            <div className="poster-label">
              GET LOST IN BERLIN.
              <br />
              <b>FIND YOUR GERMAN.</b>
            </div>
          </div>
          <p className="prototype-note">
            Original synthesized score + bundled synthetic German speech. Every
            clue is also readable.
          </p>
        </section>
      ) : (
        <>
          <section className="mission-bar">
            <div>
              <span className="eyebrow">EPISODE 01 / THE MISSING BAG</span>
              <h1>
                {state.ended
                  ? "You found more than a song."
                  : progress === 0
                    ? "A song to find. A city to follow."
                    : progress === 1
                      ? "Everyone knows someone at Kotti."
                      : "Next stop: the missing song."}
              </h1>
            </div>
            <div
              className="mission-steps"
              aria-label={`Story progress ${progress} of 3`}
            >
              {["Find the witness", "Follow the receipt", "Save the song"].map(
                (x, i) => (
                  <span
                    key={x}
                    className={
                      progress > i ? "done" : progress === i ? "current" : ""
                    }
                  >
                    <b>{progress > i ? "✓" : `0${i + 1}`}</b>
                    <small>{x}</small>
                  </span>
                ),
              )}
            </div>
          </section>
          <div className="game-grid">
            <section className="world">
              <div className="section-top">
                <span className="eyebrow">
                  <span className="status-light" /> LIVE FROM THE UNDERGROUND
                </span>
                <span className="fiction-clock">
                  23:{47 + Math.min(state.visited.length - 1, 9)} · FICTIONAL
                  NIGHT
                </span>
              </div>
              <div className="scene-frame">
                <Scene station={state.station} ended={state.ended} />
                <div className="scene-caption">
                  <span
                    className={`line-badge ${state.station === "kotti" ? "transfer" : ""}`}
                  >
                    {["warschauer", "schlesisches", "gorlitzer"].includes(
                      state.station,
                    )
                      ? "U3"
                      : "U8"}
                  </span>
                  <div>
                    <h2>{nameOf(state.station)}</h2>
                    <span>
                      {state.station === "kotti"
                        ? "THE KIOSK WITH ALL THE ANSWERS"
                        : state.station === "alex"
                          ? "LOST THINGS. FOUND STORIES."
                          : "YOUR NIGHT STARTS HERE"}
                    </span>
                  </div>
                </div>
                {traveling && (
                  <div className="travel-overlay">
                    <span className="train-mini">▰▰▰</span>
                    <strong>Unterwegs nach {nameOf(selected)}…</strong>
                    <span>Mind the gap. Follow the beat.</span>
                  </div>
                )}
              </div>
              <div className="map-heading">
                <div>
                  <span className="eyebrow">YOUR WAY THROUGH THE NIGHT</span>
                  <h2>Connect the dots.</h2>
                </div>
                <span className="map-hint">
                  Select a station to plan your route ↓
                </span>
              </div>
              <Map
                state={state}
                selected={selected}
                onSelect={(id) => {
                  if (!traveling && !state.ended) setSelected(id);
                }}
                traveling={traveling}
              />
              <div className="route-card">
                <div>
                  <span className="eyebrow">
                    {selected === state.station
                      ? "YOU ARE HERE"
                      : "PLANNED JOURNEY"}
                  </span>
                  <strong>
                    {nameOf(state.station)} <span>→</span> {nameOf(selected)}
                  </strong>
                  <small>
                    {selected === state.station
                      ? "Explore the scene above."
                      : `${route(state.station, selected).length - 1} stops · ${route(state.station, selected).includes("kotti") && state.station !== "kotti" && selected !== "kotti" ? "Transfer at Kottbusser Tor" : "Direct route"} · next train 00:${String(departure).padStart(2, "0")} (game time)`}
                  </small>
                </div>
                <div className="route-actions">
                  <label className="sr-only" htmlFor="line">
                    Choose train line
                  </label>
                  <select
                    id="line"
                    value={line}
                    disabled={traveling}
                    onChange={(e) => setLine(e.target.value)}
                  >
                    <option>U3</option>
                    <option>U8</option>
                  </select>
                  <button
                    className="primary"
                    disabled={
                      traveling ||
                      selected === state.station ||
                      state.ended ||
                      busy ||
                      listening
                    }
                    onClick={travel}
                  >
                    {traveling ? "On the way…" : "Board train"} <span>→</span>
                  </button>
                </div>
              </div>
            </section>
            <aside className="story-column">
              <section className="objective-card">
                <span className="eyebrow">→ YOUR NEXT MOVE</span>
                <p>
                  {state.ended
                    ? "Get the band back together. Berlin is listening."
                    : state.witnessSolved
                      ? "Take the U8 to Alexanderplatz. Find BERTI and the lost-property lockers."
                      : state.navigationSolved
                        ? "Ask Deniz about Ayo’s yellow bag. A little German goes a long way."
                        : copy[state.level].direction}
                </p>
                {translation && !state.navigationSolved && (
                  <small>{copy[state.level].directionEn}</small>
                )}
              </section>
              <section className="dialogue-card">
                <div className="character-heading">
                  <Portrait character={character} />
                  <div>
                    <span className="eyebrow">
                      {character === "ayo"
                        ? "A MESSAGE FROM"
                        : character === "deniz"
                          ? "KIOSK PHILOSOPHER"
                          : "DEPARTMENT OF LOST THINGS"}
                    </span>
                    <h2>
                      {character === "ayo"
                        ? "Ayo"
                        : character === "deniz"
                          ? "Deniz"
                          : "BERTI"}{" "}
                      <span className="status-light" />
                    </h2>
                    <small>
                      {character === "ayo"
                        ? "Your friend. A little panicked."
                        : character === "deniz"
                          ? "Knows everyone. Tells almost everything."
                          : "Literal machine. Figurative heart."}
                    </small>
                  </div>
                </div>
                <div className="dialogue-text" aria-live="polite">
                  <span className="quote-mark">“</span>
                  <p lang="de">
                    {busy ? "Deniz denkt nach…" : message || defaultMessage}
                  </p>
                </div>
                {translation && <p className="translation">{english}</p>}
                <div className="dialogue-tools">
                  <button
                    onClick={() => setTranslation(!translation)}
                    aria-pressed={translation}
                  >
                    {translation ? "Hide English" : "Show English"}
                  </button>
                  <button
                    aria-label="Read dialogue aloud"
                    onClick={() =>
                      audio.current?.speak(message || defaultMessage, true)
                    }
                  >
                    ◖)) Listen
                  </button>
                </div>
                {state.station === "kotti" && !state.ended ? (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void talk();
                      }}
                      className="chat-form"
                    >
                      <label htmlFor="german-input">
                        YOUR WORDS. YOUR GERMAN.
                      </label>
                      <div>
                        <input
                          id="german-input"
                          lang="de"
                          maxLength={500}
                          value={text}
                          disabled={busy || traveling}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Hallo, hast du…"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          className={listening ? "mic active" : "mic"}
                          onClick={microphone}
                          disabled={busy}
                          aria-label={
                            listening ? "Stop microphone" : "Speak German"
                          }
                        >
                          {listening ? (
                            "■"
                          ) : (
                            <svg
                              width="16"
                              height="20"
                              viewBox="0 0 20 24"
                              aria-hidden="true"
                            >
                              <rect
                                x="7"
                                y="2"
                                width="6"
                                height="12"
                                rx="3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M4 10v2a6 6 0 0012 0v-2M10 18v4m-4 0h8"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="1.5"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          type="submit"
                          disabled={busy || !text.trim() || listening}
                          aria-label="Send message"
                        >
                          →
                        </button>
                      </div>
                    </form>
                    <button
                      className="suggestion"
                      disabled={busy || listening}
                      onClick={() => talk(copy[state.level].bag)}
                      lang="de"
                    >
                      “{copy[state.level].bag}” <span>→</span>
                    </button>
                    <small className="fallback-label">
                      {source === "ai"
                        ? "AI intent recognition · fixed story facts"
                        : "Scripted character · AI-ready"}{" "}
                      · imperfect German welcome
                    </small>
                  </>
                ) : state.station === "alex" && !state.ended ? (
                  <form
                    className="locker-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      unlock();
                    }}
                  >
                    <label htmlFor="locker">SCHLIESSFACH / LOCKER NUMBER</label>
                    <div>
                      <input
                        id="locker"
                        inputMode="numeric"
                        pattern="[0-9]{2}"
                        placeholder="00"
                        maxLength={2}
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, ""))
                        }
                      />
                      <button className="primary" type="submit">
                        Open locker →
                      </button>
                    </div>
                  </form>
                ) : !state.ended ? (
                  <button
                    className="text-link"
                    onClick={() => {
                      say(copy[state.level].direction);
                      setSelected("kotti");
                      setLine("U3");
                    }}
                  >
                    Ask Ayo for directions →
                  </button>
                ) : null}
              </section>
              <section className="inventory-card">
                <div className="section-top">
                  <h3>Your pocket finds</h3>
                  <span>
                    {state.inventory.length.toString().padStart(2, "0")}
                  </span>
                </div>
                {state.inventory.length ? (
                  state.inventory.map((item, i) => (
                    <div className="inventory-item" key={item}>
                      <span>
                        {item.includes("recording")
                          ? "♫"
                          : item.includes("Lyric")
                            ? "♪"
                            : "▤"}
                      </span>
                      <div>
                        <b>{item.split(" · ")[0]}</b>
                        <small>
                          {item.split(" · ").slice(1).join(" · ") ||
                            "The song that almost got away"}
                        </small>
                      </div>
                      <span className="found-check">✓</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-inventory">
                    <span>▱</span>
                    <p>
                      Every good story starts
                      <br />
                      with empty pockets.
                    </p>
                  </div>
                )}
              </section>
            </aside>
          </div>
          <section className="music-player" aria-label="Adaptive soundtrack">
            <div className="record-art">
              <span>u</span>
            </div>
            <div className="track-meta">
              <span className="eyebrow">NIGHT FREQUENCY / {state.level}</span>
              <strong>{song.title}</strong>
              <small>Original synth + synthetic spoken German</small>
            </div>
            <div
              className={`visualizer ${state.audio.playing && !state.audio.muted ? "playing" : ""}`}
              aria-hidden="true"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <i
                  key={i}
                  style={{
                    animationDelay: `${i * 0.13}s`,
                    height: `${9 + ((i * 7) % 23)}px`,
                  }}
                />
              ))}
            </div>
            <div className="player-controls">
              <button
                className="play-button"
                onClick={toggleMusic}
                aria-label={state.audio.playing ? "Pause music" : "Play music"}
              >
                {state.audio.playing ? "Ⅱ" : "▶"}
              </button>
              <button
                onClick={() =>
                  dispatch({
                    type: "audio",
                    audio: { muted: !state.audio.muted },
                  })
                }
                aria-label={state.audio.muted ? "Unmute music" : "Mute music"}
              >
                {state.audio.muted ? "◌" : "◖))"}
              </button>
              <label className="volume">
                <span className="sr-only">Music volume</span>
                <input
                  type="range"
                  aria-label="Music volume"
                  min="0"
                  max="1"
                  step=".05"
                  value={state.audio.volume}
                  onChange={(e) =>
                    dispatch({
                      type: "audio",
                      audio: { volume: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <button
                className={`lyrics-button ${lyrics ? "active" : ""}`}
                onClick={() => setLyrics(!lyrics)}
                aria-expanded={lyrics}
              >
                Lyrics <span>≡</span>
              </button>
            </div>
            <span className="music-mode">
              {listening
                ? "MICROPHONE · MUSIC LOWERED"
                : traveling
                  ? "TRAIN TRANSITION"
                  : busy
                    ? "DIALOGUE · DUCKED"
                    : "REACTIVE ORIGINAL SOUNDTRACK"}
            </span>
          </section>
          {lyrics && (
            <section className="lyrics-panel">
              <div>
                <span className="eyebrow">
                  THE CITY HAS SOMETHING TO TELL YOU
                </span>
                <h2>{song.title}</h2>
                <p>
                  {song.style}. Text highlights follow speech requests, not
                  precise vocal timestamps. Tap a line for English.
                </p>
              </div>
              <div className="lyric-lines">
                {song.lyrics.map((l, i) => (
                  <div key={l.de}>
                    <button
                      lang="de"
                      className={lyricIndex === i ? "current-lyric" : ""}
                      aria-expanded={translatedLine === i}
                      onClick={() =>
                        setTranslatedLine(translatedLine === i ? null : i)
                      }
                    >
                      {l.de}
                    </button>
                    {translatedLine === i && <p>{l.en}</p>}
                    {l.clue && (
                      <button
                        className="lyric-clue"
                        onClick={discoverSong}
                        disabled={state.songClue}
                      >
                        {state.songClue
                          ? "✓ Noted in your pocket"
                          : "That yellow bag… make a note →"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          {state.ended && (
            <section className="ending" aria-label="Mystery complete">
              <svg
                className="recovered-bag"
                viewBox="0 0 180 145"
                role="img"
                aria-label="Recovered yellow bag with Ayo’s recording"
              >
                <path
                  d="M58 48V32q0-25 32-25t32 25v16"
                  fill="none"
                  stroke="#caa24b"
                  strokeWidth="10"
                />
                <rect
                  x="23"
                  y="37"
                  width="134"
                  height="100"
                  rx="15"
                  fill="#e8bd50"
                />
                <path
                  d="M24 65h132M47 38v98m86-98v98"
                  fill="none"
                  stroke="#c5993d"
                  strokeWidth="3"
                />
                <rect
                  x="51"
                  y="57"
                  width="78"
                  height="58"
                  rx="5"
                  fill="#243b43"
                  transform="rotate(-8 90 85)"
                />
                <circle
                  cx="90"
                  cy="84"
                  r="19"
                  fill="#17252d"
                  stroke="#638278"
                  strokeWidth="3"
                />
                <circle cx="90" cy="84" r="6" fill="#e7c162" />
                <text
                  x="90"
                  y="108"
                  textAnchor="middle"
                  fill="#dce0c7"
                  fontSize="6"
                  letterSpacing="1"
                >
                  AYO · ORIGINAL MASTER
                </text>
                <path d="M24 48l20-5" stroke="#f8de8a" strokeWidth="4" />
              </svg>
              <span className="eyebrow">
                EPISODE COMPLETE · THE MISSING BAG
              </span>
              <h2>
                Found: a song.
                <br />
                <em>And a little more German.</em>
              </h2>
              <p>
                The “thief” was a lost-property worker. Ayo’s recording is safe,
                the gig is on, and BERTI would like a complimentary ticket. For
                administrative purposes.
              </p>
              {state.songClue && (
                <p className="bonus">
                  ♪ Ayo grins: “You heard the clue in my song? Then you’re
                  officially in the band.”
                </p>
              )}
              <div className="phrase-souvenirs">
                <span>
                  „Wo ist die Tasche?“<small>Where is the bag?</small>
                </span>
                <span>
                  „Hast du … gesehen?“<small>Have you seen …?</small>
                </span>
                <span>
                  „Vielen Dank!“<small>Thank you so much!</small>
                </span>
              </div>
              <button className="primary" onClick={restart}>
                One more night ↺
              </button>
              <button
                className="text-link"
                onClick={() => {
                  audio.current?.pauseTrack();
                  dispatch({ type: "audio", audio: { playing: false } });
                  setLevel(state.level);
                  setResetOpen(true);
                }}
              >
                Change level & replay
              </button>
            </section>
          )}
          <footer>
            <span>
              U–BAHN RUSH <i>·</i> GET LOST IN BERLIN. FIND YOUR GERMAN.
            </span>
            <span>A FICTIONAL NIGHT. A REAL LITTLE ADVENTURE.</span>
          </footer>
        </>
      )}
      {(notice || audioError || storageError) && (
        <div className="notices" role="status">
          {notice && <p>✦ {notice}</p>}
          {audioError && <p>{audioError}</p>}
          {storageError && <p>{storageError}</p>}
        </div>
      )}
      {resetOpen && (
        <div
          className="modal-backdrop"
          onKeyDown={(e) => {
            if (e.key === "Escape") setResetOpen(false);
            if (e.key === "Tab") {
              const items =
                e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
              const first = items[0],
                last = items[items.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}
        >
          <section
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <span className="eyebrow">ANOTHER WAY THROUGH THE NIGHT</span>
            <h2 id="reset-title">Start a new adventure?</h2>
            <p>
              Your current story will be replaced. Choose your German level.
            </p>
            <div className="level-select">
              {(["A1", "A2", "B1"] as Level[]).map((l) => (
                <button
                  key={l}
                  className={level === l ? "active" : ""}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              className="primary"
              onClick={() => {
                restart();
                if (level !== state.level) {
                  dispatch({ type: "start", level });
                  setMessage(copy[level].intro);
                  setTranslation(level === "A1");
                  void audio.current?.playTrack(level);
                }
              }}
            >
              Start again ↺
            </button>
            <button
              className="text-link"
              autoFocus
              onClick={() => setResetOpen(false)}
            >
              Keep playing
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
