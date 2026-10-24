"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { AudioDirector } from "@/lib/audio";
import {
  completeEvidence,
  formatTime,
  interpretLocal,
  newGame,
  objective,
  reduce,
  restore,
  SAVE_KEY,
  type CharacterId,
  type ClueId,
  type GameState,
  type Level,
  type LocationId,
} from "@/lib/narrative";
import {
  characters,
  clueData,
  locations,
  objects,
  starters,
  storyLine,
} from "@/lib/story";
import { Facade, Portrait, Room } from "./Illustration";
import Modal from "./Modal";
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult:
    | ((e: {
        results: {
          [index: number]: { [index: number]: { transcript: string } };
        };
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
function Clock({
  seconds = 86340,
  large = false,
  reverse = false,
}: {
  seconds?: number;
  large?: boolean;
  reverse?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`${large ? "large-clock" : "small-clock"} ${reverse ? "reverse-clock" : ""}`}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="55"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          d="M60 11v6"
          stroke="currentColor"
          strokeWidth="1"
          transform={`rotate(${i * 30} 60 60)`}
        />
      ))}
      <path
        d="M60 60V30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${((seconds / 3600) % 12) * 30} 60 60)`}
      />
      <path
        className="clock-minute"
        d="M60 60V20"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ transform: `rotate(${((seconds / 60) % 60) * 6}deg)` }}
      />
      <circle cx="60" cy="60" r="3" fill="currentColor" />
    </svg>
  );
}
export default function Game() {
  const [state, dispatch] = useReducer(reduce, undefined, () => ({
    ...newGame(),
    started: false,
  }));
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [level, setLevel] = useState<Level>("A1");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"scripted" | "ai">("scripted");
  const [listening, setListening] = useState(false);
  const [sound, setSound] = useState(false);
  const [menu, setMenu] = useState<"pause" | "restart" | "settings" | null>(
    null,
  );
  const [dialogueOpen, setDialogueOpen] = useState(true);
  const [journalOpen, setJournalOpen] = useState(true);
  const [journalTab, setJournalTab] = useState<"clues" | "phrases">("clues");
  const [selectedClue, setSelectedClue] = useState<ClueId | null>(null);
  const [toast, setToast] = useState("");
  const [distortion, setDistortion] = useState<"rewind" | "midnight" | null>(
    null,
  );
  const [storageError, setStorageError] = useState("");
  const [help, setHelp] = useState(false);
  const audio = useRef<AudioDirector | null>(null);
  const request = useRef(0);
  const rec = useRef<Recognition | null>(null);
  const microphoneTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef(state);
  current.current = state;
  useEffect(() => {
    const director = new AudioDirector();
    director.onError = setToast;
    audio.current = director;
    try {
      const game = restore(localStorage.getItem(SAVE_KEY));
      setSaved(game);
      if (game) setLevel(game.level);
    } catch {
      setStorageError(
        "Saving is unavailable. You can still finish in this tab.",
      );
    }
    setReady(true);
    return () => {
      request.current++;
      rec.current?.stop();
      if (microphoneTimeout.current) clearTimeout(microphoneTimeout.current);
      director.dispose();
    };
  }, []);
  useEffect(() => {
    if (!ready || !state.started) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      setStorageError(
        "Progress could not be saved. Keep this tab open to finish.",
      );
    }
  }, [state, ready]);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.setVolume(state.preferences.volume);
    if (state.preferences.muted) audio.current.mute();
    else audio.current.unmute();
  }, [state.preferences.volume, state.preferences.muted]);
  useEffect(() => {
    if (!state.started || state.event === "none") return;
    setDialogueOpen(true);
    const e = state.event;
    if (e !== "dialogue") audio.current?.effect(e, state.eventId);
    if (e === "rewind" || e === "midnight") {
      setDistortion(e);
      setToast(
        e === "midnight"
          ? "The building forgot. Your journal didn’t."
          : "Conversation restored. Your discoveries stay.",
      );
      const id = state.eventId;
      const t = setTimeout(() => {
        setDistortion(null);
        if (current.current.eventId === id)
          void audio.current?.speak(
            state.dialogue.de,
            state.level,
            state.dialogue.voice,
          );
      }, 1300);
      return () => {
        clearTimeout(t);
        setDistortion(null);
      };
    }
    void audio.current?.speak(
      state.dialogue.de,
      state.level,
      state.dialogue.voice,
    );
    if (e === "clue")
      setToast(
        state.world.key
          ? "The basement key is yours. A different choice, a different night."
          : "A new connection. Your journal will remember.",
      );
  }, [state.eventId]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5200);
    return () => clearTimeout(t);
  }, [toast]);
  async function begin(demo = false) {
    request.current++;
    rec.current?.stop();
    setListening(false);
    setBusy(false);
    setMenu(null);
    setHelp(false);
    setDistortion(null);
    setSelectedClue(null);
    setJournalTab("clues");
    setJournalOpen(true);
    setText("");
    dispatch({ type: "new", level, demo });
    setSaved(null);
    setSource("scripted");
    await audio.current?.start();
    setSound(!!audio.current?.playing);
    const c = demo
      ? { de: characters.weber.greeting[level], voice: "greeting-weber" }
      : storyLine("intro", level);
    void audio.current?.speak(c.de, level, c.voice);
  }
  async function continueGame() {
    if (!saved) return;
    dispatch({ type: "load", state: saved });
    setSaved(null);
    setSource("scripted");
    await audio.current?.start();
    setSound(!!audio.current?.playing);
  }
  function move(scene: LocationId) {
    if (busy || listening || distortion) return;
    setSelectedClue(null);
    setHelp(false);
    dispatch({ type: "move", scene });
  }
  async function talk(phrase?: string) {
    const value = (phrase || text).trim();
    if (!value || busy || listening || distortion) return;
    setText("");
    setBusy(true);
    const id = ++request.current;
    const snapshot = state;
    audio.current?.duckForDialogue();
    let interpretation: unknown = interpretLocal(value);
    let mode: "scripted" | "ai" = "scripted";
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          level: state.level,
          character: state.active,
          knowledge: state.knowledge,
        }),
        signal: AbortSignal.timeout(8500),
      });
      if (response.ok) {
        const result = await response.json();
        if (result.interpretation) {
          interpretation = result.interpretation;
          mode = result.source === "ai" ? "ai" : "scripted";
        }
      }
    } catch {
      /* The local interpretation is the complete offline path. */
    }
    if (id !== request.current) return;
    setSource(mode);
    setBusy(false);
    if (current.current.world.scene === snapshot.world.scene)
      dispatch({ type: "talk", text: value, interpretation });
    else audio.current?.restoreAfterDialogue();
  }
  function mic() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const R = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!R) {
      setToast(
        "Speech recognition is unavailable. Type your German or use a sentence starter.",
      );
      return;
    }
    const r = new R();
    rec.current = r;
    r.lang = "de-DE";
    r.interimResults = false;
    r.continuous = false;
    const finish = () => {
      setListening(false);
      audio.current?.endMicrophoneMode();
      if (microphoneTimeout.current) clearTimeout(microphoneTimeout.current);
    };
    r.onresult = (e) => {
      setText(e.results[0][0].transcript);
      setToast("Words captured. Review them, then send.");
    };
    r.onend = finish;
    r.onerror = () => {
      finish();
      setToast(
        "The microphone could not listen. Typed German works just as well.",
      );
    };
    try {
      audio.current?.startMicrophoneMode();
      setListening(true);
      r.start();
      microphoneTimeout.current = setTimeout(() => {
        r.stop();
        finish();
      }, 15000);
    } catch {
      finish();
      setToast("Microphone unavailable. Type your reply instead.");
    }
  }
  function pause() {
    request.current++;
    setBusy(false);
    rec.current?.stop();
    setListening(false);
    audio.current?.pause();
    setSound(false);
    setMenu("pause");
  }
  async function resume() {
    setMenu(null);
    await audio.current?.start();
    setSound(!!audio.current?.playing);
  }
  async function toggleSound() {
    if (sound) {
      audio.current?.pause();
      setSound(false);
    } else {
      await audio.current?.start();
      setSound(!!audio.current?.playing);
    }
  }
  function rewind() {
    if (!state.checkpoint || busy || listening) return;
    dispatch({ type: "rewind" });
    setText("");
  }
  const active = characters[state.active];
  const inConversation = state.world.scene !== "basement" && !state.ending;
  const journalDetail = selectedClue ? clueData[selectedClue] : null;
  const disabled = busy || listening || !!distortion;
  const all = completeEvidence(state);
  const act = state.ending
    ? "CASE CLOSED"
    : state.night === 1
      ? "ACT I · THE DISCOVERY"
      : state.world.key
        ? "ACT III · THE REVEAL"
        : "ACT II · THE INVESTIGATION";
  if (!ready)
    return (
      <main className="loading">
        <span className="loading-logo">
          NOCHMAL<span>!</span>
        </span>
        <p>The night is finding its way back.</p>
      </main>
    );
  return (
    <main
      className={`app ${distortion ? "time-distortion " + distortion : ""}`}
    >
      <header className="site-header">
        <a href="/" className="wordmark" aria-label="NOCHMAL home">
          NOCHMAL<span>!</span>
          <i>↶</i>
        </a>
        <div className="header-story">
          <span className="status-dot" />
          BERLIN · ORANIENSTRASSE 17
          <span className="header-divider" />
          THE NIGHT THAT KEEPS REPEATING
        </div>
        <div className="header-controls">
          <span className="edition">EPISODE 01</span>
          {state.started && (
            <>
              <span className="mobile-time">
                {formatTime(state.world.seconds)}
              </span>
              <span className="language-badge">{state.level} DE</span>
              <button
                aria-label="Pause game"
                className="icon-button"
                onClick={pause}
              >
                II
              </button>
            </>
          )}
        </div>
      </header>
      {!state.started ? (
        <section className="title-screen">
          <div className="title-copy">
            <div className="eyebrow">
              <span className="tiny-star">✳</span> A TIME-LOOP MYSTERY IN BERLIN
            </div>
            <h1>
              The night ends.
              <br />
              <em>
                Your story
                <br />
                doesn’t.
              </em>
            </h1>
            <p className="tagline">Change your words. Change your fate.</p>
            <p className="title-description">
              One missing painting. One missing neighbor.
              <br />
              Three minutes until midnight.
              <br />
              You’ve been here before. This time, say it differently.
            </p>
            <div
              className="language-choice"
              role="group"
              aria-label="Choose your German level"
            >
              {(["A1", "A2"] as Level[]).map((l) => (
                <button
                  aria-pressed={level === l}
                  className={level === l ? "selected" : ""}
                  key={l}
                  onClick={() => setLevel(l)}
                >
                  <b>{l}</b>
                  <span>
                    {l === "A1" ? "A little German" : "A little more German"}
                  </span>
                  <i>{level === l ? "✓" : "○"}</i>
                </button>
              ))}
            </div>
            {saved && (
              <button
                className="primary continue-button"
                onClick={continueGame}
              >
                Continue night {String(saved.night).padStart(2, "0")}{" "}
                <span>→</span>
              </button>
            )}
            <button
              className={
                saved ? "secondary start-button" : "primary start-button"
              }
              onClick={() => begin(false)}
            >
              {saved ? "Start a new story" : "Start the night"} <span>→</span>
            </button>
            <button className="demo-link" onClick={() => begin(true)}>
              ↶ Try the two-minute rewind demo <span>OFFLINE READY</span>
            </button>
            <div className="title-footnotes">
              <span>10–15 MINUTES AT YOUR PACE</span>
              <span>READ, TYPE OR SPEAK</span>
              <span>NO PERFECT GERMAN REQUIRED</span>
            </div>
          </div>
          <div className="title-art">
            <div className="art-topline">
              <span>52°30′ N 13°25′ E</span>
              <span>23:57</span>
            </div>
            <Facade />
            <div className="clock-watermark">
              <Clock large />
            </div>
            <div className="building-caption">
              <span>
                A LIGHT IS ON.
                <br />
                SOMEONE IS STILL WAITING.
              </span>
              <span className="building-number">17</span>
            </div>
            <div className="episode-ticket">
              <span>EPISODE ONE</span>
              <strong>
                The Missing
                <br />
                Painting
              </strong>
              <i>KEEP THIS NIGHT. TRY AGAIN.</i>
              <div>┃┃│┃│┃┃││┃┃│┃┃│┃</div>
            </div>
          </div>
          <div className="title-bottom">
            <span>ORIGINAL ART, SOUND & SYNTHETIC GERMAN VOICES</span>
            <span>AN IMPERFECT SENTENCE CAN CHANGE EVERYTHING.</span>
          </div>
        </section>
      ) : (
        <>
          <section className="chapter-heading">
            <div>
              <span className="eyebrow">{act}</span>
              <h1>
                {state.ending
                  ? "Some nights are worth remembering."
                  : state.night === 1
                    ? "Something is missing from this night."
                    : state.world.scene === "basement"
                      ? "Down here, every silence has a story."
                      : "A familiar night. A different choice."}
              </h1>
            </div>
            <div className="loop-indicator">
              <span className="loop-symbol">↶</span>
              <div>
                <span className="eyebrow">YOU REMEMBER</span>
                <b>NIGHT {String(state.night).padStart(2, "0")}</b>
              </div>
            </div>
          </section>
          {state.demo && (
            <div className="demo-banner">
              <b>DEMO TIMELINE</b>
              <span>
                You already found the note and maintenance log. Demand the key,
                press NOCHMAL!, then explain the water leak. These are real game
                transitions.
              </span>
            </div>
          )}
          <div className="play-grid">
            <section className="play-area">
              <div className="scene-card">
                <div className="scene-topline">
                  <span className="eyebrow">
                    <span className="status-dot" />{" "}
                    {locations[state.world.scene].kicker}
                  </span>
                  <span className="scene-counter">
                    0
                    {state.world.scene === "hallway"
                      ? 1
                      : state.world.scene === "office"
                        ? 2
                        : 3}{" "}
                    / 03
                  </span>
                </div>
                <div className="interactive-scene">
                  <Room
                    location={state.world.scene}
                    rescued={state.world.noraRescued}
                    painting={state.world.paintingRecovered}
                  />
                  {objects
                    .filter((o) => o.location === state.world.scene)
                    .map((o) => (
                      <button
                        key={o.id}
                        className={`hotspot ${state.world.inspected.includes(o.id) ? "examined" : ""}`}
                        style={{ left: `${o.x}%`, top: `${o.y}%` }}
                        aria-label={`Examine ${o.label}`}
                        disabled={disabled || !!state.ending}
                        onClick={() => dispatch({ type: "inspect", id: o.id })}
                      >
                        <span className="hotspot-ring">
                          {state.world.inspected.includes(o.id) ? "·" : "+"}
                        </span>
                        <span className="hotspot-label">{o.label}</span>
                      </button>
                    ))}
                  <div className="scene-title">
                    <span className="small-label">ORANIENSTRASSE 17</span>
                    <h2>{locations[state.world.scene].de}</h2>
                    <small>{locations[state.world.scene].name}</small>
                  </div>
                  <span className="scene-instruction">
                    LOOK CLOSER. EVERY DETAIL HAS A MEMORY.
                  </span>
                </div>
                <nav className="location-nav" aria-label="Explore the building">
                  {(Object.keys(locations) as LocationId[]).map((loc, i) => (
                    <button
                      key={loc}
                      aria-current={
                        state.world.scene === loc ? "location" : undefined
                      }
                      onClick={() => move(loc)}
                      disabled={disabled || !!state.ending}
                      className={state.world.scene === loc ? "active" : ""}
                    >
                      <span className="location-number">0{i + 1}</span>
                      <span>{locations[loc].name}</span>
                      <i>
                        {loc === "basement" && !state.world.key
                          ? "LOCK"
                          : state.world.scene === loc
                            ? "●"
                            : "→"}
                      </i>
                    </button>
                  ))}
                </nav>
              </div>
              <section
                className="conversation-card"
                aria-label="Conversation and observations"
              >
                <div
                  className="cast-tabs"
                  role="group"
                  aria-label="Choose someone to talk to"
                >
                  {Object.entries(characters)
                    .filter(([, c]) => c.location === state.world.scene)
                    .map(([id, c]) => (
                      <button
                        className={state.active === id ? "active" : ""}
                        key={id}
                        disabled={disabled || !!state.ending}
                        aria-pressed={state.active === id}
                        onClick={() =>
                          dispatch({ type: "character", id: id as CharacterId })
                        }
                      >
                        <span className="cast-dot" />
                        {c.name}
                        <small>
                          {id === "milo"
                            ? "THE MUSICIAN"
                            : id === "lena"
                              ? "THE NEIGHBOR"
                              : "THE CARETAKER"}
                        </small>
                      </button>
                    ))}
                  {state.world.scene === "basement" && (
                    <span className="basement-caption">
                      {state.world.noraRescued
                        ? "NORA IS SAFE. NOW CONNECT THE PIECES."
                        : "A PAINTING CAN WAIT. CAN A PERSON?"}
                    </span>
                  )}
                  <button
                    className="translate-toggle"
                    aria-pressed={state.preferences.english}
                    onClick={() =>
                      dispatch({
                        type: "preferences",
                        value: { english: !state.preferences.english },
                      })
                    }
                  >
                    DE <span>/</span> EN {state.preferences.english ? "✓" : "+"}
                  </button>
                </div>
                <button
                  className="dialogue-collapse"
                  onClick={() => setDialogueOpen(!dialogueOpen)}
                  aria-expanded={dialogueOpen}
                  aria-controls="dialogue-content"
                >
                  {dialogueOpen ? "Hide conversation" : "Open conversation"}{" "}
                  <span>{dialogueOpen ? "−" : "+"}</span>
                </button>
                <div
                  className="dialogue-layout"
                  id="dialogue-content"
                  hidden={!dialogueOpen}
                >
                  <div className="speaker-portrait">
                    <Portrait id={state.dialogue.speaker} />
                    <span>
                      {state.dialogue.speaker === "narrator"
                        ? "YOUR OBSERVATION"
                        : state.dialogue.speaker === "nora"
                          ? "NORA"
                          : characters[
                              state.dialogue.speaker
                            ].name.toUpperCase()}
                    </span>
                  </div>
                  <div className="dialogue-body">
                    <div className="dialogue-kicker">
                      <span className="eyebrow">
                        {busy
                          ? "FINDING THE MEANING…"
                          : state.dialogue.speaker === "narrator"
                            ? "THE BUILDING HAS SOMETHING TO TELL YOU"
                            : state.dialogue.speaker === "nora"
                              ? "A VOICE BEHIND THE DOOR"
                              : characters[state.dialogue.speaker].role}
                      </span>
                      <button
                        className="listen-button"
                        aria-label="Listen to dialogue"
                        onClick={async () => {
                          if (!sound) {
                            await audio.current?.start();
                            setSound(!!audio.current?.playing);
                          }
                          void audio.current?.speak(
                            state.dialogue.de,
                            state.level,
                            state.dialogue.voice,
                          );
                        }}
                      >
                        ◖))
                      </button>
                    </div>
                    <p lang="de" className="german-dialogue" aria-live="polite">
                      {busy ? "Einen Moment…" : state.dialogue.de}
                    </p>
                    {state.preferences.english && (
                      <p className="english-dialogue">{state.dialogue.en}</p>
                    )}
                    <div className="consequence">
                      <span>→</span>
                      <span>{state.dialogue.outcome}</span>
                    </div>
                    {inConversation && (
                      <>
                        <form
                          className="reply-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void talk();
                          }}
                        >
                          <label htmlFor="reply">
                            WHAT DO YOU SAY TO {active.name.toUpperCase()}?
                          </label>
                          <div className="reply-field">
                            <input
                              id="reply"
                              maxLength={500}
                              lang="de"
                              placeholder={
                                state.active === "weber"
                                  ? "Ich brauche den Schlüssel…"
                                  : "Hallo, hast du…"
                              }
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              disabled={disabled}
                              autoComplete="off"
                            />
                            <button
                              type="button"
                              className={`mic-button ${listening ? "recording" : ""}`}
                              aria-label={
                                listening ? "Stop microphone" : "Speak German"
                              }
                              onClick={mic}
                              disabled={busy || !!distortion}
                            >
                              <svg
                                width="18"
                                height="22"
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
                            </button>
                            <button
                              className="send-button"
                              type="submit"
                              aria-label="Send German reply"
                              disabled={disabled || !text.trim()}
                            >
                              →
                            </button>
                          </div>
                        </form>
                        <div className="sentence-starters">
                          <span>NEED A FIRST WORD?</span>
                          {starters[state.active].map((phrase) => (
                            <button
                              lang="de"
                              key={phrase}
                              onClick={() => talk(phrase)}
                              disabled={disabled}
                            >
                              {phrase} <i>→</i>
                            </button>
                          ))}
                        </div>
                        <div className="interpretation-label">
                          <span className="status-dot" />
                          {source === "ai"
                            ? "AI INTENT INTERPRETATION"
                            : "SCRIPTED OFFLINE INTERPRETATION"}
                          <span>MEANING OVER PERFECT GRAMMAR</span>
                        </div>
                      </>
                    )}
                    {state.world.scene === "basement" &&
                      state.world.paintingRecovered &&
                      !state.ending && (
                        <div className="resolve-card">
                          <div>
                            <b>
                              {all
                                ? "Every piece fits."
                                : "You can close the case. But do you know the whole truth?"}
                            </b>
                            <p>
                              {all
                                ? "Nora is safe. You understand why the painting vanished."
                                : "Recovering the painting is one ending. Rescuing Nora and connecting all seven clues reveals the other."}
                            </p>
                          </div>
                          <button
                            className="primary"
                            disabled={disabled}
                            onClick={() => dispatch({ type: "resolve" })}
                          >
                            Close the case →
                          </button>
                        </div>
                      )}
                  </div>
                </div>
                {state.comparison && (
                  <div
                    className="timeline-comparison"
                    aria-label="Alternative timeline comparison"
                  >
                    <div className="timeline-before">
                      <span>THE OTHER TIMELINE</span>
                      <q lang="de">{state.comparison.before.phrase}</q>
                      <p>{state.comparison.before.outcome}</p>
                    </div>
                    <span className="timeline-arrow">↶</span>
                    <div className="timeline-after">
                      <span>THIS TIME</span>
                      {state.comparison.after ? (
                        <>
                          <q lang="de">{state.comparison.after.phrase}</q>
                          <p>{state.comparison.after.outcome}</p>
                        </>
                      ) : (
                        <p className="try-again">
                          The moment is yours again.
                          <br />
                          Try a different way in.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="rewind-strip">
                  <div>
                    <span className="rewind-small">↶</span>
                    <p>
                      Different words.
                      <br />
                      <b>A different night.</b>
                    </p>
                  </div>
                  <button
                    className="rewind-button"
                    onClick={rewind}
                    disabled={!state.checkpoint || disabled || !!state.ending}
                  >
                    <span>↶</span> NOCHMAL!<small>REWIND LAST REPLY</small>
                  </button>
                </div>
              </section>
            </section>
            <aside className="journal-column">
              <section className="clock-card">
                <div className="clock-meta">
                  <span className="eyebrow">THE NIGHT DOESN’T WAIT</span>
                  <span className="clock-loop">
                    LOOP {String(state.night).padStart(2, "0")}
                  </span>
                </div>
                <div className="clock-display">
                  <Clock seconds={state.world.seconds} reverse={!!distortion} />
                  <div>
                    <time>
                      {formatTime(state.world.seconds)}
                      <small className="clock-seconds">
                        :{String(state.world.seconds % 60).padStart(2, "0")}
                      </small>
                    </time>
                    <span>UNTIL EVERYTHING BEGINS AGAIN</span>
                  </div>
                </div>
                <div className="time-track">
                  <i
                    style={{
                      width: `${((state.world.seconds - 86220) / 180) * 100}%`,
                    }}
                  />
                </div>
                <p>Time moves when you act. Take a breath.</p>
              </section>
              <section className="objective-card">
                <span className="eyebrow">✳ A THREAD TO FOLLOW</span>
                <p>{objective(state)}</p>
                <button
                  className="hint-button"
                  onClick={() => setHelp(!help)}
                  aria-expanded={help}
                >
                  {help ? "Close hint" : "A gentle nudge"} <span>→</span>
                </button>
                {help && (
                  <div className="hint-text">
                    {state.night === 1
                      ? "Inspect the note, meet your neighbors, then visit Weber. At midnight, watch what stays."
                      : !state.world.key
                        ? "Find the note in the hallway and the maintenance log in the office. Explain the leak to Weber: “Ich brauche den Schlüssel. Wasser im Keller!”"
                        : !state.world.noraRescued
                          ? "Milo is in the hallway. Ask about his recording. In the basement, use the red lever after reading the maintenance log."
                          : "Read Lena’s statement, the note, Weber’s photograph and log. Inspect the canvas, hear Milo’s tape and rescue Nora. All seven clues make the complete truth."}
                  </div>
                )}
              </section>
              <section className={`journal ${journalOpen ? "open" : ""}`}>
                <button
                  className="journal-heading"
                  onClick={() => setJournalOpen(!journalOpen)}
                  aria-expanded={journalOpen}
                >
                  <span className="journal-icon">▤</span>
                  <div>
                    <span className="eyebrow">YOUR DETECTIVE JOURNAL</span>
                    <h2>Things you remember.</h2>
                  </div>
                  <span>{journalOpen ? "−" : "+"}</span>
                </button>
                {journalOpen && (
                  <>
                    <div className="journal-tabs">
                      <button
                        className={journalTab === "clues" ? "active" : ""}
                        onClick={() => setJournalTab("clues")}
                      >
                        Evidence{" "}
                        <span>
                          {String(state.knowledge.length).padStart(2, "0")} / 07
                        </span>
                      </button>
                      <button
                        className={journalTab === "phrases" ? "active" : ""}
                        onClick={() => setJournalTab("phrases")}
                      >
                        Found words <span>{state.language.phrases.length}</span>
                      </button>
                    </div>
                    {journalTab === "clues" ? (
                      <>
                        <div className="clue-list">
                          {state.knowledge.length === 0 ? (
                            <div className="empty-journal">
                              <span>✧</span>
                              <p>
                                An empty page.
                                <br />A very familiar feeling.
                              </p>
                            </div>
                          ) : (
                            state.knowledge.map((id) => (
                              <button
                                className={`clue-card ${selectedClue === id ? "selected" : ""}`}
                                key={id}
                                onClick={() =>
                                  setSelectedClue(
                                    selectedClue === id ? null : id,
                                  )
                                }
                                aria-expanded={selectedClue === id}
                              >
                                <span className="clue-number">
                                  {clueData[id].icon}
                                </span>
                                <div>
                                  <b>{clueData[id].title}</b>
                                  <small>
                                    {clueData[id].connects.some((c) =>
                                      state.knowledge.includes(c),
                                    )
                                      ? "CONNECTED TO ANOTHER CLUE"
                                      : "A LOOSE THREAD"}
                                  </small>
                                </div>
                                <span>→</span>
                              </button>
                            ))
                          )}
                        </div>
                        {journalDetail && selectedClue && (
                          <div className="clue-detail">
                            <span className="eyebrow">
                              {journalDetail.title}
                            </span>
                            <p lang="de">{journalDetail.de}</p>
                            {state.preferences.english && (
                              <p className="english-dialogue">
                                {journalDetail.en}
                              </p>
                            )}
                            <div className="connections">
                              <span>CONNECTS WITH</span>
                              {journalDetail.connects
                                .filter((c) => state.knowledge.includes(c))
                                .map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => setSelectedClue(c)}
                                  >
                                    {clueData[c].title} →
                                  </button>
                                ))}
                              {!journalDetail.connects.some((c) =>
                                state.knowledge.includes(c),
                              ) && (
                                <small>
                                  Keep looking. There’s another side to this
                                  story.
                                </small>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="phrases-list">
                        {state.language.phrases.length === 0 ? (
                          <p>
                            Useful words will find their way here. No quizzes.
                            Just memories.
                          </p>
                        ) : (
                          <>
                            <span className="eyebrow">
                              WORDS YOU MADE PART OF THE STORY
                            </span>
                            {state.language.phrases.map((phrase, i) => (
                              <p lang="de" key={i}>
                                “{phrase}”
                              </p>
                            ))}
                            <div className="vocabulary">
                              {state.language.vocabulary.map((v) => (
                                <span key={v} lang="de">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    <div className="journal-footnote">
                      <span>↶</span> Your memories survive midnight.
                    </div>
                  </>
                )}
              </section>
              <section className="pocket-card">
                <span className="eyebrow">
                  IN YOUR POCKET · THIS NIGHT ONLY
                </span>
                <div
                  className={
                    state.world.key ? "pocket-item acquired" : "pocket-item"
                  }
                >
                  <span>
                    <svg
                      width="25"
                      height="25"
                      viewBox="0 0 28 28"
                      aria-hidden="true"
                    >
                      <circle
                        cx="9"
                        cy="9"
                        r="6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M13 14l11 11m-5-5 4-4m-8 0 3-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                  <p>
                    <span>
                      {state.world.key
                        ? "The basement key"
                        : "No key. Not yet."}
                    </span>
                    <small>
                      {state.world.key
                        ? "A reason was worth more than a demand."
                        : "Weber keeps it close."}
                    </small>
                  </p>
                  {state.world.key && <i>✓</i>}
                </div>
                {state.world.paintingRecovered && (
                  <div className="pocket-item acquired">
                    <span>▧</span>
                    <p>
                      <span>The painting</span>
                      <small>Safe from the water.</small>
                    </p>
                    <i>✓</i>
                  </div>
                )}
                {state.world.noraRescued && (
                  <div className="pocket-item acquired">
                    <span>♡</span>
                    <p>
                      <span>Nora is safe</span>
                      <small>The person behind the mystery.</small>
                    </p>
                    <i>✓</i>
                  </div>
                )}
              </section>
            </aside>
          </div>
          <div className="bottom-controls">
            <div>
              <span className="small-orbit">↶</span>
              <span>
                {state.rewinds} CONVERSATION REWINDS <i>·</i> {state.night - 1}{" "}
                MIDNIGHT RESETS
              </span>
            </div>
            <div className="control-buttons">
              <button
                onClick={toggleSound}
                aria-label={sound ? "Pause atmosphere" : "Play atmosphere"}
              >
                {sound ? "◖))" : "◌"}{" "}
                <span>{sound ? "SOUND ON" : "SOUND OFF"}</span>
              </button>
              <button
                onClick={() => {
                  pause();
                  setMenu("settings");
                }}
              >
                ⚙ <span>SETTINGS</span>
              </button>
              <button
                disabled={disabled || !!state.ending}
                onClick={() => dispatch({ type: "wait" })}
              >
                ↶ <span>WAIT FOR MIDNIGHT</span>
              </button>
              <button onClick={pause}>
                II <span>PAUSE</span>
              </button>
            </div>
          </div>
          {state.ending && (
            <section
              className={`ending-card ${state.ending}`}
              aria-label="Mystery ending"
            >
              <div className="ending-emblem">
                {state.ending === "complete" ? "✳" : "◒"}
              </div>
              <span className="eyebrow">
                {state.ending === "complete"
                  ? "ENDING A · THE TRUTH REVEALED"
                  : "ENDING B · THE INCOMPLETE TRUTH"}
              </span>
              <h2>
                {state.ending === "complete" ? (
                  <>
                    Not a stolen painting.
                    <br />
                    <em>A story worth saving.</em>
                  </>
                ) : (
                  <>
                    You found the painting.
                    <br />
                    <em>But not the whole picture.</em>
                  </>
                )}
              </h2>
              <p>
                {state.ending === "complete"
                  ? "Weber and Nora moved Eva’s painting away from a burst pipe. Then the damp archive door jammed, trapping Nora inside. Milo’s recording led you to the red release lever. Lena’s terrifying scream? Hot coffee. The painting is safe. Nora is home. And for the first time, the clock reads 00:01."
                  : `The canvas is dry and undamaged. You call the case closed, but ${state.world.noraRescued ? "Weber looks at Eva’s photograph. There is still a part of this story you never asked about." : "a faint knock comes from behind the archive door. Nora is still waiting."} You recovered an object. Another night could reveal the people behind it.`}
              </p>
              <div className="ending-time">
                {state.ending === "complete" ? "00:01" : "23:59"}
                <span>
                  {state.ending === "complete"
                    ? "TOMORROW. AT LAST."
                    : "SOME QUESTIONS OUTLIVE THE NIGHT."}
                </span>
              </div>
              <p className="ending-quote" lang="de">
                {state.ending === "complete"
                  ? "„Manchmal braucht man keine perfekten Worte. Nur den Mut, noch einmal zu fragen.“"
                  : "„Wir sehen uns wieder. Vielleicht sagst du es dann anders.“"}
              </p>
              <details className="ending-phrases">
                <summary>A few words you took with you</summary>
                <div>
                  {state.language.vocabulary.map((w) => (
                    <span key={w} lang="de">
                      {w}
                    </span>
                  ))}
                </div>
                <p>
                  „Können Sie mir helfen?“ — Can you help me?
                  <br />
                  „Ich habe einen Hinweis.“ — I have a clue.
                  <br />
                  „Noch einmal.“ — Once more.
                </p>
              </details>
              <button
                className="primary"
                onClick={() => {
                  setLevel(state.level);
                  setMenu("restart");
                }}
              >
                Another night, another ending ↶
              </button>
              <span className="next-episode">
                NEXT TIME: SOMEONE IN APARTMENT 6 REMEMBERS TOO.
              </span>
            </section>
          )}
          <footer>
            <span>
              NOCHMAL! <i>·</i> CHANGE YOUR WORDS. CHANGE YOUR FATE.
            </span>
            <span>AN ORIGINAL BERLIN MYSTERY / EPISODE 01</span>
          </footer>
        </>
      )}
      {(toast || storageError) && (
        <div className="notifications" role="status">
          {toast && (
            <p>
              <span>✳</span>
              {toast}
            </p>
          )}
          {storageError && <p>{storageError}</p>}
        </div>
      )}
      {distortion && (
        <div className="rewind-overlay" role="status" aria-live="assertive">
          <div className="rewind-rings" />
          <Clock large reverse />
          <span className="eyebrow">
            {distortion === "midnight"
              ? "00:00 · THE NIGHT BEGINS AGAIN"
              : "ONE CONVERSATION. ONE MORE CHANCE."}
          </span>
          <strong>
            {distortion === "midnight" ? "MITTERNACHT." : "NOCHMAL!"}
          </strong>
          <p>
            {distortion === "midnight"
              ? "The building forgets. You don’t."
              : "Change your words. Change what happens next."}
          </p>
        </div>
      )}
      {menu && (
        <Modal
          title={
            menu === "pause"
              ? "Between two seconds."
              : menu === "settings"
                ? "Make the night yours."
                : "Another way through the night."
          }
          onClose={resume}
        >
          {menu === "pause" ? (
            <>
              <p>
                The clock only moves when you act. Nothing happens while you’re
                away.
              </p>
              <button className="primary" onClick={resume}>
                Keep playing →
              </button>
              <button className="menu-link" onClick={() => setMenu("settings")}>
                Sound & language support
              </button>
              <button
                className="menu-link"
                onClick={() => {
                  setLevel(state.level);
                  setMenu("restart");
                }}
              >
                Restart this story
              </button>
            </>
          ) : menu === "restart" ? (
            <>
              <p>
                Start from the beginning with an empty journal. Your current
                save will be replaced.
              </p>
              <div className="language-choice">
                {(["A1", "A2"] as Level[]).map((l) => (
                  <button
                    key={l}
                    className={level === l ? "selected" : ""}
                    onClick={() => setLevel(l)}
                  >
                    {l} · {l === "A1" ? "Beginner" : "Elementary"}
                  </button>
                ))}
              </div>
              <button className="primary" onClick={() => begin(false)}>
                Start a new story →
              </button>
              <button className="menu-link" onClick={resume}>
                Keep this timeline
              </button>
            </>
          ) : (
            <>
              <p>
                German subtitles are always visible. No clue depends on sound.
                Your journal and the clock wait while this panel is open.
              </p>
              <label className="settings-check">
                <input
                  type="checkbox"
                  checked={state.preferences.english}
                  onChange={(e) =>
                    dispatch({
                      type: "preferences",
                      value: { english: e.target.checked },
                    })
                  }
                />{" "}
                Show English translations
              </label>
              <label className="settings-range">
                Atmosphere & voice volume{" "}
                <span>{Math.round(state.preferences.volume * 100)}%</span>
                <input
                  aria-label="Audio volume"
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={state.preferences.volume}
                  onChange={(e) =>
                    dispatch({
                      type: "preferences",
                      value: { volume: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="settings-check">
                <input
                  type="checkbox"
                  checked={state.preferences.muted}
                  onChange={(e) =>
                    dispatch({
                      type: "preferences",
                      value: { muted: e.target.checked },
                    })
                  }
                />{" "}
                Mute all audio
              </label>
              <small className="audio-disclosure">
                Original generated ambience + bundled synthetic spoken German.
                Dynamic observations use a German browser voice when available.
                Reduced motion follows your device settings.
              </small>
              <button className="primary" onClick={resume}>
                Back to the story →
              </button>
            </>
          )}
        </Modal>
      )}
    </main>
  );
}
