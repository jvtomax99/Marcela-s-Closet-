# Cleanup list

Last audit: 2026-11-21, after phase 4 (plus the intro screen, PR #3).

Made by `docs/cleanup-audit.md`. Run with "Refactor: CLEANUP.md items ..."
(`docs/refactor.md`). Report only: nothing here has been changed yet.

Tools: `npx knip`, `npx depcheck`, then each hit checked by hand, plus a
read of `src/` for duplicates, long functions and abandoned files.

## Items

1. **`noTaste()` is never used** (`src/engine/score.ts:70`). Defined and
   exported, called nowhere, not even in tests. Removing it: less engine
   code to read. Risk: low.

2. **Two copies of `capitalize`** (`src/components/ItemForm.tsx:36` and
   `src/engine/score.ts:231`, identical). One shared copy in the engine
   (which has no React, so the form can import it). Removing the copy:
   one place to change. Risk: low.

3. **Two copies of "a, b and c" list joining** (`src/engine/score.ts:87`
   and `src/views/LooksView.tsx:71`). Both glue a list with commas and a
   hard-coded English "and". One helper would fix both, and when Spanish
   comes it becomes "y" in one place instead of two scattered strings.
   Risk: low (the "why this look" wording and the missing-pieces hint both
   need a quick check afterwards).

4. **Exports nobody imports from outside their file**: `hueDistance`
   (`engine/color.ts`), `sharedValues` (`engine/rules.ts`), `isForgotten`
   (`engine/wear.ts`), `DICHOS` (`lib/labels.ts`), `ROUTES`
   (`lib/useRoute.ts`), type `OutfitStatus` (`types/index.ts`). Each is
   used inside its own file, so only the word `export` goes. Improves:
   clearer which parts are the file's real public face. Risk: low. Note:
   `DICHOS` and `OutfitStatus` are named in docs; keep those mentions,
   they still describe where things live.

5. **Unused re-exports**: `CORE_CATEGORIES` from `engine/suggest.ts:14`
   (everyone imports it from `rules.ts`), and `daysBetween` from
   `engine/index.ts:3` (the test imports it from `wear.ts`). Removing
   them: one obvious place to import each from. Risk: low.

6. **`Intro` is one 310-line function** (`src/components/Intro.tsx:30`):
   sound setup, timers, the opening phases and the drawing all together,
   with the same "stop the tap from reaching the background" handler
   written four times (lines ~219, 229, 308, 322). Splitting it into a few
   smaller pieces makes the next change to the intro safer. Risk: medium
   (timing and sound are easy to break; needs a phone check).

7. **Long screens**: `ItemForm` (~230 lines, `components/ItemForm.tsx:79`)
   and `LooksView` (~227 lines, `views/LooksView.tsx:74`). Worth splitting
   only when a phase changes them anyway. Risk: medium.

8. **The dark pill button's style is written out six times** (Intro,
   ItemForm, ClosetView, LookbookView twice, LooksView). One shared
   button component would keep them identical. Risk: low, but it touches
   five screens, so it needs screenshots of each.

## Checked and kept (scanners flag these, but they are used)

- `public/sw.js`: loaded by name at runtime from `src/main.tsx`.
- `assets/icons/make-icons.mjs`: run by hand to redraw the app icons
  (DESIGN.md, CREDITS.md).
- `.claude/skills/taste/references/extract.js`: read by the taste skill.
- `tailwindcss` package: loaded by `src/index.css` and the Vite plugin.
- The two photo-shrinking blocks (`lib/image.ts`, `lib/photoColor.ts`),
  the two download helpers and the three date formatters do different
  jobs; not duplicates.
