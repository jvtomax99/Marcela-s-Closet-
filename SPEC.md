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

### Easy adding (Phase 3)
Adding a piece is photo, category, done. Taking or picking the photo
reads its main color on the phone (`src/lib/photoColor.ts`: the middle of
the photo, matched to the nearest closet color) and pre-selects it with
"Picked from your photo. Tap another color if it's off." The name fills
itself ("Navy top") unless she types one. Pattern, fabric, dressiness,
seasons, occasions and tags fold under "More details (optional)".
"Add and take another" saves and opens a fresh form for the next photo,
counting how many she added. The photo never leaves her phone; the
category is not guessed (that needs cloud AI or a large model).
- Done when: on her iPhone, she photographs a piece, taps a category and
  saves, with the right main color most of the time, and adds three
  pieces in a row without closing the form.

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

### Today's look (Jose, 2026-11-22)
The app opens on Looks, and the first thing under "Hola, Marce" and the
daily saying is one big outfit for today: the moodboard, the "why it
works" line, the pieces, and "Wore it", "Another" and Save. It stays the
same all day, even when she adds a piece, rates a look or hides another
one; it only moves on if that look is hidden or loses a piece. It changes
the next day, even if she logs nothing: the 7 best looks for today's
season take turns, one a day, and the new day never opens on the last
day's look. An app left open overnight switches at midnight or when she
comes back to it. "Another" walks to the next one (it isn't a dislike;
skips last until midnight, then the round starts again). The season
comes from the month, northern hemisphere (Dec to Feb winter, Mar to May
spring, Jun to Aug summer, Sep to Nov fall); pieces with no season always
qualify, a coat joins in fall and winter by the usual rule, and if no
look fits the season it falls back to any season. It's scored with what
she wore before today, so once she logs anything for today the card
turns into "Wearing today" with those pieces. It stays above the filters
while she browses and hides only in "Build around a piece"; the list
below leaves out today's pick when no filter is on. Built only from her
pieces, like every look. Compared with Cladwell, Whering and Acloset
(plan, 2026-11-22): one pick with a reason, the same all day, no limit on
"Another", no account, no weather.
- Done when: on her iPhone, opening the app lands on Looks and shows one
  Today's look within a second, with a reason; reopening it the same day
  shows the same look; tomorrow shows a different one; "Another" shows a
  new look each tap; "Wore it" turns the card into "Wearing today" and
  still offers Undo; nothing in it is a piece she doesn't own; in December
  a coat appears when she has one, in July none does.
- Weak spot: if she logs nothing and changes nothing, the same 7 looks
  come round every week. Logging "Wore it" is what makes it learn.
- Not in v1: weather or location, a home-screen widget or morning
  notification, planning ahead or packing, weekday vs weekend, pinning a
  piece and shuffling the rest, AI.

### Video guide, "How it works" (Jose, 2026-11-22)
A round play button in the masthead on every page (top left on phones,
opposite the music; beside the music on laptops) opens "How it works": a
narrated video of the whole app, Spanish first, with a switch to English.
About two minutes: the intro, putting Closet on the home screen (the iOS
26 Safari steps, drawn), Today's look, adding a piece, more looks,
Lookbook, Forgotten and backing up. Voice by ElevenLabs (a warm Colombian
voice in both languages), captions in the picture, recorded from the app
with a closet drawn in code, never her photos. The app's music fades while
it plays. It streams: the offline copy skips it, and without signal the
sheet says the guide needs internet while everything else keeps working.
Made with `tools/guide-video/`, which re-makes it after a screen changes.
Compared with Stylebook (demo videos in its help section), Indyx (written
FAQ on its website) and Whering (blog and social posts): inside the app,
in her language and accent, no YouTube or account.
- Done when: on her iPhone home-screen app, the play button shows top left
  on every page; it opens "How it works" and plays the Spanish guide;
  "English" switches; the music fades while it plays and comes back after;
  closing stops the video; in airplane mode the sheet says it needs
  internet and the rest of the app works.
- Not in v1: playing offline, chapters, captions she can turn off,
  playing by itself on first launch, the app's words in Spanish,
  re-recording by itself.

