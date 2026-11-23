# DESIGN.md: Marcela's Closet

The look of the app, first written down from the zip's code on 2026-11-20,
then restyled the same day as "Salsa caleña" (Jose's pick of two mockups):
fashion lookbook with a Cali, Colombia and music flavor, and structure
borrowed from Jose's Interpreter Hub (its `DESIGN.md`): the script hello,
the floating capsule tab bar, cards with one shared lifted shadow, and
icons with a color fill (now bold stickers). Not borrowed on purpose: the Hub's hospital blues and its
soft-3D clip-art pins, which would cheapen real clothing photos. Take values from here or from
`src/index.css`, never from memory, and change this file in the same commit
when a value changes.

## The idea

A fashion magazine lookbook, not a spreadsheet, made for a woman from Cali
who loves music. Clothing photos are the hero: large, consistently cropped.
Outfits are shown as a stylist's moodboard, photo prints pinned at slight
angles on a paper board, each on a white card. Warm cream with a hibiscus
accent and a soft pink and mango glow, big serif headlines, smooth but
quick motion, no clutter. The Latina flavor lives in color, a script
"Hola, Marce" and real Cali sayings, never in costume props (no papel
picado, maracas or flags). Music lives in a few words and marks: looks are
"tracks", Looks has a "Now playing" pill, the Lookbook is a playlist with a
record for its icon.

## Colors (`:root` in `src/index.css`)

Dark mode follows the phone's setting (`prefers-color-scheme`).

| Name | Light | Dark | Used for |
|---|---|---|---|
| `--canvas` | `#fbf3ea` | `#1a1116` | page background |
| `--surface` | `#ffffff` | `#251a20` | cards, chips, the pill behind the current tab (sheets use `--canvas`) |
| `--sand` | `#f3e4d8` | `#30232a` | quiet fills behind photos |
| `--board` | `#f7e6d8` | `#2a1e24` | the moodboard behind a look |
| `--ink` | `#2b1a22` | `#f6eaf0` | text (a deep plum, never black) |
| `--muted` | `#6e5a63` | `#b8a2ad` | secondary text, eyebrows (5.8:1 on canvas) |
| `--line` | `#eedfd3` | `#3a2b33` | hairlines, chip borders |
| `--accent` | `#c2255c` (hibiscus) | `#f06a98` | the one strong color: the greeting, look numbers, Saved, focus ring, selection (5.2:1 on canvas, 5.7:1 under white) |
| `--on-accent` | `#ffffff` | `#1a1116` | text on the accent |
| `--mango` | `#f4a63a` | `#f6b65a` | icon blobs only (Closet, Wore it) |
| `--palm` | `#1f8a5b` | `#4cc08a` | icon blobs only (Lookbook) |
| `--mat` | `#fffdf8` | `#f3e9ec` | the white border of each photo print |
| `--icon-line` | `#2b1a22` | `#f6eaf0` | the sticker icons' outline |
| `--vinyl` | `#2b1a22` | `#120b0f` | the record icon's body |
| `--accent-soft` | `#fbe3ec` | `#3d1a2a` | behind a chosen chip ("Saved"), hibiscus text on it is 4.7:1 |
| `--glass` | white at 72% | `#251a20` at 72% | the "Now playing" pill, over a blur |
| `--key-face`, `--key-edge` | `#ffffff` to `#f6ece3`, `#e6d5c8` | `#33252c` to `#271b21`, `#46353e` | the hi-fi key (every light pill button) |
| `--key-ink-face`, `--key-ink-edge` | `#3b2630` to `#22141b`, `#1a0f14` | `#fff8fb` to `#eadbe2`, `#f6eaf0` | the dark key (Wore it on Today's look, Back up now, Add a piece, Save on the form) |
| `--deck` | `#34222b` to `#1f1218` | `#2a1a22` to `#120b0f` | the tab bar and the radio ticker, dark in both modes |
| `--on-deck` | `#fbf3ea` | `#fbf3ea` | words and icon outlines on the deck |

Shadows and glow:

- `--card-shadow` (`shadow-card`): a bright inner top edge, then a small
  and a long plum-tinted shadow (black in dark mode). Every card, the tab
  bar and its pill use it, never a custom shadow (the Hub's "finish").
- `--print-shadow` (`shadow-print`): under each photo print, plum-tinted.
- `--key-shadow`: a white top edge and a short plum drop; `--key-pressed`:
  an inner shadow, for a key held down and for Saved, which stays pressed
  in. `--key-ink-shadow` for the dark key.
- `--pin-shadow`: the enamel pin's shine top left, shade bottom right
  and small drop.
- `--mesh`: two soft radial glows on the body, pink top left and mango top
  right (deeper hibiscus in dark mode). The paper grain sits on `html`
  under it; in one shared background the grain's first tile rendered
  darker, a visible square.

Tailwind reads them as `bg-canvas`, `text-ink`, `border-line` and so on
(`@theme inline`). The browser bar color (`theme-color` in `index.html`,
and the manifest) is `#fbf3ea` light and `#1a1116` dark, the same as
`--canvas`.

## Type

| Name | Faces | Used for |
|---|---|---|
| `--font-serif` | Cormorant Garamond Variable, then Iowan Old Style, Georgia | headlines, the masthead, italics for emphasis |
| `--font-sans` | Inter Variable, then system-ui | everything read or tapped |
| `--font-script` | Parisienne, then Snell Roundhand | only "Hola, Marce" at the top of Looks, as in the Hub's hello banner |

All three are bundled from npm (`@fontsource-variable/...`,
`@fontsource/parisienne`), so nothing loads from Google. The serif italic
also carries the day's saying, the "why it works" note and track numbers;
Inter carries buttons (13 px, weight 500) and small caps labels.

| Size | Value | Line height | Letter spacing |
|---|---|---|---|
| `text-display` | `clamp(3.5rem, 13vw, 8rem)` | 0.88 | -0.025em |
| `text-headline` | `clamp(2.5rem, 8vw, 4.75rem)` | 1.05 | -0.02em |
| `text-title` | `clamp(1.75rem, 5vw, 2.25rem)` | 1.1 | |
| `text-eyebrow` | `0.6875rem` (11 px), uppercase | 1 | 0.2em |
| `text-greeting` | `clamp(3.25rem, 11vw, 4rem)` (52 to 64 px), script | 1 | |
| `text-quote` | `1.3125rem` (21 px), serif italic | 1.35 | |
| `text-button` | `0.8125rem` (13 px), Inter 500 | | |

Card corners are the token `--radius-card` (`rounded-card`, 12 px, firmer
since "Record shop", like a record sleeve), the board inside a card
`--radius-board` (`rounded-board`, 6 px). The
greeting and the saying carry `lang="es"`, so a screen reader speaks them
in Spanish; the saying's source line is `--ink` at 80% (it sits on the
pink glow, where `--muted` drops to about 4.4:1).

Big serif numbers ("Nº 07") use old-style figures (`.oldstyle`).

## Texture, shadow, corners

- **Paper grain:** `--grain`, an SVG noise drawn by the browser (no image
  file), on `html` (under the glow) and on panels with the `.grain`
  class.
- **Print shadow:** `--print-shadow` (`shadow-print`), three soft layers,
  deeper in dark mode.
- **Corners:** photo prints stay square, like paper. Cards are 12 px
  round, the board inside a card 6 px (the smaller radius inside). Buttons and chips are pills, at least 44 px tall. The "Worn"
  undo bar is 16 px round.
- **Focus:** a 2 px `--accent` outline, 2 px off the element.

## Record shop details (Jose's pick B of three mockups, 2026-11-23)

Asked for because the details looked too plain. All values above.

- **Pins:** each print on a board is held by an enamel pin at its top
  middle (`.pin`, `--pin-shadow`), taking turns hibiscus, mango and palm;
  about 3% of the board wide (10 to 16 px).
- **Track label:** a look's number sits on a round hibiscus record label
  (`TrackLabel`, 64 px, tilted -6 degrees, a faint inner ring, "Track" in
  8 px small caps over the italic serif number) overlapping the card's
  top left corner, on Looks and in the Lookbook.
- **Today's look** is a sleeve with a record (`.record`: grooves, a sheen,
  a hibiscus label, a cream spindle hole) sliding out: 176 px peeking
  above the card's top right on phones, 352 px out of its right side on
  laptops. It turns (`.spinning`, 6 s a turn) while the music plays. The
  kicker reads "Side A · Today's look · date" where it fits on one line
  (from `sm`).
- **Keys:** every pill button is a hi-fi key (`.key`): a glossy face, a
  bright top edge, a short drop; pressed, it sinks 1 px. Saved stays
  pressed in, in `--accent-soft` with a hibiscus edge. The main action is
  the dark key (`.key-ink`); on Today's look it carries a small mango
  light (`.led`) instead of the hanger. Filter chips stay as they were.
- **Deck:** the phone tab bar is dark in both modes (`.deck`), with cream
  words and icon outlines; the current page is lit by a 24 by 3 px
  hibiscus light with a glow, sliding between tabs (spring 420/36).
- **Radio ticker:** a dark band (`.deck`) across the full width under the
  masthead, 10 px semibold small caps with wide spacing: "Now playing ●
  title ♪ Up next ● title ♪" while the music plays, "Closet radio ●" and
  the four titles while it's quiet. Labels at 60% cream, titles full
  cream, marks in mango. It slides (40 s a loop) only while the music
  plays, and stands still for reduced motion. On phones it replaces the
  month under "Closet".
- **The saying** sits behind a 72 px semibold italic hibiscus quote mark,
  without quotation marks around the text.

## Outfit collage (`src/components/OutfitCollage.tsx`)

- A 4:5 board in `--board` with grain and a soft inner shadow.
- Each piece is a print: `--mat` border (4%), a 3:4 photo, `shadow-print`,
  tilted about 1 to 3 degrees (`--tilt`).
- Clothes run down the left; outerwear, accessories, bag and shoes down
  the right. Sizes adapt to how many pieces there are.
- On hover the prints straighten to about a third of their tilt over
  0.7 s.

## Motion (Framer Motion)

- Entrances: fade and rise, 0.4 to 0.5 s, ease `[0.22, 1, 0.36, 1]`; list
  items stagger 0.035 s each, at most 0.45 s.
- Menu underline and bottom sheets: springs (stiffness 380 to 420, damping
  36 to 38).
- Small fades: 0.22 s ease-out.
- Reduced motion on the device turns animation down automatically.

## Layout

- Page: max width `max-w-6xl`, 16 px side gutter on phones, 32 px from
  `sm`.
- Phone: a floating capsule tab bar 12 px above the bottom edge (after the
  Hub): `--glass` with blur, three tabs 92 px wide, the current one on a
  `--surface` pill that slides between tabs (spring 420/36). Forms in
  sheets that slide up from the bottom. Laptop keeps the magazine
  masthead.
- Icons are bold "stickers" (Jose, 2026-11-21: the thin lines looked too
  minimal): chunky filled shapes in the palette with a 1.5 px
  `--icon-line` outline and a small white shine, still flat so the photos
  stay the star (`src/components/Icon.tsx`). Closet: a mango hanger with a
  hibiscus bow. Looks: two prints, palm and hibiscus. Lookbook: a record
  (`--vinyl`) with a hibiscus label. Heart: white when not chosen,
  hibiscus when saved or a favorite. Plus, close and arrow stay line
  icons, 1.75 px. Tab icons are 28 px, button icons 22 px.
- Looks: "Hola, Marce" in script, the day's Cali saying in serif italic
  with its source in small caps (`DICHOS` in `src/lib/labels.ts`), then
  the filter sentence. Above the looks a `--glass` "Now playing" pill with
  four small hibiscus bars that bob (still for reduced motion) and the
  count of "tracks". Each look is a white card: the board, "Track" in
  small caps over the italic number, the note, the pieces, then pill
  buttons: Save (`--accent-soft` with a hibiscus border and text when saved), Wore it (mango hanger), Not
  for me (plain text).
- Lookbook: the same cards, "Track 01 · Saved November 20" over the
  look's name.
- Piece cards: a heart in a small `--mat` circle with `shadow-print` at
  the photo's top right, outlined in `--ink` at 55%, filled `--accent`
  when it's a favorite. The tap area is 40 px.
- The add form's optional fields sit in a fold ("More details
  (optional)", a plus that turns into an x when open).
- After "Wore it": a small `--ink` bar with `--canvas` text sits just
  above the tab bar (at the bottom on laptops) for 8 seconds: "Worn
  *today*" (the day is a dashed-underlined italic serif word that opens
  the date picker) and "Undo". Same spring as the sheets.
