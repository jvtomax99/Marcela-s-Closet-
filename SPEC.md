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

Live: https://jvtomax99.github.io/Marcela-s-Closet-/ (GitHub Pages, from
`main`, published by `.github/workflows/pages.yml`).

## Who it's for

- **Marce (Marcela)**, the owner and real user. Bilingual English and
  Spanish; the app is in English for now. She uses it mostly on her iPhone
  and also on her Windows PC. She is not a developer and built the first
  version with an AI assistant on her PC.
- Jose builds and runs it for her from here.
- Jose alone approves plans, the look and the app's wording (Jose,
  2026-11-20).
- Marce no longer changes the app herself on her PC: her ideas come to
  Jose, and only his sessions write to this repo (Jose, 2026-11-20).

## Features (all built and live)

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

### What she wore (Phase 2)
"Wore it" on every look in Looks and the Lookbook logs it for today; a bar
at the bottom lets her change the day (yesterday or earlier) or undo. On a
piece, "Wore it today" logs that one piece, so outfits she put together
herself count too: pieces logged on the same day make that day's outfit.
A piece shows "Worn 4 times, last Nov 12" or "Not worn yet"; a saved look
shows how often she wore it. The Closet gets a "Forgotten" shelf: pieces
not worn in 30 days or more (a piece added less than 30 days ago, or
before she started logging, is counted from then).
Looks use it, by rule (`src/engine/wear.ts`, `score.ts`): a piece worn
today or yesterday costs 20 points, 2 days ago 12, 3 days ago 6, added up
per piece; the same base (top, bottom or dress, shoes) worn in the last 14
days costs 30, whatever bag or accessory goes with it; a forgotten piece
adds 6 points (8 for two or more) and leads the "why" line ("Brings back
your camel coat, not worn in 7 weeks"). Nothing changes until she logs
for the first time, and "build around" never pushes down the piece she
picked. Backups carry what she wore; older backups still restore.
- Done when: on her iPhone, she taps "Wore it" on a look and it drops
  out of the top of Looks; a piece she hasn't worn in a month shows under
  "Forgotten" and comes back in a look with the "Brings back" reason; a
  backup made after logging restores what she wore in another browser;
  her existing closet opens after the update with nothing lost.

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
2. **Asset budget.** $0, free assets only (Jose, 2026-11-20). Background
   removal, when it comes, uses a free library on her device; a paid
   service would also send her photos off the phone.
3. **Windows extras.** `scripts/` (Marce's desktop shortcut) and
   `.claude/launch.json` stay in the repo; the Cloudflare leftovers are
   removed (Jose, 2026-11-20).

## Not in v1

- Background removal on clothing photos (would make the board a true
  flat-lay).
- Spanish version of the app.
- For wear tracking: a calendar page, cost per wear (no prices are
  stored), outfit selfies, planning outfits ahead, a stats dashboard,
  reminders.
- AI styling (an AI describing or ranking looks), and only ever on top of
  the rules.
- Syncing a closet between devices automatically (Back up and Restore do
  it by hand today).

## Later

- Offline on a weak signal: the app waits for the internet before using
  its saved copy, with no time limit, so in a fitting room with one bar it
  can hang. A time limit (Phillis's site uses 4 s) would fix it.
- Background removal, Spanish and AI styling, in an order to decide with
  Jose and Marce.

## Phases

- [x] Phase 0: project docs. CLAUDE.md, SPEC.md, DESIGN.md, the docs
  folder and Jose's shared rules (2026-11-20).
- [x] Phase 1: bring in the app and publish it (2026-11-20).
  - [x] Code in, from the zip (no `node_modules`, `dist`, backups or
    photos); its CLAUDE.md, AGENTS.md and HANDOFF.md folded into these
    docs.
  - [x] Works in GitHub Pages' sub-folder; the offline copy stays in its
    own folder and cache; "App checks" on every pull request; a workflow
    publishes `main`.
  - [x] Pages on (Source: GitHub Actions); published and checked live on
    2026-11-20 (restore, looks and offline all work at the address).
  - [x] Marce backed up on her PC and restored in the iPhone home-screen
    app (Jose confirmed, 2026-11-20).
  - Done when: the check is green, the app is live at its address, and
    Marce's closet opens in the iPhone home-screen app.
- [ ] Phase 2: wear tracking ("What she wore" above).
  - [x] Built and checked on a test closet (63 tests; preview at 390 and
    1440 px, light and dark; backup round trip; version-1 closet opens).
  - [ ] Live, and Marce has used it on her iPhone.
- [ ] Phase next: to decide with Jose.