### Your music: her own Spotify playlist (Jose, 2026-11-24)
Marce's feedback after using the app: the four instrumental songs didn't
feel caleñas, and she wants music she picks herself without the app
holding songs with copyright. So the app's only sound is the intro's 12 s
piece, once, after "Open with sound"; then it is quiet. The masthead's
record (it turns only while that piece plays) opens a "Your music" card.
The first time, she pastes her Spotify playlist link (in Spotify: the
playlist, ⋯, Share, Copy link); after that the card has "Listen on
Spotify", which opens her playlist, and "Change playlist". She changes the
songs in Spotify whenever she likes; the app needs no update. The link
stays on her phone (`localStorage`), never in the repo or backups. The
intro asks iPhone to mix its sound with other apps, so it doesn't stop
her Spotify (on silent, the intro is silent). The four songs, the "Now
playing" card and the radio ticker are gone (built 2026-11-23); the
offline copy drops any song it kept.
Compared with Spotify's own guidance: a plain `open.spotify.com` link
(a `spotify:` link makes iPhone ask "Open in Spotify?" first) and its
approved words "Listen on Spotify". An embedded Spotify player was ruled
out: without her Spotify login, as inside the home-screen app, it plays
only previews of 30 s or less. No Spotify logo, by Jose's asset rules.
- Done when: in her iPhone home-screen app, the record opens the card;
  she pastes her playlist link once; "Listen on Spotify" opens her
  playlist; after a relaunch the link is still there; "Open with sound"
  plays the doors' music and then stops; with Spotify playing, opening
  Closet with sound doesn't stop Spotify.
- Only her iPhone can show: whether the link jumps straight into the
  Spotify app or through a Safari page first, and the mixing.
- Not in v1: a player inside Closet, showing what Spotify plays, Apple
  Music or YouTube Music, several playlists, the link in backups (on a
  new device she pastes it again).

### Lookbook
Save a look, name it and rate it 1 to 5 stars; hide looks she doesn't
like. Favorite pieces (Phase 3): a heart on every piece in the Closet
grid, one tap; the Lookbook has two tabs, Looks and Pieces, and tapping
a favorite piece opens Looks built around it. Favorites rank higher in
suggestions. Saved and rated looks raise similar suggestions, hidden ones lower
them, and a hidden look never comes back unless she restores it here.
- Done when: a look Marce hides disappears from Looks and stays gone after
  a reload; restoring it in the Lookbook brings it back.

### Back up and restore
At the bottom of the Closet page: "Back up closet" saves one `.json` file
with every piece, photo and look; "Restore a backup" reads one back
(pieces in both are replaced by the backup's copy).
- Done when: a backup made on her PC, restored in the iPhone home-screen
  app, shows the same pieces, photos and saved looks.

Backup reminder (Jose, 2026-11-22): the Backup section says "Last backup
today", "yesterday" or "on November 2", or "No backup from this device
yet". When a backup is due, a note at the top of the Closet says so, with
"Back up now" (one tap, the same as the button below; since Today's
look, the same note also shows on Looks, under the card); it goes away once
she backs up. Due means: never backed up on this device and the closet
has something in it, or the last backup is 14 days old and a piece, look
or wear was added since. A closet that hasn't changed never nags. Edits to
a piece don't count (pieces don't record when they were edited). The app
counts a backup when the share sheet finishes, or a download on a
computer; it can't tell whether she actually saved the file. If iPhone
refuses the share sheet, it tries a download but doesn't count it, and
says "If no file was saved, tap Back up again." The date lives on the device, in
`localStorage`, and is cleared with the closet.
- Done when: on her iPhone, the note shows until she taps "Back up now"
  and saves the file, then stays away; two weeks and a new piece later it
  comes back.

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
picked. While the "Worn" bar shows, Looks holds still (no card moves
under her finger); it re-sorts when the bar closes. A day picked by
mistake far in the past doesn't make pieces "forgotten": logging counts
from the day she actually logged. Backups carry what she wore; older
backups still restore.
- Done when: on her iPhone, she taps "Wore it" on a look and it drops
  out of the top of Looks; a piece she hasn't worn in a month shows under
  "Forgotten" and comes back in a look with the "Brings back" reason; a
  backup made after logging restores what she wore in another browser;
  her existing closet opens after the update with nothing lost.

### Install and offline
Installable from Safari (Share, Add to Home Screen) with the Closet icon;
opens full screen; after one visit with signal it opens with none (say, in
a fitting room).
On a weak signal (Jose, 2026-11-22): the app waits 4 s for the internet,
then opens from its saved copy; the built files come from the copy at
once. Before, one bar of signal could leave it blank for a minute or more.
- Done when: on an iPhone, the home-screen app opens in airplane mode and
  shows her closet and looks; with one bar of signal it opens within about
  5 seconds.