- Laptop (`md`, 768 px and up): a magazine masthead along the top ("The
  ... edit" on the left, the italic serif name in the middle); forms in a
  centered panel.

## Today's look (`src/components/TodaysLook.tsx`)

The first thing on Looks, right under the daily saying and above "A look
for ...". One large white card (`rounded-card`, `bg-surface`,
`shadow-card`): the moodboard on top on phones, on the left on laptops
(two equal columns). Then the kicker as an eyebrow in accent with the
short accent rule ("Today's look · Wednesday, Nov 25", the date never
breaks), the "why" line in the serif at `text-title`, the piece names in
small muted sans, and the buttons: "Wore it" as the dark pill (`bg-ink`,
`text-canvas`, `shadow-print`), "Another" as the outline pill with the
arrow, and Save as on every look card. Once something is logged for
today, the kicker reads "Wearing today" and the piece names take the
serif title size, with no buttons. No new values.

## Backup note (`src/components/BackupReminder.tsx`)

At the top of the Closet, under the header, and on Looks under Today's
look (same width as the card), only when a backup is due: a
white card like the others (`rounded-card`, `bg-surface`, `shadow-card`,
`px-5 py-4`), the first words in the italic serif at `text-lg` in ink,
the rest in small sans, muted, and "Back up now" as the dark pill (`bg-ink`,
`text-canvas`, eyebrow, `shadow-print`), beside the words on laptops and
under them on phones. No new values.

