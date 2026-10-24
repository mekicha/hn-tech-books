These MP3 files are synthetic **spoken German**, not human singing or commercial recordings.

The German text is original U-Bahn Rush dialogue and lyrics. Files were generated locally using eSpeak NG (German voice) and encoded with FFmpeg. The eSpeak NG synthesizer is GPL-3.0-or-later; it is a development tool, not shipped to browsers. Its license is in node_modules/espeak-ng/LICENSE. Generated speech files contain our original text, not third-party musical compositions. The original instrumental score is generated live by lib/audio.ts.

Regenerate all passages with `npm run audio:generate` (Node >=22.18 and FFmpeg required). Pacing: A1 120, A2 145, B1 170 words per minute. Edit lib/songs.ts and lib/game.ts first. Replace these files with original produced vocals later, keeping filenames or updating the audio asset adapter.