### Look and feel
Magazine design with a Cali, Colombia and music flavor ("Salsa caleña",
Phase 4): hibiscus pink, mango and palm green on warm cream; "Hola, Marce"
in script with a daily Cali saying; looks numbered as tracks, an "On the
board" pill and a record for the Lookbook. "Record shop" details (Jose
picked B of three mockups, 2026-11-23, because the details looked too
plain): each print held by an enamel pin in the palette, Today's look as
a record sleeve with the record sliding out (it turns while the intro's
music plays),
looks numbered on a round hibiscus record label, glossy hi-fi buttons
(Saved stays pressed in), a dark tab bar with the current page lit in
hibiscus, and the saying behind a
big hibiscus quote mark. Cards have firmer corners, like sleeves. Structure after Jose's
Interpreter Hub: floating capsule tab bar, white lifted cards, two-tone
icons. Dark mode that follows the phone, a masthead on laptops, forms in sheets,
calmer motion when the phone asks for reduced motion. Values in
`DESIGN.md`.
- Done when: every screen looks right at 390 px and 1440 px, light and
  dark.

### Updates itself (Jose, 2026-11-20)
Changes published to the site reach the installed app without
reinstalling it. When the app opens, whenever Marce comes back to it, and
every half hour, it checks quietly for a newer version and reloads into
it. If a form is open it shows "A new version of Closet is ready" with an
Update button instead, so nothing she typed is lost. Offline it does
nothing. The home-screen icon and name are the one thing it can't
change: iPhone keeps them as they were when the app was added.
- Never delete the home-screen app to update it: on iPhone that deletes
  her closet with it.
- Done when: after a change is published, coming back to the home-screen
  app on her iPhone shows the change without reinstalling; with a form
  open it asks first.

### Intro screen (in progress, asked for by Jose 2026-11-20)
Before the app, on every launch: her wardrobe with the doors closed,
"Marce's Closet" in the magazine serif, and two buttons, "Open with
sound" and "Open quietly", plus Skip. A tap opens the doors in a short
clip (4 s: the doors open and Marce steps out, arms open), with original
music if she chose sound, then fades into the app. The music keeps
looping in the app, softer, with a mute button in the masthead (Jose,
2026-11-21); "Open quietly" stays silent. Phones show it
full-screen; wide screens show it as a photo print beside the words. A tap or Escape skips ahead.
It never waits on a slow connection: if the clip isn't ready 1.5 s after
the tap, it goes straight in. Reduced motion or data saver: the still
and a fade, no clip. `?intro=0` skips it. Pictures and clip made with
Runway, music with ElevenLabs (`CREDITS.md`).
- Her likeness: Jose chose to show Marce's real face, and Marce agreed on
  2026-11-20 (through Jose). Three of her photos (a selfie, the green
  dress, a full-length shot) were uploaded to Runway as references; they
  are not in this repo. Runway may train on uploads under standard plans.
  Marce also agreed (2026-11-21, through Jose) to her face on the app
  icon, cropped from the clip's last frame.
- Done when: in the iPhone home-screen app, every launch shows the closed
  wardrobe within a second; "Open with sound" plays the clip with music
  and lands on Looks (Today's look, since 2026-11-22); "Open quietly" does the same silently;
  a tap anywhere while waiting opens with sound; Skip, Escape or a tap
  while it plays goes straight in; if the phone won't play the clip it
  goes in within a second; in airplane mode (after one visit) it still
  plays; with reduced motion only the still and a fade show.
- Not in v1: her voice or narration, Spanish words, seasonal versions, a
  3D model of her, a once-a-day setting, changing layout when the phone
  is turned while the intro shows.

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
  stored), outfit selfies (moved to planned, Jose 2026-11-24), planning outfits ahead, a stats dashboard,
  reminders.
- AI styling (an AI describing or ranking looks), and only ever on top of
  the rules.
- Syncing a closet between devices automatically (Back up and Restore do
  it by hand today).

## Later

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
  - [x] Built and checked on a test closet (65 tests; preview at 390 and
    1440 px, light and dark; backup round trip; version-1 closet opens).
  - [ ] Live, and Marce has used it on her iPhone.
- [ ] Phase 3: easy adding and favorite pieces (Jose, 2026-11-20).
  - [x] Built and checked on stand-in photos (69 tests; preview at 390
    px: color picked from the photo, add three in a row, hearts, Pieces
    tab).
  - [ ] Live, and Marce has added pieces with it on her iPhone.
- [ ] Phase 4: "Salsa caleña" look (Jose picked A of two mockups,
  2026-11-20).
  - [x] Built and checked at 390 px light and dark and 1440 px.
  - [ ] Marce has seen it and likes the sayings (she can change them).
