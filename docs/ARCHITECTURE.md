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
- `wrangler.jsonc`: Cloudflare hosting settings from the zip. Not used:
  the host is GitHub Pages (Jose, 2026-11-20); Phase 1 asks before
  removing it.
- `public/`: copied as is into `dist/`.
  - `sw.js`: the offline worker.
  - `manifest.webmanifest`, `icon-192.png`, `icon-512.png`,
    `icon-maskable-512.png`, `apple-touch-icon.png`: install info and
    icons.
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
  - `score.ts`: scoring, learning from ratings and hidden looks, the "why
    it works" line.
  - `suggest.ts`: building, finishing (outerwear, bag, accessories) and
    picking outfits.
  - `index.ts`: what the rest of the app may use; `engine.test.ts`: 38
    tests.
- `src/db/`: storage.
  - `index.ts`: the Dexie database and every read and write.
  - `backup.ts`: Back up / Restore to a `.json` file.
  - `db.test.ts`, `backup.test.ts`: 8 tests (with `fake-indexeddb`).
- `src/lib/`: `labels.ts` (all the words shown for options), `image.ts`
  (photo shrinking), `id.ts`, `useRoute.ts` (the `#/` routing).
- `src/components/`: building blocks: `OutfitCollage` (the moodboard),
  `LookCard`, `ItemForm`, `ItemPhoto`, `Sheet`, `Navigation`, `Chips`,
  `ColorPicker`, `StarRating`, `PageHeader`, `EmptyState`,
  `BackupControls`, `Icon`.
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
  `version(1)`), two tables:
  - `items` (indexed by `id`, `category`, `createdAt`): one row per piece.
    `id`, `name`, `category`, `colors` (first is the main), `pattern`,
    `fabric`, `formality` 1 to 5, `seasons`, `occasions`, `tags`,
    `favorite`, `photo` (the image file itself, at most 1200 px),
    `createdAt`.
  - `outfits` (indexed by `id`, unique `signature`, `status`,
    `createdAt`): saved and hidden looks. `signature` is the piece ids
    sorted and joined, so one combination is never stored twice.
    `itemIds`, `status` (saved or hidden), `name`, `rating` 0 to 5.
  - Deleting a piece deletes every look that used it, in one step.
- **Suggestions** are worked out fresh from `items` and `outfits` each
  time Looks opens: the engine builds every valid combination, scores it
  (ratings, favorites and hidden looks shift scores), and shows the best 12
  at a time, with a small penalty for reusing a piece so the list stays
  varied. The same closet always gives the same looks.
- **Backup file**: `{ app: "closet", version: 1, items, outfits }`, each
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
  never reads or deletes another app's cache on the shared
  `jvtomax99.github.io` address; the one cache it removes is its own old
  name, `closet-app`. On the first visit, `main.tsx` fetches the page's
  files again once the worker is in charge, so the copy is complete.
- **Per address**: each address, browser and iPhone home-screen app has
  its own database. On Marce's PC the closet lives in the Edge app window's
  own profile (`%LOCALAPPDATA%\Closet\window`) at `localhost:5173`.
