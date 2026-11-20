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

/** Landscape screens get the wide pictures, portrait screens the tall ones. */
export function introSize(width: number, height: number): 'phone' | 'desk' {
  return width > height ? 'desk' : 'phone'
}

/** Where each intro file lives, relative so it works in GitHub Pages' sub-folder. */
export function introFiles(size: 'phone' | 'desk') {
  return {
    still: `intro/closed-${size}.webp`,
    clip: `intro/open-${size}.mp4`,
  }
}

/** How long after the tap the clip may take to be ready before the intro skips it. */
export const CLIP_WAIT_MS = 1500