- [ ] Intro screen (Jose, 2026-11-20), next to Phase 1.
  - [x] Music and the empty wardrobe still; the screen, with skip,
    timeout, reduced motion and offline handling.
  - [x] Jose picked still B and music take A; desktop still made.
  - [x] Marce agreed to her likeness (2026-11-20).
  - [x] The scene with her and the doors-open clip (one clip; wide
    screens show it as a print, 2026-11-20).
  - [x] Jose's OK: "Merge for me" (2026-11-20), PR #3.
  - [ ] Marce has opened it on her iPhone.
  - Done when: see "Intro screen" above.
- [ ] Two safety fixes (Jose, 2026-11-22): weak-signal offline and the
  backup reminder.
  - [x] Built and checked: 82 tests; on a test server slowed to 30 s per
    request the app opened in 4.1 s (the old worker: still blank after
    25 s); airplane mode opens at once; a new version that arrived during
    a weak-signal open still opens in airplane mode afterwards (the first
    try at this went blank; a reviewer caught it); reminder screenshots at
    390 px light and dark and 1440 px.
  - [ ] Live, and Marce has backed up from the note on her iPhone.
- [ ] Phase 5: Today's look (Jose approved the plan, 2026-11-22).
  - [x] Built and checked: 96 tests; preview with a stand-in closet at
    390 px light and dark and 1440 px: opens on Looks; same pick after a
    reload; a different one the next day; "Another" changes it and stays
    after a reload; "Wore it" shows "Wearing today" and Undo brings the
    pick back; hiding a look in the list leaves the card alone; left open
    overnight it switches to the new day; the card stays while filtering;
    a coat in January, none in July; the list below doesn't repeat it.
    A reviewer caught that the first version could change the pick during
    the day and repeat yesterday's; fixed with tests.
  - [ ] Live, and Marce has used it on her iPhone for a week.
- [ ] Video guide in the app (Jose approved the plan, 2026-11-22).
  - [x] Built and checked: tests, typecheck and build pass; preview at 390
    px light and dark and 1440 px: the button in the masthead, Spanish
    plays first, English switches, closing stops it, offline message,
    nothing from `guide/` in the offline copy; both files under 5 MB; the
    guides re-made with `tools/guide-video/` from the repo.
  - [ ] Live, and Marce has watched it on her iPhone.
- [ ] Music playlist and "Record shop" details (Jose, 2026-11-23: more
  music in the loop, and details that looked too plain).
  - [x] Jose picked: a short playlist, mockup B of three, all four songs,
    the record shown after "Open quietly", the Spanish titles.
  - [x] Built and checked: 101 tests, typecheck and build pass; in
    Chromium: quiet open shows the record, Play starts Salsa en
    Juanchito, Next moves on, Pause stops it, a new "Open with sound"
    plays the intro piece and then the song after the last one heard; a
    song left alone hands over to the next at about 86 s; no console
    errors; screenshots at 390 px light and dark and 1440 px. A reviewer
    caught that a pause kept loading songs and moving the title on the
    wall clock (up to 200 MB on a long pause), that a song on one bar of
    signal could wait a minute, and that two quick Next taps skipped one
    song; fixed, and checked: 20 s paused loads nothing and keeps the
    title, two taps skip two.
  - [x] Video guides re-made with the new look from the Nov 22 narration
    takes in Jose's ElevenLabs history (no new credits); Spanish 4.64 MB,
    English 4.30 MB (the small copy's compression went from crf 30 to 31
    to stay under 5 MB).
  - [x] The engine's "stays fast" test ran at about 1 s against its 1 s
    limit (on `main` too), so App checks failed once at random; each
    look's signature is now built once before sorting instead of in every
    comparison: same looks, same order, about 0.5 to 0.75 s (Jose,
    2026-11-23).
  - [ ] Heard on her iPhone (only a phone can prove the sound and the
    silent switch).
- [ ] Your music: her own Spotify playlist (Marce's feedback, Jose
  approved the plan 2026-11-24; the four songs, ticker and Now playing
  card removed).
  - [x] Built and checked: tests, typecheck and build pass; in Chromium:
    a wrong link is turned down, a share link is saved clean and kept
    after a reload, "Change playlist" works, the intro piece turns the
    record and then stops, the worker drops old songs from its own copy
    and nothing else, no console errors; screenshots at 390 px light and
    dark and 1440 px. Video guides re-recorded without the ticker, from
    the Nov 22 narration takes (no new credits): Spanish 4.64 MB,
    English 4.33 MB.
  - [ ] On her iPhone: the link opens Spotify, and the intro doesn't
    stop her Spotify.
- [ ] Crop and zoom when adding a piece (Marce's feedback, Jose approved
  the plan 2026-11-24): next, in its own pull request.
- [ ] Photos of her wearing looks, with "fits me / doesn't" (Marce's
  feedback; Jose: now, after crop): a full plan first.
- [ ] Phase next: to decide with Jose.
