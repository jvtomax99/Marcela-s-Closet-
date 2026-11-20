# SPEC: Marcela's Closet

Drafted on 2026-11-20 from the app's zip (`Closet App/`: its CLAUDE.md,
AGENTS.md, HANDOFF.md and code). Gaps marked TO FILL for Jose.

## What it does

Closet is a personal styling app that works like "shopping your own
closet". Marce photographs each piece she owns and tags it. The app
combines those pieces into outfits that make sense in color, dressiness,
season and occasion, shows each one as a stylist's moodboard with a short
"why it works" line, and learns from the looks she saves, rates and hides.
It is designed like a fashion magazine: big serif headlines, paper grain,
photos as tilted prints on a board.

It runs in the browser, installs on an iPhone home screen, works offline,
and keeps everything on her device. No accounts, no server.

Live: not published yet. It will be at
https://jvtomax99.github.io/Marcela-s-Closet-/ (GitHub Pages, from `main`).

## Who it's for

- **Marce (Marcela)**, the owner and real user. Bilingual English and
  Spanish; the app is in English for now. She uses it mostly on her iPhone
  and also on her Windows PC. She is not a developer and built the first
  version with an AI assistant on her PC.
- Jose builds and runs it for her from here.
- TO FILL: who approves plans, the look and the app's wording: Jose alone,
  or Marce too?
- TO FILL: will Marce keep changing the app herself on her PC? If yes, two
  people (and two AI tools) write to this repo, and every session must
  fetch before writing, as in Jose's Interp and Vibe-coding-guide repos.

## Features (all built; not published yet)

### Closet (catalog)
Add a piece with a photo and its details: category (top, bottom, dress,
outerwear, shoes, bag, accessory), colors (the first is the main one),
pattern, fabric, dressiness (1 Casual to 5 Formal), seasons, occasions,
tags, favorite. Edit or delete a piece; deleting one warns first and also
deletes the looks that used it. Photos are shrunk to at most 1200 px.
- Done when: on an iPhone, Marce adds a piece with a photo from her camera
  roll, sees it in her closet, edits it, and deletes it after a warning.

### Looks (suggestions)
The app builds outfits from her pieces only: (top and bottom) or a dress,
plus shoes; outerwear (fall or winter only), a bag and up to 2 accessories
are added when they don't lower the score by more than 5 points. Hard
rules: every pair within 1 level of dressiness, at most one bold pattern,
colors that go together (neutrals with anything; others by the color
wheel), and a shared season and occasion. Each look is scored and shown 12
at a time with a "why it works" line. Filters: occasion, season,
dressiness, and "build around this piece". The full scoring table is in
the zip's HANDOFF.md, section 7, and in `src/engine/score.ts`.
- Done when: with at least a top, a bottom and shoes in the closet, Looks
  shows outfits made only of her pieces, each with a reason; a filter
  changes the list; "build around" shows only looks with that piece.

### Lookbook
Save a look, name it and rate it 1 to 5 stars; hide looks she doesn't
like. Saved and rated looks raise similar suggestions, hidden ones lower
them, and a hidden look never comes back unless she restores it here.
- Done when: a look Marce hides disappears from Looks and stays gone after
  a reload; restoring it in the Lookbook brings it back.

### Back up and restore
At the bottom of the Closet page: "Back up closet" saves one `.json` file
with every piece, photo and look; "Restore a backup" reads one back
(pieces in both are replaced by the backup's copy).
- Done when: a backup made on her PC, restored in the iPhone home-screen
  app, shows the same pieces, photos and saved looks.

### Install and offline
Installable from Safari (Share, Add to Home Screen) with the Closet icon;
opens full screen; after one visit with signal it opens with none (say, in
a fitting room).
- Done when: on an iPhone, the home-screen app opens in airplane mode and
  shows her closet and looks.

### Look and feel
Magazine design, dark mode that follows the phone, bottom tab bar on
phones (Closet, Looks, Lookbook), a masthead on laptops, forms in sheets,
calmer motion when the phone asks for reduced motion. Values in
`DESIGN.md`.
- Done when: every screen looks right at 390 px and 1440 px, light and
  dark.

## Open decisions

1. **Hosting: decided, GitHub Pages** (Jose, 2026-11-20), at
   `https://jvtomax99.github.io/Marcela-s-Closet-/`. Same as his other
   sites, and free. Costs Phase 1 has to cover: path changes in five files
   (the app expected the root of an address), a GitHub Action to build and
   publish, and a shared address with his other apps, so clearing that
   site's data in Safari would also wipe her closet (she keeps a recent
   backup). The shared address also means code on any of Jose's other
   Pages apps could read her closet, photos included, when she uses it in
   Safari or on a computer (the iPhone home-screen app keeps its own
   storage). Keep those apps free of outside scripts; Vercel or Cloudflare
   would remove this risk if it ever matters. Wherever it's published, her closet starts empty there: she
   backs up on the PC and restores on the phone. Vercel and Cloudflare
   were the other options; both give the app its own address.
2. **Asset budget.** TO FILL (`docs/assets.md` asks for one up front).
   Background removal for photos may need a paid service or a large
   library.
3. **Windows extras.** Keep `scripts/` (Marce's desktop shortcut) and
   `.claude/launch.json` in the repo, or leave them on her PC only? TO
   FILL.

## Not in v1

- Background removal on clothing photos (would make the board a true
  flat-lay).
- Spanish version of the app.
- Wear tracking: log what she wore, avoid repeats, surface forgotten
  pieces.
- AI styling (an AI describing or ranking looks), and only ever on top of
  the rules.
- Syncing a closet between devices automatically (Back up and Restore do
  it by hand today).
- TO FILL: Jose's own list.

## Later

- Offline on a weak signal: the app waits for the internet before using
  its saved copy, with no time limit, so in a fitting room with one bar it
  can hang. A time limit (Phillis's site uses 4 s) would fix it.
- Remove the Cloudflare leftovers (`wrangler.jsonc`, `npm run deploy`,
  the `wrangler` package) once Jose agrees.

- Background removal, Spanish, wear tracking and AI styling, in an order
  to decide with Jose and Marce.

## Phases

- [x] Phase 0: project docs. CLAUDE.md, SPEC.md, DESIGN.md, the docs
  folder and Jose's shared rules (2026-11-20).
- [ ] Phase 1: bring in the app and publish it.
  - [x] Code in, from the zip (no `node_modules`, `dist`, backups or
    photos); its CLAUDE.md, AGENTS.md and HANDOFF.md folded into these
    docs.
  - [x] Works in GitHub Pages' sub-folder; the offline copy stays in its
    own folder and cache; "App checks" on every pull request; a workflow
    publishes `main`.
  - [ ] Jose turns on Pages (Source: GitHub Actions), the first publish
    runs, and the app opens at its address on his phone.
  - [ ] Marce backs up on her PC and restores in the iPhone home-screen
    app.
  - Done when: the check is green, the app is live at its address, and
    Marce's closet opens in the iPhone home-screen app.
- [ ] Phase next: to decide with Jose.
