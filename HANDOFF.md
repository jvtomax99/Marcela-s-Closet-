# Handoff (2026-11-20)

**Goal:** finish Phase 1 of Marcela's Closet, then pick Phase 2 with Jose.

**Next step:** confirm with Jose whether Marce has moved her closet over
(Back up on her PC, Restore in the iPhone home-screen app). If yes, tick
Phase 1 in `SPEC.md`, then offer `docs/cleanup-audit.md` (no
`docs/CLEANUP.md` yet). Then go through the TO FILL lines in `SPEC.md`
with him: who approves plans and the look, whether Marce still edits the
app on her PC, the asset budget, where the app icons came from, and
whether to keep `scripts/`, `.claude/launch.json` and the Cloudflare
leftovers.

**Done:**
- Project docs (CLAUDE.md, SPEC.md, DESIGN.md, CREDITS.md,
  docs/ARCHITECTURE.md, shared rules, taste skill), merged to `main`.
- Phase 1 pull request #1, merged: app code from Marce's zip, relative
  paths for the Pages sub-folder, offline worker limited to its own folder
  and cache, "App checks" on pull requests, `pages.yml` publishing `main`.
- Live at https://jvtomax99.github.io/Marcela-s-Closet-/, checked with
  Playwright (restore, looks, offline, icons, no errors).

**Not on main yet:** commit 918bcdb (and this file) on
`claude/nice-pascal-cc81xd`: SPEC and CLAUDE.md say "live". Docs only.

**Open:** GitHub's default branch may still be
`claude/nice-pascal-cc81xd`; Jose was asked to switch it to `main`
(Settings, General, Default branch).

**Read first:** `CLAUDE.md`, `SPEC.md` (Open decisions, Later, Phases),
`docs/ARCHITECTURE.md`.
