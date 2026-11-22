# Making the "How it works" guide

The app plays two narrated guides from `public/guide/` (Spanish `guia-es.mp4`,
English `guide-en.mp4`, each under 5 MB, plus a first frame `poster-*.webp`).
They are recorded from the real app with a stand-in closet (clothes drawn in
code, never Marce's photos). Re-make them when a screen they show changes.

Files here:
- `script.json`: what the voice says in each scene, in English and Spanish
  (Jose signs off on the wording). `cues` time the illustrated install step.
- `record.cjs`: draws the stand-in closet, loads it into the app, then taps
  through each scene in time with that language's narration and captures the
  phone screen at 2x.
- `install.html`: the illustrated "put Closet on your home screen" step
  (Safari's own menus can't be recorded). It follows iOS 26 Safari.
- `compose.py`: adds the voice, captions and the intro music (soft), then
  writes the small copy into `public/guide/`.
- `serve.mjs`: serves `dist/` at `/Marcela-s-Closet-/` as Pages does.
- `.work/` (not committed): narration, recordings and test profiles.

## Steps

1. Narration, only for lines that changed: ElevenLabs, voice "Jennifer, Warm
   Colombian" (`Y11rBAl8on4Ba9ZpY3DY`), model `eleven_v4`, one take per line,
   saved as `.work/audio/<en|es>-<scene id>.mp3` (for example
   `.work/audio/es-s2-today.mp3`). About 1 credit per character.
2. `npm run build`, then `node tools/guide-video/serve.mjs` (leave it running).
3. `node tools/guide-video/record.cjs es` and `node tools/guide-video/record.cjs en`
   (about two minutes each; needs Playwright's Chromium and ffmpeg).
4. `python3 tools/guide-video/compose.py es` and `... en`: full-size videos in
   `.work/out/`, the app's copies in `public/guide/`.
5. Watch both before committing. Check a few frames at phone size, and that
   each file in `public/guide/` is under 5 MB.
