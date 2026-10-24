# NOCHMAL!

**The Night That Keeps Repeating.** Change your words. Change your fate.

An original playable Berlin mystery built with Next.js App Router, TypeScript, React, Tailwind, original SVG illustrations, a deterministic narrative engine, Web Audio, and optional OpenAI intent interpretation. This replaces U-Bahn Rush in the same repository and Vercel project.

## Run

Node 24 is pinned in `.node-version` (minimum 22.18):

```sh
npm ci
npm run dev
```

The app runs on port 3000. In this cloud workspace use `npm ci --cache /workspace/.npm-cache --include=dev` because the home directory is read-only. No API key, database or external asset service is required. Audio unlocks after Start/Continue or a sound control. German subtitles are always visible. A1 has slow bundled German speech and English translations; A2 has more varied sentences and English off by default. The DE/EN control and settings can change translations at any point.

The complete story targets 10–15 minutes of reading, experimentation and exploration; an efficient playthrough is shorter. The two-minute demo explicitly starts in night 2 with two existing clues. It uses the real state machine, not prerecorded AI interactions.

## Play

Examine the hallway, meet Lena and Milo, and visit Weber’s office. Time starts at 23:57 and moves **only when you act**. Reading, listening, opening the journal and pausing never consume time. The first night automatically resets after three game minutes of actions. You keep everything in your detective journal. The physical key, doors and conversation memory reset.

At Weber’s office, experiment with “Gib mir den Schlüssel!” Then press **NOCHMAL!** and try a different approach. Politeness starts a discussion; it does not magically grant access. Explain a reason using evidence you actually know. Imperfect German is accepted, for example “Ich brauchen Schlüssel. Wasser im Keller!” There is a typed fallback and clickable sentence starters for every essential exchange. Browser speech recognition is optional; review the transcript before sending. Unsupported or denied microphone access never blocks progress.

Once the basement is open, recover the canvas, investigate the recording and archive door, and decide whether you know enough to close the case. Both endings are reachable. You can replay the entire episode, change level, or rewind the latest conversation before an ending. Continue Saved Game resumes the journal and world; the last conversation checkpoint is deliberately discarded on reload.

On mobile the evidence journal and conversation can collapse. All hotspots have accessible labels and keyboard focus. The clock moves by actions, not wall-clock time. Device reduced-motion preferences suppress rain, flicker, clock rotation and distortion animation. Pausing cancels a pending conversation so it cannot advance the clock in the background.

## The canonical mystery (spoilers)

Eva Weber painted the building’s valuable canvas. At 23:56 a burst pipe threatened it. Weber and resident/restorer Nora moved it downstairs wrapped in a blue blanket. The damp archive door jammed, trapping Nora. Milo recorded the pump and her call for the red emergency-release lever. Lena’s scream was spilled hot coffee. There was no thief. Weber is hiding vulnerability, not a crime.

Seven permanent clues: note, photograph, Lena’s statement, maintenance log, Milo’s recording, the dry canvas, and Nora’s account.

**Access requirements:** after the first midnight, know the maintenance log plus the note or Lena’s statement; communicate an explanation or present real evidence. A hostile demand with no explanation fails. A polite request without explanation asks for a reason. An urgent direct request supported by evidence succeeds. Fake model evidence and perfect phrasing do not bypass these requirements.

**Ending A — The Truth Revealed:** recover the canvas, collect all seven clues, and rescue Nora in the current night. The red archive lever requires both the maintenance log and Milo’s recording. The clock finally reaches 00:01.

**Ending B — The Incomplete Truth:** recover the canvas and close the case before the complete requirements are met. Missing Nora leaves an audible/readable unresolved knock; rescuing her but missing other evidence leaves Eva’s story unexplained. Replay to connect the whole picture.

## State and rewind architecture

`lib/narrative.ts` owns all world transitions. `lib/story.ts` owns canonical facts, clues, objects, authored CEFR variants and character knowledge. `lib/learning.ts` records encountered phrases, intents and vocabulary independently of story rewards. AI never writes inventory or endings.

