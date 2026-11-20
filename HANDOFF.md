# Handoff (2026-11-20)

**Goal:** get Phases 1 to 4 live for Marce, see how she uses them, then
pick Phase 5 with Jose.

**Next step:** ask Jose whether he merged PR #2
(https://github.com/jvtomax99/Marcela-s-Closet-/pull/2). If yes, confirm
the live site at https://jvtomax99.github.io/Marcela-s-Closet-/ shows the
Salsa caleña look, and remind him that Marce should back up before using
it (Dexie version 2 adds a table). If no, ask what he wants changed.

**Done (all on branch `claude/nice-pascal-cc81xd`, in PR #2, not on main):**
- Phase 1 closed: open decisions filled (Jose alone signs off, $0 budget,
  Marce doesn't edit the repo), Cloudflare removed, icons drawn in code.
- Phase 2, wear tracking: "Wore it" on looks and pieces, "Forgotten"
  shelf, engine rules in `src/engine/wear.ts` and `score.ts`, Dexie
  `version(2)` with a `wears` table, backups carry wears.
- Phase 3, easy adding: photo color read on the phone
  (`src/lib/photoColor.ts`), auto name, optional fields folded, "Add and
  take another"; favorite hearts on pieces, Lookbook Looks/Pieces tabs.
- Phase 4, "Salsa caleña" look: hibiscus/mango/palm tokens, "Hola, Marce"
  in Parisienne with daily Cali sayings (`DICHOS` in `src/lib/labels.ts`),
  tracks and "Now playing", capsule tab bar and cards after Interpreter Hub.
- Each phase was checked by a reviewer subagent and its findings fixed.
  69 tests, typecheck and build pass.

**Left:**
- Phases 2, 3 and 4: the unchecked "Marce has used it" boxes in SPEC.md.
- Ask whether Marce likes the sayings and the music words.
- Offer `docs/cleanup-audit.md` (no `docs/CLEANUP.md` yet; four phases
  since the start).
- Ideas not started: weak-signal offline fix (SPEC Later), adding many
  photos at once, background removal ($0 options have license catches).
- Interpreter Hub could not be opened in a browser from the cloud session
  (blocked); its look was taken from its DESIGN.md and image files.

**Read first:** `CLAUDE.md`, `SPEC.md` (Phases), `DESIGN.md`,
`docs/ARCHITECTURE.md`.
