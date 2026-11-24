# Architecture

Written from the code on 2026-11-20 (brought in from Marce's zip). Update
it when the structure changes.

A single-page web app: React 19 + TypeScript, built by Vite 8 into static
files in `dist/`. Tailwind 4 for styles, Framer Motion for animation, Dexie
for storage, Vitest for tests. No server code. About 2,900 lines in `src/`.

## Folders and key files

- `index.html`: the page shell and the iPhone home-screen settings
  (`apple-mobile-web-app-*`, `theme-color`, manifest link, icon).
- `vite.config.ts`: build and test settings; `base: './'` makes every
  built path relative, so the app works in Pages' sub-folder. `tsconfig.json`: types.
- `public/`: copied as is into `dist/`.
  - `sw.js`: the offline worker.
  - `guide/`: the "How it works" video guides, `guia-es.mp4` and
    `guide-en.mp4` (each under 5 MB, narrated, captions in the picture) and
    their first frames `poster-es.webp`, `poster-en.webp`. Made with
    `tools/guide-video/`.
  - `intro/`: the intro's waiting picture (`closed.webp`, the clip's
    first frame), the doors-open clip (`open.mp4`, 4 s, H.264, no sound)
    and the music (`music.m4a` for Safari, `music.webm`, 12 s).
  - `manifest.webmanifest`, `icon-192.png`, `icon-512.png`,
    `icon-maskable-512.png`, `apple-touch-icon.png`: install info and
    icons, drawn by `assets/icons/make-icons.mjs` over `assets/icons/cover-photo.jpg`
    (run by hand, not part
    of the build; it also writes `scripts/closet.ico`).
- `src/main.tsx`: starts the app and registers `./sw.js` (only in a built
  version, `import.meta.env.PROD`).
- `src/App.tsx`: switches between the three pages by the address's `#/`
  part, and shows the intro screen on top at every launch.
- `src/index.css`: design tokens (colors, fonts, sizes, grain, shadow).
  See `DESIGN.md`.
- `src/types/index.ts`: every data type and option list (categories,
  colors, patterns, seasons, occasions).
- `src/engine/`: the suggestion engine, plain TypeScript, no React.
  - `color.ts`: the color wheel, neutrals and harmony rules.
  - `rules.ts`: the hard rules and filters.
  - `score.ts`: scoring, learning from ratings and hidden looks and from
    what she wore, the "why it works" line.
  - `wear.ts`: what she wore, by day: last worn per piece, forgotten
    pieces, `toDay` (her phone's local date).
  - `suggest.ts`: building, finishing (outerwear, bag, accessories) and
    picking outfits.
  - `today.ts`: Today's look: the season from the month (northern
    hemisphere) and the 7 best looks for it, taking turns by day.
  - `fit.ts`: what her "On me" photos taught: pieces marked "Not on me",
    bases (top and bottom, or dress) marked "Fits me" or "the combination"
    is off; the newest judged photo decides (`buildFit`, `baseSignature`).
  - `index.ts`: what the rest of the app may use; `engine.test.ts`: 77
    tests.
- `src/db/`: storage.
  - `index.ts`: the Dexie database and every read and write.
  - `backup.ts`: Back up / Restore to a `.json` file.
  - `db.test.ts`, `backup.test.ts`, `upgrade.test.ts` (a version-1
    closet opens intact), `upgrade-v2.test.ts` (a version-2 closet opens
    intact): 17 tests (with `fake-indexeddb`).
