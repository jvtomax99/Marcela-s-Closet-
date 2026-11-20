# DESIGN.md: Marcela's Closet

The look of the app, first written down from the zip's code on 2026-11-20,
then restyled the same day as "Salsa caleña" (Jose's pick of two mockups):
fashion lookbook with a Cali, Colombia and music flavor, and structure
borrowed from Jose's Interpreter Hub (its `DESIGN.md`): the script hello,
the floating capsule tab bar, cards with one shared lifted shadow, and
two-tone icons. Not borrowed on purpose: the Hub's hospital blues and its
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
| `--surface` | `#ffffff` | `#251a20` | cards, sheets, chips, the pill behind the current tab |
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
| `--glass` | white at 72% | `#251a20` at 72% | the floating tab bar and the "Now playing" pill, over a blur |

Shadows and glow:

- `--card-shadow` (`shadow-card`): a bright inner top edge, then a small
  and a long plum-tinted shadow (black in dark mode). Every card, the tab
  bar and its pill use it, never a custom shadow (the Hub's "finish").
- `--print-shadow` (`shadow-print`): under each photo print, plum-tinted.
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
| `--font-script` | Parisienne, then Snell Roundhand | only "Hola, Marce" at the top of Looks (52 px, 64 px from `sm`), as in the Hub's hello banner |

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

Big serif numbers ("Nº 07") use old-style figures (`.oldstyle`).

## Texture, shadow, corners

- **Paper grain:** `--grain`, an SVG noise drawn by the browser (no image
  file), on `body` and on panels with the `.grain` class.
- **Print shadow:** `--print-shadow` (`shadow-print`), three soft layers,
  deeper in dark mode.
- **Corners:** photo prints stay square, like paper. Cards are 22 px
  round, the board inside a card 16 px (the smaller radius inside, as in
  the Hub). Buttons and chips are pills, 44 px tall.
- **Focus:** a 2 px `--accent` outline, 2 px off the element.

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
- Icons are thin line drawings with an optional two-tone blob
  (`Icon` `tone`: `accent` at 30%, `mango` or `palm` at 50%) spilling to
  the lower right, after the Hub's duotone icons. Tabs: Closet a hanger on
  mango, Looks two prints on hibiscus, Lookbook a record on palm.
- Looks: "Hola, Marce" in script, the day's Cali saying in serif italic
  with its source in small caps (`DICHOS` in `src/lib/labels.ts`), then
  the filter sentence. Above the looks a `--glass` "Now playing" pill with
  four small hibiscus bars that bob (still for reduced motion) and the
  count of "tracks". Each look is a white card: the board, "Track" in
  small caps over the italic number, the note, the pieces, then pill
  buttons: Save (filled hibiscus when saved), Wore it (mango hanger), Not
  for me (plain text).
- Lookbook: the same cards, "Track 01 · Saved Nov 20" over the look's
  name.
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

## App icons

Drawn by `assets/icons/make-icons.mjs` with the light-mode tokens (redrawn
in the Salsa caleña colors): an italic Cormorant Garamond "C" in
`--accent` (hibiscus) on a `--sand` photo inside a
`--mat` print, tilted -4 degrees on `--board` with a soft print shadow,
the same idea as the outfit collage. The maskable icon shrinks the print
to stay inside Android's safe circle. At 16 and 32 px (Windows `.ico`)
the print is dropped and only the bold "C" on `--board` remains; the tab
icon in `index.html` is that same small version. Change the colors here
and in the script together, then run it again.
