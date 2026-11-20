# DESIGN.md: Marcela's Closet

The look of the app, written down from the zip's code on 2026-11-20
(`src/index.css`, the components and the zip's HANDOFF.md, section 9). No
template or reference sites were used. Take values from here or from
`src/index.css`, never from memory, and change this file in the same commit
when a value changes.

## The idea

A fashion magazine lookbook, not a spreadsheet. Clothing photos are the
hero: large, consistently cropped. Outfits are shown as a stylist's
moodboard, photo prints pinned at slight angles on a paper board. Soft
neutrals with one accent, generous whitespace, big serif headlines, smooth
but quick motion, no clutter.

## Colors (`:root` in `src/index.css`)

Dark mode follows the phone's setting (`prefers-color-scheme`).

| Name | Light | Dark | Used for |
|---|---|---|---|
| `--canvas` | `#f6f1e9` | `#161412` | page background |
| `--surface` | `#fffcf7` | `#1f1c19` | sheets, panels, cards |
| `--sand` | `#e8dfd0` | `#2a2622` | quiet fills, chips |
| `--board` | `#ece4d6` | `#24201c` | the moodboard behind a look |
| `--ink` | `#221f1c` | `#f1eadf` | text |
| `--muted` | `#73695e` | `#a69c8e` | secondary text, eyebrows |
| `--line` | `#dcd2c3` | `#36312b` | hairlines, borders |
| `--accent` | `#8c3a2b` (terracotta) | `#d9957c` | the one accent: buttons, focus ring, selection |
| `--on-accent` | `#fdf9f2` | `#1c1815` | text on the accent |
| `--mat` | `#fffdf8` | `#efe7da` | the white border of each photo print |

Tailwind reads them as `bg-canvas`, `text-ink`, `border-line` and so on
(`@theme inline`). The browser bar color (`theme-color` in `index.html`,
and the manifest) is `#f7f3ec` light and `#171513` dark, a shade off
`--canvas`.

## Type

| Name | Faces | Used for |
|---|---|---|
| `--font-serif` | Cormorant Garamond Variable, then Iowan Old Style, Georgia | headlines, the masthead, italics for emphasis |
| `--font-sans` | Inter Variable, then system-ui | everything read or tapped |

Both fonts are bundled from npm (`@fontsource-variable/...`), so nothing
loads from Google.

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
- **Corners:** mostly square, like paper; small `rounded` (4 px) where a
  control needs it. No pill-shaped cards.
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
- Phone: a bottom tab bar (Closet, Looks, Lookbook); forms in sheets that
  slide up from the bottom.
- Laptop (`md`, 768 px and up): a magazine masthead along the top ("The
  ... edit" on the left, the italic serif name in the middle); forms in a
  centered panel.

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
- Motion: words fade and rise in (0.5 s, the app's ease), buttons 0.15 s
  later; everything fades out on tap; the whole screen fades into the app
  in 0.6 s; the music fades out over 1.2 s.
- No new colors, fonts or sizes: all from `src/index.css`.