- `src/lib/`: `labels.ts` (all the words shown for options, the backup reminder's words (`BACKUP_LABELS`), Today's look's words (`TODAY_LABELS`), the guide's words (`GUIDE_LABELS`), plus the
  greeting's name, the daily Cali sayings, `DICHOS`, the intro's words, and the shared `capitalize` and `joinWithAnd` text helpers, which the engine uses too), `intro.ts` (when and how the
  intro plays; `intro.test.ts`, 4 tests), `music.ts` (the sound itself: the intro piece once, pause, stop, the guide's fade), `spotify.ts` (her Spotify playlist link: reading what she pastes, keeping it; `spotify.test.ts`, 4 tests), `update.ts` (spotting a new
  version; `update.test.ts`, 3 tests), `image.ts`
  (framing and shrinking photos: `cropPlan`, `preparePhoto`; `image.test.ts`, 5 tests), `photoColor.ts` (reads a photo's main color on the
  phone; `photoColor.test.ts`, 4 tests), `id.ts`, `useRoute.ts` (the `#/` routing), `useToday.ts` (today's date, kept current past midnight), `onMe.ts` (matches her "On me" photos to looks by their base), `backupReminder.ts` (when a backup is due and the last-backup date; `backupReminder.test.ts`, 5 tests).
- `src/components/`: building blocks: `OutfitCollage` (the moodboard), `TodaysLook` (the big card at the top of Looks, and `useTodaysPick`, which holds today's pick and "Another"),
  `LookCard`, `OnMeForm` (a photo of her: frame, tag pieces, verdict, or add a missing piece from the photo), `OnYou` (`OnYouButton`, the small "On you" print under a look or on a piece, and `OnMeViewer`, the photo full screen), `ItemForm` (with `PhotoFramer`, the full-screen "Frame it" crop and zoom, react-easy-crop), `ItemPhoto`, `PieceCard` (a piece in a grid,
  with its one-tap favorite heart; used by the Closet and the Lookbook's
  Pieces tab), `Sheet`, `Navigation`, `Chips`,
  `ColorPicker`, `StarRating`, `PageHeader`, `EmptyState`,
  `BackupControls` (also `backUpCloset`, shared with the reminder), `BackupReminder` (the "No backup yet" note at the top of the Closet, and on Looks under Today's look), `Icon` (the sticker icons and five line icons), `WornToast` (logs a look as worn, with the
  change-day and undo bar), `Intro` (the wardrobe intro screen), `MusicButton` (pause / play for the music during the intro), `MusicPlayer` (the record in the masthead with its "Your music" card: paste her Spotify link once, then "Listen on Spotify"), `TrackLabel` (a look's number on a round record label), `GuideButton` (the play button in the masthead, shown twice for phones and laptops, and `GuideSheet`, the one "How it works" sheet with the video and the Español / English switch, rendered once by `Navigation`), `UpdateBar` (checks for a new
  version and reloads, or offers Update while a form is open).
- `src/views/`: the three pages: `ClosetView`, `LooksView`,
  `LookbookView`.
- `.github/workflows/`: `check.yml` ("App checks": test, typecheck, build
  on every pull request) and `pages.yml` (the same, then publishes `dist/`
  to GitHub Pages on every push to `main`).
- `tools/guide-video/`: how the video guides are made (not part of the
  app or the build): the bilingual script, the recorder, the illustrated
  install step, the mixer and a server for `dist/`. See its README. Work
  files go in `tools/guide-video/.work/` (ignored by git).
- `scripts/`: Windows only, Marce's PC: `open-closet.ps1` (starts the app
  in its own Edge window), `make-shortcut.ps1`, `closet.ico`.
- Docs: `SPEC.md`, `CLAUDE.md`, `DESIGN.md`, `CREDITS.md`, and in `docs/`
  this file plus Jose's working rules (`design-rules.md`, `assets.md`,
  `cleanup-audit.md`, `refactor.md`).

## How data moves

Nothing leaves the device. There is no account, database server or
analytics.