- **Permanent:** journal knowledge, encountered phrases/intents/vocabulary, night count, rewind count, preferences, and the known fact that time loops.
- **Per night (`World`):** location, action-clock seconds, key, open doors, recovered painting, Nora’s rescue, examined objects, and each character’s conversation history/mood.
- **Conversation checkpoint:** the entire world, active character and dialogue immediately before the last reply. Rewind restores these fields, including clock and key ownership, while retaining permanent knowledge and language observations. A before/after comparison records how the changed wording affects the story.
- **Midnight:** replace the entire world with `freshWorld`, move to the hallway, reset characters/doors/items and discard conversation checkpoints. Keep the journal and language discoveries. Previously learned evidence can be presented immediately in later loops, so no long replay is required. Repeat examinations are faster.
- **Persistence:** versioned local storage under `nochmal-episode-1-v2`. Old U-Bahn saves are not read. Invalid saves are rejected; nested checkpoints are discarded on load. No cloud account or server save is required.

Conversation rewind and midnight reset are separate reducer actions with separate visual/audio feedback. They never copy journal evidence into physical inventory. The two-minute demo seeds only the note and maintenance record and clearly labels its starting timeline.

## Optional live AI

Copy `.env.example` to `.env.local` and securely set `NOCHMAL_OPENAI_API_KEY`. Existing `UBAHN_OPENAI_API_KEY` and conventional `OPENAI_API_KEY` deployments remain supported. `OPENAI_MODEL` defaults to `gpt-4.1-mini`. Restart the server after changing variables. The server needs outbound HTTPS to `api.openai.com`. Never prefix a key with `NEXT_PUBLIC_` or commit `.env.local`.

`/api/chat` validates character, level, text length and evidence IDs. OpenAI returns a strict structured intent, tone, confidence, referenced evidence and clarification flag. `validateInterpretation` treats this as untrusted input, filters references to known evidence and rejects invalid/uncertain results. Authored character responses preserve personality, A1/A2 language and canonical facts. The deterministic reducer alone decides which facts may be revealed and whether access is granted. Model outages, timeout, missing credentials and invalid output use the complete local matcher. The UI visibly labels scripted versus AI interpretation; the demo never pretends to be live AI.

Live OpenAI calls require your key and are not claimed as verified without it. On a public deployment, use your hosting provider’s access/rate limits and OpenAI spending limits for the optional paid endpoint. User speech may be processed by the browser’s recognition provider when the microphone is used; typed input needs no microphone permission.

## Audio and art

All illustrations are original inline SVG (`components/Illustration.tsx`), including the apartment facade, three rooms, characters and portraits. No external image URLs are used. Music, rain, clock ticks, doors, footsteps, clue stings and time effects are original Web Audio synthesis. Speech has smooth background ducking; microphone input suppresses it further. Pausing/muting cancels pending vocals; generation tokens prevent delayed assets from starting during recording or after a reset. The app remains playable if audio fails.

Core dialogue has bundled synthetic German MP3 files. These are clearly labeled prototype synthetic speech, not human voice acting. Other observations use a German browser voice when installed. Regenerate voices after intentional story changes with:

```sh
npm run audio:generate
```

This maintenance command requires FFmpeg and Node >=22.18. Normal installation uses the committed assets and never regenerates them. See `public/audio/README.md` for provenance.

## Validation

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

In this cloud machine use the installed Chromium instead of downloading:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e
```

Unit tests exercise new games, A1/A2 content, navigation/objects, all critical intents, valid/invalid AI evidence, character reactions, conversation restoration, persistent knowledge, temporary item resets, basement access, both endings, saves and actual bundled speech files. Browser tests exercise A1/A2 full mysteries, automatic midnight, complete and incomplete endings, the real rewind comparison, key restoration, restart/continue/pause, typed non-audio play, no-key API fallback, non-silent speech decoding, microphone transcription and gain suppression. Hardware microphone permission and real speech-service accuracy remain browser dependent; automated recognition is simulated.

Stop the dev server before `npm run build`; both commands use `.next`. To test the production build, run `PLAYWRIGHT_USE_PRODUCTION=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e` after building.

## Deployment (same Vercel project)

```sh
npm run build
npm start
```

The existing `vercel.json` explicitly selects Next.js, `npm ci --include=dev`, `npm run build`, and `.next` output. Keep Vercel Root Directory empty (repository root), Node.js 24.x and production branch `main`. Pushes trigger a deployment when the Git integration is connected. Use the latest production domain; old deployment URLs are immutable. No database or additional service is needed. Add the optional key in secure server environment settings and redeploy to enable AI. Existing `UBAHN_OPENAI_API_KEY` settings continue to work.

Render also works as a Node Web Service: build `npm ci --include=dev && npm run build`, start `npm start`, Node 24. Next.js respects Render’s `PORT`. Speech recognition requires HTTPS or localhost. Static export is not supported because optional OpenAI uses a server API route.