## Guide button and player (`src/components/GuideButton.tsx`)

The same round key as the music (`h-11 w-11`, `.key`) with a line play
icon: top left of the masthead on phones,
mirroring the music button top right; beside it in the laptop masthead.
It opens the usual sheet, "How it works": a two-way switch (Español |
English) in a sand pill with the chosen side as a white chip
(`shadow-card`), then the video, rounded 2xl, `shadow-print`, at most
68% of the screen tall. Offline, the line "The guide needs an internet
connection" in the serif at `text-title`. No new values.

## Update bar (`src/components/UpdateBar.tsx`)

Only while a form is open and a new version is waiting: the same dark
toast as "Worn" (`bg-ink`, `text-canvas`, `shadow-print`, rounded 2xl,
above the tab bar on phones, bottom on laptops, same spring), with the
line in small sans and "Update" as an eyebrow link. No new values.

## Intro screen (`src/components/Intro.tsx`)

- One scene: `public/intro/closed.webp` (the clip's first frame) while
  waiting, then `open.mp4` (4 s, the doors open and Marce steps out).
- Portrait screens: the scene full-screen (`object-cover`). A paper wash
  in `--canvas` over the top fifth and the bottom, fading to clear, so
  the words read in light and dark mode; it fades away on tap.
- Landscape screens: the scene as a photo print on the paper page, like
  the looks: `--mat` border (3.5%), `shadow-print`, tilted -2 degrees,
  straightening to -0.6 on tap; the words and buttons sit to its left.
- Kicker "Marce's" after a short `--accent` rule (and before one too when
  centered), "Closet" in `text-display` italic serif, a muted italic
  serif tagline.
- Buttons: the app's usual dark pill (`bg-ink`, `text-canvas`, eyebrow
  type) for "Open with sound"; an eyebrow text link for "Open quietly";
  Skip as a muted eyebrow link top right; a round mute button while the
  music plays.