- **The closet** is the browser's IndexedDB database `closet` (Dexie,
  `version(1)` for pieces and looks, `version(2)` added what she wore,
  `version(3)` added her "On me" photos), four tables:
  - `items` (indexed by `id`, `category`, `createdAt`): one row per piece.
    `id`, `name`, `category`, `colors` (first is the main), `pattern`,
    `fabric`, `formality` 1 to 5, `seasons`, `occasions`, `tags`,
    `favorite`, `photo` (the image file itself: the part she framed, cut
    from the original, at most 1200 px),
    `createdAt`.
  - `outfits` (indexed by `id`, unique `signature`, `status`,
    `createdAt`): saved and hidden looks. `signature` is the piece ids
    sorted and joined, so one combination is never stored twice.
    `itemIds`, `status` (saved or hidden), `name`, `rating` 0 to 5.
  - `wears` (indexed by `id`, `date`): what she wore. `date` is a
    `YYYY-MM-DD` day on her phone, `itemIds` the pieces. All entries on
    one day add up to that day's outfit (a look logged with "Wore it",
    or pieces logged one by one).
  - `onMe` (indexed by `id`, `createdAt`): photos of her wearing looks.
    `photo` (framed 3:4, at most 1200 px), `itemIds` (the closet pieces
    she has on), `verdict` (`fits`, `off` or null), `offItemIds` and
    `offCombo` (what's off, on "Not on me"). Kept apart from `wears`: a
    photo never counts as worn unless she switched on "I'm wearing it
    today", which adds a normal `wears` entry.
  - Deleting a piece deletes every look that used it and takes it out of
    the days she wore it (a day left empty goes) and out of her photos'
    tags (the photo stays), in one step.
- **Today's look** (`engine/today.ts`, `todaysPick`): the best looks for
  today's season (any season if none fits), scored with what she wore
  before today, so logging today doesn't reshuffle them. The first 7 take
  turns by day (day number mod 7 picks the first), skipping the last
  day's pick, and "Another" (`passOn`) walks down them. Once picked, the
  look stays all day (it is remembered) unless it is hidden or loses a
  piece; it may slip to 40th place and still stay. `src/lib/useToday.ts`
  keeps the date current in an app left open overnight.
  Once anything is logged for today, the card shows those pieces instead.
  The plain list below leaves out today's pick unless a filter is on.
- **Suggestions** are worked out fresh from `items`, `outfits`, `wears`
  and `onMe` each time Looks opens: the engine builds every valid
  combination, scores it (ratings, favorites, hidden looks, what she
  wore recently or not for a month, and her "On me" verdicts shift
  scores), and shows the best 12
  at a time, with a small penalty for reusing a piece so the list stays
  varied. The same closet always gives the same looks.
- **Backup file**: `{ app: "closet", version: 1, items, outfits, wears, onMe }`
  (`wears` since Phase 2, `onMe` since the "On me" photos; a file without
  them restores as before, and an older copy of the app ignores them), each
  photo inside as base64 text. Restore merges: a piece or look in both is replaced by the
  backup's copy.
- **Pages**: `#/looks` (the default, with Today's look on top), `#/closet`, `#/lookbook`. Refresh
  and the back gesture keep the page.
- **Intro**: starts downloading the clip and music when it shows, as
  whole files played from memory (Safari fetches videos in pieces, which
  the offline worker can't keep). A missing or slow clip (1.5 s after the
  tap) means a fade straight into the app. Music plays through Web Audio,
  started inside the tap, from `src/lib/music.ts`, which owns it so it
  finishes in the app at half volume after the intro. `?intro=0` skips
  it.
- **Music** (`src/lib/music.ts`, `spotify.ts`, 2026-11-24): "Open with
  sound" plays the intro piece once, then it is quiet. The sound asks
  iPhone to mix (`navigator.audioSession.type = 'ambient'`), so her
  Spotify keeps playing under it; with the silent switch on, the intro is
  silent. The record's card opens her playlist as a plain
  `https://open.spotify.com/...` link in a new window (Spotify's advice:
  a web link opens the Spotify app without the "Open in Spotify?" prompt
  a `spotify:` link brings), and stops the intro piece first. The guide
  fades the music with `setMusicVolume`. The four songs of 2026-11-23
  are gone; the offline worker deletes any it kept, from its own cache
  only.
- **Updates**: `UpdateBar` fetches the page (`./`, never from a cache)
  when the app opens, when it comes back to the front and every 30
  minutes, and compares its main script name (`assets/index-<hash>.js`)
  with the one running. A new name means a new version: it reloads, unless
  a sheet (`data-sheet`) is open, then it shows an Update bar. It goes for
  each version once per visit (`sessionStorage` key
  `closet-update-tried`), so it can't loop. The offline worker fetches the
  page itself past the browser's 10-minute copy (`cache: 'no-cache'`).
- **`localStorage`**: three small keys, never the closet itself. The whole
  `jvtomax99.github.io` address shares `localStorage`, hence the long
  names.
  - `marcelas-closet:last-backup`: when she last backed up on this device,
    for the reminder (`src/lib/backupReminder.ts`).
  - `marcelas-closet:spotify-link`: her Spotify playlist link, cleaned
    to `https://open.spotify.com/<playlist|album|artist>/<id>` (or a
    `https://spotify.link/<id>` short link)
    (`src/lib/spotify.ts`). Not in backups: on a new device she pastes it
    again. (The old `marcelas-closet:music-song` is removed once.)
  - `marcelas-closet:today`: `{ day, pick, skipped, previous }` for
    Today's look (`src/components/TodaysLook.tsx`): today's pick, the looks
    she passed on today with "Another", and the last day's pick.
- **Offline copy** (`public/sw.js`): registered from the app's folder, so
  it only sees that folder. Every request inside it goes to the internet
  first and the answer is saved in the cache `closet-app:<folder path>`
  (`closet-app:/Marcela-s-Closet-/` on Pages); with no internet, or no
  answer within 4 s (one bar of signal), the saved copy answers (the
  download carries on and updates the copy), and a page load falls back to
  the saved folder page. With no saved copy it keeps waiting. The built
  `assets/` files get a new name per version, so they come straight from
  the copy when it has them, and from the internet only the first time.
  A page is saved only after every `assets/` file it names is saved, so a
  new version that arrives late on a weak signal can't leave a page
  without its scripts (the next open with no signal would be blank). It
  leaves the video guides (`guide/`) to the internet, never saving them.
  It never deletes a whole cache, its own or another app's, on the
  shared `jvtomax99.github.io` address; the one thing it removes is the
  old `music/` songs from its own cache, when a new worker starts
  (2026-11-24). On the first visit, `main.tsx` fetches the page's
  files again once the worker is in charge, so the copy is complete.
- **Per address**: each address, browser and iPhone home-screen app has
  its own database. On Marce's PC the closet lives in the Edge app window's
  own profile (`%LOCALAPPDATA%\Closet\window`) at `localhost:5173`.
