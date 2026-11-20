// Decisions for the intro screen (the wardrobe that opens before the app), kept apart from
// the component so they can be tested without a browser.

/** Plays on every launch. `?intro=0` skips it and `?intro=1` forces it. */
export function shouldShowIntro(search: string): boolean {
  return new URLSearchParams(search).get('intro') !== '0'
}

/**
 * 'clip' plays the doors-opening clip; 'still' only fades the waiting picture into the app.
 * The clip is skipped when the phone asks for less motion or to save data.
 */
export function introMode(options: { reducedMotion: boolean; saveData: boolean }): 'clip' | 'still' {
  return options.reducedMotion || options.saveData ? 'still' : 'clip'
}

/**
 * Portrait screens show the scene full-screen; landscape screens show it as a photo print on
 * the paper board, with the words beside it.
 */
export function introLayout(width: number, height: number): 'full' | 'print' {
  return width > height ? 'print' : 'full'
}

/** Where the intro files live, relative so they work in GitHub Pages' sub-folder. */
export const INTRO_FILES = {
  /** The clip's first frame, so the switch from picture to clip can't be seen. */
  still: 'intro/closed.webp',
  clip: 'intro/open.mp4',
} as const

/** AAC for Safari, Opus elsewhere: the same 12 s piece. */
export function introMusicFile(canPlayAac: boolean) {
  return canPlayAac ? 'intro/music.m4a' : 'intro/music.webm'
}

/** How long after the tap the clip may take to be ready before the intro skips it. */
export const CLIP_WAIT_MS = 1500

/** How long a ready clip may take to start playing (a phone may refuse) before going in. */
export const CLIP_START_MS = 1000

/** Whatever happens, the intro is gone this long after the tap. */
export const INTRO_MAX_MS = 8000