- Music after the intro (Jose, 2026-11-21, playlist 2026-11-23): after
  "Open with sound" the songs carry on in the app at half volume. In the
  masthead, top right on phones and after the links on wide screens, a
  44 px round key holds a small record (`MusicPlayer`) that turns while
  the music plays. A tap opens a white card under it (`rounded-card`,
  `shadow-card`, 19 rem wide): a 48 px record, "Now playing · 2 of 4" as
  a hibiscus eyebrow, the title in italic serif at `text-xl`, then pause
  / play (dark key) and next (key) on the right. It shows even after
  "Open quietly". During the intro the round pause button
  (`MusicButton`) stays as it was, now a key.
- Motion: words fade and rise in (0.5 s, the app's ease), buttons 0.15 s
  later; everything fades out on tap; the whole screen fades into the app
  in 0.6 s; the music fades out over 1.2 s.
- No new colors, fonts or sizes: all from `src/index.css`.

## App icons

A magazine cover (Jose's pick "C1b" after several rounds, 2026-11-21),
drawn by `assets/icons/make-icons.mjs`: Marce in front of her wardrobe
(`assets/icons/cover-photo.jpg`, cropped from the last frame of the
intro clip, so it's the AI-made scene she approved, never one of her
photos), a `--canvas` cream fade over the top 40%, a small "CLOSET" in
Inter 600 with wide spacing in `--muted`, and "Marce" in the greeting's
Parisienne in `--accent`, both above her head. The maskable icon draws
the words smaller toward the middle so Android's circle keeps them. At
48 px and under (Windows `.ico`) the words go and only her face shows,
closer. The browser tab icon in `index.html` stays the small "C".
The icon links carry `?v=2` (`index.html`, the manifest): Safari keeps
home-screen icons in its own cache, so a new icon needs a new number.
