// The app's music after the intro (Jose, 2026-11-23): four songs that take turns, kept apart
// from the player so the order can be tested without a browser.
import { MUSIC_LABELS } from './labels'

/** File names in `public/music/`, in the same order as the titles in `MUSIC_LABELS.songs`. */
const SONG_FILES = ['salsa-en-juanchito', 'bolero-de-san-antonio', 'marimba-del-pacifico', 'boogaloo-en-la-sexta']

export const SONGS = SONG_FILES.map((file, index) => ({ file, title: MUSIC_LABELS.songs[index] }))

/** Seconds two songs overlap: the old one fades out while the next one starts. */
export const CROSSFADE = 2.5
/** Seconds before that overlap when the next song starts downloading and unpacking. */
export const PREPARE_AHEAD = 8

/** Where she last left the music, so the next visit starts on the song after. */
export const SONG_KEY = 'marcelas-closet:music-song'

/** AAC for Safari, Opus elsewhere, relative so it works in GitHub Pages' sub-folder. */
export function songFile(index: number, canPlayAac: boolean) {
  return `music/${SONGS[index].file}.${canPlayAac ? 'm4a' : 'webm'}`
}

export const nextSong = (index: number) => (index + 1) % SONGS.length

/** The first song of a visit: the one after the last she heard, or the first one. */
export function firstSong(saved: string | null) {
  const last = Number(saved)
  if (saved === null || saved === '' || !Number.isInteger(last) || last < 0 || last >= SONGS.length) return 0
  return nextSong(last)
}
