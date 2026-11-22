# CLAUDE.md: Marcela's Closet

**Closet**, "Outfits from the clothes you already own." A phone-first
installable web app that suggests outfits using only the pieces in Marce's
own closet, styled like a fashion magazine lookbook. Jose builds and runs it
for Marce (Marcela), who is the real user.

Read first: `SPEC.md` (what, who, phases and what's next; gaps marked TO
FILL for Jose), `docs/ARCHITECTURE.md` (map of files and how data moves),
`DESIGN.md` (look). The rules shared by all of Jose's projects are in
`.claude/rules/general.md`; where this file differs, this file wins.

## Status (2026-11-20)

The app's code is in (from Marce's zip, built on her Windows PC) and set
live on GitHub Pages. Phase 1 is done: Marce moved her closet to the
iPhone home-screen app with Back up and Restore. Next phase: to pick with
Jose (`SPEC.md`, Later).

## Rules for this repo

- **Shop her own closet.** Every look is built only from pieces in her
  catalog. Never invent, suggest buying, or fill a gap with a piece she
  doesn't own.
- **This one has a build step.** Unlike Jose's plain-HTML sites, the app is
  React + TypeScript + Vite with Tailwind 4, Framer Motion, Dexie and
  Vitest. Edit `src/`, never the built `dist/`. The stack was chosen on
  purpose: ask Jose before swapping any part of it.
- **The suggestion engine stays pure.** `src/engine/` is plain TypeScript
  with no React, so it can be tested. Every rule or score change adds or
  updates a test in `src/engine/engine.test.ts`. Rule-based and explainable
  first; an AI styling layer may come later, only on top of the rules,
  never instead of them.
- **Data types live once,** in `src/types/index.ts`.
- **The closet never leaves her device.** Pieces, photos and looks are in
  the browser's own database (IndexedDB, through Dexie, database name
  `closet`). No accounts, no server, no analytics. Any change to what is
  stored must still open her existing closet (a new Dexie `version()` with
  an upgrade, never an edit to version 1) and still restore old backup
  files (`src/db/backup.ts`, backup `version: 1`).
- **Her closet is per address.** Each web address, each browser, and on
  iPhone the home-screen app all keep separate closets. Moving the site to
  a new address, or changing the hosting, gives her an empty app there:
  warn Jose first, and plan the Back up / Restore step with her.
- **Offline worker.** `public/sw.js` keeps a copy of the app (internet
  first, the copy when there's none or after 4 s on a weak signal; the
  versioned `assets/` files straight from the copy) in the cache
  `closet-app:/Marcela-s-Closet-/`. It never holds the closet itself.
- **Video guide.** `public/guide/` holds the narrated "How it works"
  guides (Spanish first, under 5 MB each), played from the play button in
  the masthead. When a screen they show changes, re-make them with
  `tools/guide-video/` (its README). They stream: the offline worker skips
  `guide/`.
- **Updates itself.** `src/components/UpdateBar.tsx` spots a new published
  version and reloads (or asks while a form is open). Never tell anyone to
  delete and re-add the home-screen app to update it: on iPhone that
  deletes her closet.
- **Public repo.** Never commit her clothing photos, a closet backup
  (`closet-backup-*.json`, photos inside; `.gitignore` blocks it) or
  anything personal of hers. One exception: the intro's AI-made scenes
  of her (`public/intro/`), which Marce approved on 2026-11-20, and the
  app icon made from the clip's last frame (`assets/icons/cover-photo.jpg`
  and the icons in `public/`), approved 2026-11-21; the video guides in
  `public/guide/` show only those, plus a closet drawn in code; her
  original photos still never go in. Paid raw files
  (fonts, models) can't be committed either (`docs/assets.md`, section 9).
  The fonts are free and bundled from npm (`@fontsource-variable/...`).
- **Design tokens.** Every color, font, shadow and display size is defined
  once in `src/index.css`. Don't add one without adding it to `DESIGN.md`
  in the same commit.
- **Words in the app** are in English for now; Spanish comes later
  (`src/lib/labels.ts` and the components hold all of it). The greeting
  "Hola, Marce" and the daily Cali sayings (`DICHOS` in `labels.ts`) are
  Spanish on purpose (Jose, 2026-11-20). Don't hard-code
  new text where a later dictionary can't reach it.
- **Windows extras.** `scripts/` (desktop shortcut) and
  `.claude/launch.json` (`npm.cmd`) are for Marce's PC. They don't run in a
  cloud session; leave them alone unless Jose says otherwise.
- **Who signs off.** Jose alone, for plans, the look and the wording.
  Marce doesn't edit the repo herself any more; her ideas come through
  Jose.

## Commands

- `npm install`, then `npm test` (96 tests), `npm run typecheck`,
  `npm run build` (into `dist/`).
- `npm run dev` for working, `npm run preview` (port 4173) to see the built
  app; offline support only runs in `preview`.

## Preview, checks and going live

- **Checks.** `npm test`, `npm run typecheck` and `npm run build` must all
  pass before asking Jose to push. `.github/workflows/check.yml` ("App
  checks") runs them on every pull request.
- **Preview.** Build, serve `dist/` from a parent folder as
  `/Marcela-s-Closet-/` (as Pages does), and send Playwright screenshots at 390 px, then 1440 px, plus a "try this" list. The app
  starts empty: add a top, a bottom and shoes with photos (stand-in
  pictures made for the test, never hers) to see looks. Restoring a made-up backup file through the Restore
  button is the quick way.
- **Hosting: GitHub Pages** (Jose, 2026-11-20), at
  `https://jvtomax99.github.io/Marcela-s-Closet-/` (the path is
  case-sensitive). The app lives in a sub-folder there, so every path is
  relative (`base: './'` in `vite.config.ts`, `index.html`, `src/main.tsx`,
  `public/sw.js`, `public/manifest.webmanifest`): a link starting with `/`
  breaks. Pages can't build the app itself, so
  `.github/workflows/pages.yml` tests, builds and publishes `dist/` on
  every push to `main`. The repo's Settings, Pages, Source must stay on
  "GitHub Actions": on "Deploy from a branch" GitHub also publishes the
  raw source over the built app and her app opens blank (happened
  2026-11-20, fixed 2026-11-21). After every merge, check the live page
  loads `assets/*.js`, not `/src/main.tsx`. Cloudflare and Vercel would each give a different
  address with an empty closet; the Cloudflare setup from the zip was
  removed on purpose.
- **Shared address.** Jose's other Pages sites live on the same
  `jvtomax99.github.io`, so they share storage with her closet. The worker
  only ever opens, matches or deletes its own cache (named with the
  `/Marcela-s-Closet-/` path), never another app's, and its fallback page
  is the app's own folder, not `/`. Never rename the database `closet`.
  Clearing that site's data in Safari would wipe her closet too: remind
  her to keep a recent backup.
- **Going live.** Into `main` by pull request, phone notification that it
  needs Jose's "push", wait for his OK, then one line on how to undo it.

## Tools

- **Taste skill** (`.claude/skills/taste/`): it asks for the Playwright MCP
  server. In a cloud session use the installed Playwright instead and run
  its `references/extract.js` with `page.evaluate`.
- **Refactor.** `docs/refactor.md`, run when Jose asks for "Refactor:
  CLEANUP.md items ...". The list is `docs/CLEANUP.md` (made by the first
  `docs/cleanup-audit.md`).
