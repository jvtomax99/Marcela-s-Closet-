# Handoff (2026-11-24)

**Goal:** Marce's three requests from her first week (through Jose,
2026-11-24): (1) her own Spotify playlist instead of the app's songs,
(2) crop and zoom when adding a piece, (3) photos of her wearing looks,
tagged with the pieces, with "fits me / doesn't". Jose picked the order
1, 2, 3, and "now" for 3.

**Next step:** once PR #13 is merged, plan (3), worn-look photos, for
Jose's OK. Rules: compare 2 or 3 apps first (notes below), plan mode,
wait for his OK. Ideas to carry into the plan, already agreed in chat:
- The real value is a fit verdict per photo ("me queda bien / no me
  queda") that the engine uses, not just viewing photos. A guess to
  check with Jose: judge fit by the top-and-bottom pair; sometimes it's
  one piece alone.
- Old album photos must not count as "Wore it" (they'd break Forgotten
  and the recently-worn scores): store them apart from `wears`.
- Tag pieces from her closet; a piece she never added she frames out of
  that same photo (Frame it, PR #13).
- New stored data: a Dexie `version(3)` with an upgrade, backups still
  restore version-1 files; about 100 photos add roughly 30 MB to a
  backup. Engine change needs tests in `src/engine/engine.test.ts`.
- Comparison found (official pages, 2026-11-24): Whering lets you add an
  outfit selfie to its planner and tag the pieces, for wear stats
  (whering.co.uk/thoughts/whats-new-on-Whering); Acloset detects pieces in
  a full-length photo with AI (acloset.app/support); Stylebook: nothing
  official found. None rates fit.

**Done (2026-11-24):**
- PR #12, live and checked on the real site: the masthead record opens
  "Your music" (paste her Spotify link once, then Listen on Spotify); the
  four songs, ticker and Now playing card are gone; the intro piece plays
  once and asks iPhone to mix with her Spotify.
- PR #13, waiting for Jose's push: "Frame it", crop and zoom on a 3:4
  frame, cut from the full-size original; Same photo, next piece; Frame
  on a saved piece. Guides re-recorded.
- Narration takes for the guides are in Jose's ElevenLabs flow of
  2026-11-22 (the 19-node one); the API key can't read history, so they
  come from that flow (`tools/guide-video/.work/audio/` is not committed).

**Left to check on her iPhone:** Spotify link opens the app (or through
Safari), the intro doesn't stop her Spotify; pinch and drag in Frame it,
a sharp top from a real full-length photo, portrait photos the right way
up. Also still open from 2026-11-22: whether she uses Wore it, Another,
the backup note, the sayings and the intro (SPEC.md phase boxes).

**Read first:** `CLAUDE.md`, `SPEC.md` (Phases, and "Your music", "Frame
a photo"), `docs/ARCHITECTURE.md`.
