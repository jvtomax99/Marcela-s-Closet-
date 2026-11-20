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
  - `manifest.webmanifest`, `icon-192.png`, `icon-512.png`,
    `icon-maskable-512.png`, `apple-touch-icon.png`: install info and
    icons, drawn by `assets/icons/make-icons.mjs` (run by hand, not part
    of the build; it also writes `scripts/closet.ico`).
- `src/main.tsx`: starts the app and registers `./sw.js` (only in a built
  version, `import.meta.env.PROD`).
- `src/App.tsx`: switches between the three pages by the address's `#/`
  part.
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
  - `index.ts`: what the rest of the app may use; `engine.test.ts`: 51
    tests.
- `src/db/`: storage.
  - `index.ts`: the Dexie database and every read and write.
  - `backup.ts`: Back up / Restore to a `.json` file.
  - `db.test.ts`, `backup.test.ts`, `upgrade.test.ts` (a version-1
    closet opens intact): 14 tests (with `fake-indexeddb`).
- `src/lib/`: `labels.ts` (all the words shown for options, plus the
  greeting's name and the daily Cali sayings, `DICHOS`), `image.ts`
  (photo shrinking), `photoColor.ts` (reads a photo's main color on the
  phone; `photoColor.test.ts`, 4 tests), `id.ts`, `useRoute.ts` (the `#/` routing).
- `src/components/`: building blocks: `OutfitCollage` (the moodboard),
  `LookCard`, `ItemForm`, `ItemPhoto`, `PieceCard` (a piece in a grid,
  with its one-tap favorite heart; used by the Closet and the Lookbook's
  Pieces tab), `Sheet`, `Navigation`, `Chips`,
  `ColorPicker`, `StarRating`, `PageHeader`, `EmptyState`,
  `BackupControls`, `Icon`, `WornToast` (logs a look as worn, with the
  change-day and undo bar).
- `src/views/`: the three pages: `ClosetView`, `LooksView`,
  `LookbookView`.
- `.github/workflows/`: `check.yml` ("App checks": test, typecheck, build
  on every pull request) and `pages.yml` (the same, then publishes `dist/`
  to GitHub Pages on every push to `main`).
- `scripts/`: Windows only, Marce's PC: `open-closet.ps1` (starts the app
  in its own Edge window), `make-shortcut.ps1`, `closet.ico`.
- Docs: `SPEC.md`, `CLAUDE.md`, `DESIGN.md`, `CREDITS.md`, and in `docs/`
  this file plus Jose's working rules (`design-rules.md`, `assets.md`,
  `cleanup-audit.md`, `refactor.md`).

## How data moves

Nothing leaves the device. There is no account, database server or
analytics.

- **The closet** is the browser's IndexedDB database `closet` (Dexie,
  `version(1)` for pieces and looks, `version(2)` added what she wore),
  three tables:
  - `items` (indexed by `id`, `category`, `createdAt`): one row per piece.
    `id`, `name`, `category`, `colors` (first is the main), `pattern`,
    `fabric`, `formality` 1 to 5, `seasons`, `occasions`, `tags`,
    `favorite`, `photo` (the image file itself, at most 1200 px),
    `createdAt`.
  - `outfits` (indexed by `id`, unique `signature`, `status`,
    `createdAt`): saved and hidden looks. `signature` is the piece ids
    sorted and joined, so one combination is never stored twice.
    `itemIds`, `status` (saved or hidden), `name`, `rating` 0 to 5.
  - `wears` (indexed by `id`, `date`): what she wore. `date` is a
    `YYYY-MM-DD` day on her phone, `itemIds` the pieces. All entries on
    one day add up to that day's outfit (a look logged with "Wore it",
    or pieces logged one by one).
  - Deleting a piece deletes every look that used it and takes it out of
    the days she wore it (a day left empty goes), in one step.
- **Suggestions** are worked out fresh from `items`, `outfits` and
  `wears` each time Looks opens: the engine builds every valid
  combination, scores it (ratings, favorites, hidden looks and what she
  wore recently or not for a month shift scores), and shows the best 12
  at a time, with a small penalty for reusing a piece so the list stays
  varied. The same closet always gives the same looks.
- **Backup file**: `{ app: "closet", version: 1, items, outfits, wears }`
  (`wears` since Phase 2; a file without it restores as before, and an
  older copy of the app ignores it), each
  photo inside as base64 text. Restore merges: a piece or look in both is replaced by the
  backup's copy.
- **Pages**: `#/closet` (the default), `#/looks`, `#/lookbook`. Refresh
  and the back gesture keep the page.
- **Nothing in `localStorage`.**
- **Offline copy** (`public/sw.js`): registered from the app's folder, so
  it only sees that folder. Every request inside it goes to the internet
  first and the answer is saved in the cache `closet-app:<folder path>`
  (`closet-app:/Marcela-s-Closet-/` on Pages); with no internet the saved
  copy answers, and a page load falls back to the saved folder page. It
  never reads or deletes any cache, its own or another app's, on the
  shared `jvtomax99.github.io` address. On the first visit, `main.tsx` fetches the page's
  files again once the worker is in charge, so the copy is complete.
- **Per address**: each address, browser and iPhone home-screen app has
  its own database. On Marce's PC the closet lives in the Edge app window's
  own profile (`%LOCALAPPDATA%\Closet\window`) at `localhost:5173`.
