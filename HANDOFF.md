# Handoff (2026-11-21)

**Goal:** let Marce use Phases 1 to 4 and the intro screen for about a
week, then pick Phase 5 with Jose from her feedback.

**Next step (around 2026-11-28):** ask Jose how Marce is getting on:
wear tracking ("Wore it", Forgotten shelf), adding pieces (color read from
the photo, auto name), favorites, the Salsa caleña look, the daily Cali
sayings, the music wording and the intro. Fill the unchecked "Marce has
used it" boxes in SPEC.md from his answers, then help pick Phase 5.

**Done:**
- PR #2 (Phases 1 to 4) and PR #3 (intro screen) are merged and live at
  https://jvtomax99.github.io/Marcela-s-Closet-/ (checked at 390 px, no
  errors, offline worker registered).
- The site broke right after the merge: GitHub Pages was set to "Deploy
  from a branch", so it published the raw source over the built app.
  Jose switched Settings, Pages, Source to "GitHub Actions" and it is
  fixed. Written into CLAUDE.md.
- First cleanup audit: `docs/CLEANUP.md` (8 items, nothing changed yet).

**Phase 5 candidates:** weak-signal offline fix (internet-first worker can
hang on one bar of signal), adding many photos at once, background removal
(free options have license catches), or whatever Marce's feedback points
to. Cleanup items from `docs/CLEANUP.md` if Jose wants them.

**Read first:** `CLAUDE.md`, `SPEC.md` (Phases), `docs/CLEANUP.md`.
