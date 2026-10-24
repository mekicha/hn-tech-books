# U-Bahn Rush

**Get lost in Berlin. Find your German.** A playable, original Berlin night adventure built with Next.js App Router, React, TypeScript, Tailwind, custom SVG art, and Web Audio.

## Play locally

Use Node 24 (pinned in `.node-version`; minimum 22.18), then:

```sh
npm ci
npm run dev
```

Open the development server on port 3000 in your browser. Click **Enter the underground** to unlock browser audio. No account, API key, music subscription, database, or external asset service is required. This cloud workspace uses `npm ci --cache /workspace/.npm-cache` because the home directory is read-only.

Choose A1, A2 or B1. Follow Ayo’s directions, select a station on the map, choose your line, and board. At Kottbusser Tor, ask Deniz about the missing yellow bag, using typed German, the suggested question, or speech recognition. He tolerates imperfect German. Follow the receipt to Alexanderplatz, then ask BERTI to open the locker. Read the lyrics for an optional additional story moment. Wrong lines and wrong locker numbers never end the game. The departure timer is fictional, repeats, and never punishes the player. Progress and audio preferences save locally; saved games resume with audio paused until another click.

The intended experience is roughly 5–10 minutes with conversations, music and exploration. A direct speedrun is shorter. Three fully interactive story scenes are at Warschauer Straße, Kottbusser Tor and Alexanderplatz; intermediate stations are transit stops, not additional character scenes. This is a simplified game network, not a journey planner or live timetable.

## Optional OpenAI character interpretation

Copy `.env.example` to `.env.local` and securely set `UBAHN_OPENAI_API_KEY` server-side. `OPENAI_API_KEY` is also supported for conventional deployments. Never use a `NEXT_PUBLIC_` name. Set `OPENAI_MODEL` if needed (default `gpt-4.1-mini`), then restart Next.js. The server needs outbound HTTPS to `api.openai.com`.

The API classifies a finite semantic intent with a strict JSON schema; replies and rewards come from the deterministic level-specific story. It cannot invent station routes, locker codes or new facts. `/api/chat` validates level, station and message length. Timeout, offline and invalid model results use the complete scripted fallback. UI and server both have fallbacks, and the client reducer validates station/evidence before granting progress. The AI key is optional and has not been needed to test the complete mystery. For public deployments, apply your host’s authentication/rate limits and spending controls to this paid endpoint.

## Soundtrack

Three original oscillator scores play through a central `AudioDirector`. Bundled German **synthetic spoken passages** accompany each level. These are functional prototype music and speech, not professionally recorded singing. The German MP3 assets are served locally, so German song passages work even when the browser has no installed German voice. Core character dialogue also has bundled speech; dynamic travel and error messages can use browser speech when available. All essential information is readable.

A1 is slower, warm indie pop; A2 uses a quicker electronic motif; B1 uses an atmospheric minor motif. Each has original German lyrics and English translations in `lib/songs.ts`. The optional lyrics panel follows speech requests rather than pretending to have precise karaoke timing. Tap any line for English. The yellow-bag lyric has the same story clue at every level; Ayo’s written directions supply an alternative.

The director implements play/pause, smooth volume ramps, mute, dialogue ducking, microphone suppression, train transition tones, a Kotti arrival cue, deduplicated clue stings and a brighter discovery layer, ending theme, and a filtered descending rewind effect. Vocals are cancelled before new speech; pending fetches are generation-guarded. Browser autoplay is respected. It handles unavailable audio without blocking the game.

To regenerate the bundled passages, install FFmpeg and run:

```sh
npm run audio:generate
```

Node uses the locked eSpeak NG development dependency. The script creates compressed MP3s from the original story/lyric text. Browser users never download the synthesizer. See `public/audio/README.md` for provenance and replacement instructions.

## Checks

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

On this cloud machine, Chromium is already installed and Playwright’s download domain is restricted. Use:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

Unit tests cover adjacency, navigation, all levels’ complete state transitions, soundtrack metadata, lyrics/translations, intent fallback, clues, ending validation, save restoration, audio modes and cue deduplication, and shipped audio assets. Playwright exercises the whole mystery on desktop and mobile, wrong choices, persisted progress, replay, A2/B1 content, the API contract, actual non-silent audio decoding/playback, dialogue gain ramps, and simulated microphone recognition/suppression. Real OS microphone permission and hardware recognition vary by browser; unsupported or denied access has typed and suggested-question fallbacks.

Do not run `next build` and `next dev` against the same `.next` directory simultaneously. Stop the development server before building.

## Deployment

```sh
npm run build
npm start
```

Deploy as a Node.js Next.js app, or import the repository into a Next.js-compatible host such as Vercel. The API route requires a server runtime; a static export cannot provide OpenAI interaction. Set the optional server-side key through the host’s secure environment settings. No secrets belong in Git. Speech recognition requires HTTPS (or localhost); all other gameplay works with text. This project has no analytics or remote save service. Clearing browser storage clears progress.

## Structure

- `components/Game.tsx`: responsive adventure UI, microphone lifecycle, persistence, travel and dialogue.
- `components/Map.tsx`, `Scene.tsx`: original accessible SVG network, train, kiosk, portraits and lost-property scene.
- `lib/game.ts`: station graph, deterministic story reducer, intent fallback and CEFR content.
- `lib/audio.ts`, `songs.ts`, `voices.ts`: reactive soundtrack, lyric variants, speech asset adapter.
- `app/api/chat/route.ts`: optional server-only OpenAI intent interpretation.
- `tests/`: unit and browser checks.

Keyboard: tab to stations, activate with Enter/Space, use standard form controls. The restart dialog supports Escape and traps focus. English translations, lyrics, music volume, mute and reduced-motion support are available. Replay can change the CEFR level.
