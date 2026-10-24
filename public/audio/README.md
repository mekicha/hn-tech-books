# NOCHMAL! synthetic German speech

These are locally generated **spoken German** passages, not recorded human acting or singing. All text is original story content from `lib/story.ts`. Both A1 and A2 include the opening, character greetings, all critical conversation branches, the midnight reset, Milo’s recording, and Nora’s reveal.

Generated using the locked `espeak-ng` development dependency (GPL-3.0-or-later; license in `node_modules/espeak-ng/LICENSE`) and encoded with FFmpeg. The synthesizer is not shipped to browser users; its generated speech renders our original text. Regenerate with `npm run audio:generate` on Node >=22.18 with FFmpeg available. A1 uses 120 words per minute and A2 145. Dynamic observations use installed German browser voices when available. Every essential line is subtitled.

Instrumental ambience, rain, ticks, footsteps, door sounds, clue stings, rewind/reset and ending cues are original Web Audio synthesis in `lib/audio.ts`. No external audio URLs, subscriptions or music services are used. Replace voice files with original recorded performances by keeping filenames, or update the adapter in `AudioDirector.speak`.
