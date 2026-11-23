import { useSyncExternalStore } from 'react'
import { CROSSFADE, PREPARE_AHEAD, SONGS, SONG_KEY, firstSong, nextSong, songFile } from './playlist'

/**
 * The app's music (Jose, 2026-11-21, playlist 2026-11-23). "Open with sound" plays the intro
 * music once, then four songs take turns (`playlist.ts`), softer once the app shows. After
 * "Open quietly" nothing plays until she taps Play in the masthead's record button.
 * 'off' means nothing has started yet (or the phone can't play it); 'paused' is her pause.
 */
export type MusicState = 'off' | 'on' | 'paused'

/** Volume during the intro, and the softer volume underneath the app. */
export const INTRO_VOLUME = 0.9
export const APP_VOLUME = 0.45

interface Playing {
  source: AudioBufferSourceNode
  gain: GainNode
  buffer: AudioBuffer
  /** Which song, or null for the intro's own piece. */
  song: number | null
}

let sound: { context: AudioContext; master: GainNode } | null = null
let state: MusicState = 'off'
let song: number | null = null
let volume = INTRO_VOLUME
let current: Playing | null = null
// Everything that is playing or lined up to play, so a skip can quiet all of it.
const live = new Set<Playing>()
// Skipping a song bumps this, so a song still downloading for the old order is dropped.
let order = 0
// Where quick taps on Next have aimed, before that song is heard: two taps skip two songs.
let aimed: number | null = null
// Things to do at a moment on the sound clock, which stands still while paused, so nothing
// runs ahead during a pause (a wall-clock timer would keep loading songs and moving titles).
let cues: { at: number; run: () => void }[] = []
/** How long a song may take to download before it is skipped (one bar of signal). */
const FETCH_WAIT_MS = 6000
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())
const setState = (next: MusicState) => {
  state = next
  emit()
}

const canPlayAac = () => document.createElement('audio').canPlayType('audio/mp4; codecs="mp4a.40.2"') !== ''

const savedSong = () => {
  try {
    return localStorage.getItem(SONG_KEY)
  } catch {
    return null
  }
}

const rememberSong = (index: number) => {
  try {
    localStorage.setItem(SONG_KEY, String(index))
  } catch {
    // Private browsing: the next visit just starts on the first song.
  }
}

const rampTo = (level: number, seconds: number) => {
  if (!sound) return
  const { master, context } = sound
  const now = context.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(master.gain.value, now)
  master.gain.linearRampToValueAtTime(level, now + seconds)
}

// A phone pauses the sound when she leaves the app (or for a call); pick it back up when she returns.
const onVisible = () => {
  if (document.visibilityState === 'visible' && sound && state === 'on') void sound.context.resume()
}

const checkCues = () => {
  if (!sound) return
  const now = sound.context.currentTime
  const due = cues.filter((cue) => cue.at <= now)
  if (!due.length) return
  cues = cues.filter((cue) => cue.at > now)
  due.forEach((cue) => cue.run())
}

/** Makes the sound system. Must happen inside her tap, or the phone won't let it play. */
function makeSound() {
  if (sound) return sound
  const Context =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return null
  // On iPhone, play even with the silent switch on: she asked for sound.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) session.type = 'playback'
  const context = new Context()
  void context.resume()
  const master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)
  sound = { context, master }
  document.addEventListener('visibilitychange', onVisible)
  context.onstatechange = onVisible
  window.setInterval(checkCues, 250)
  return sound
}

const decode = async (bytes: ArrayBuffer | null) => {
  if (!bytes || !sound) return null
  return sound.context.decodeAudioData(bytes.slice(0)).catch(() => null)
}

const loadSong = (index: number) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_WAIT_MS)
  return fetch(songFile(index, canPlayAac()), { signal: controller.signal })
    .then((response) => (response.ok ? response.arrayBuffer() : null))
    .catch(() => null)
    .finally(() => clearTimeout(timer))
    .then(decode)
}

/**
 * The next song that can be played, starting at `index`. Offline, a song she hasn't heard yet
 * isn't on the phone: it tries the following ones, and if none loads it plays `fallback` again.
 */
async function loadFrom(index: number, fallback: Playing | null) {
  for (let tries = 0; tries < SONGS.length; tries++) {
    const at = (index + tries) % SONGS.length
    const buffer = await loadSong(at)
    if (buffer) return { buffer, song: at as number | null }
    if (fallback && fallback.song === at) break
  }
  return fallback ? { buffer: fallback.buffer, song: fallback.song } : null
}

/** Runs `run` when the sound clock reaches `at`. */
const onClock = (time: number, run: () => void) => {
  cues.push({ at: time, run })
}

/** Plays a piece at `at` (the sound system's clock), fading out whatever played before it. */
function play(buffer: AudioBuffer, at: number, index: number | null, mine: number) {
  if (!sound || mine !== order) return
  const { context, master } = sound
  const gain = context.createGain()
  gain.connect(master)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(gain)
  const start = Math.max(at, context.currentTime + 0.05)
  source.start(start)
  const playing: Playing = { source, gain, buffer, song: index }
  live.add(playing)
  source.onended = () => {
    live.delete(playing)
    source.disconnect()
    gain.disconnect()
  }

  const before = current
  if (before) {
    before.gain.gain.setValueAtTime(1, start)
    before.gain.gain.linearRampToValueAtTime(0, start + CROSSFADE)
    before.source.stop(start + CROSSFADE + 0.05)
  }
  current = playing

  // The title changes when the song is actually heard.
  onClock(start, () => {
    if (mine !== order) return
    song = index
    if (index === aimed) aimed = null
    if (index !== null) rememberSong(index)
    emit()
  })

  // Get the next one ready a little before the switch, then line it up to the moment.
  const switchAt = start + buffer.duration - CROSSFADE
  const next = index === null ? firstSong(savedSong()) : nextSong(index)
  onClock(switchAt - PREPARE_AHEAD, () => {
    if (mine !== order) return
    void loadFrom(next, playing).then((loaded) => {
      if (loaded) play(loaded.buffer, switchAt, loaded.song, mine)
    })
  })
}

/** Starts the songs from where she left off, now. */
function startSongs(mine: number) {
  void loadFrom(firstSong(savedSong()), null).then((loaded) => {
    if (mine !== order || !sound) return
    if (!loaded) {
      // Nothing could be loaded (offline before any song was kept): back to the Play button.
      if (!current) setState('off')
      return
    }
    play(loaded.buffer, sound.context.currentTime, loaded.song, mine)
  })
}

/** From the intro's "Open with sound": the intro's piece once, then the songs. Inside her tap. */
export function startMusic(data: Promise<ArrayBuffer | null>) {
  if (sound || !makeSound()) return
  volume = INTRO_VOLUME
  rampTo(volume, 0.4)
  setState('on')
  const mine = order
  void data.then(decode).then((buffer) => {
    if (mine !== order || !sound) return
    if (buffer) play(buffer, sound.context.currentTime, null, mine)
    else startSongs(mine)
  })
}

/** From the record button after "Open quietly", or after a pause. Inside her tap. */
export function playMusic() {
  if (state === 'on') return
  if (state === 'paused' && sound) {
    void sound.context.resume()
    rampTo(volume, 0.3)
    setState('on')
    return
  }
  if (!makeSound()) return
  volume = APP_VOLUME
  rampTo(volume, 0.4)
  setState('on')
  startSongs(order)
}

export function pauseMusic() {
  if (state !== 'on' || !sound) return
  void sound.context.suspend()
  setState('paused')
}

/** The intro's round button, and play / pause in the masthead. */
export function toggleMusic() {
  if (state === 'on') pauseMusic()
  else playMusic()
}

/** Skips to the next song at once. */
export function nextMusic() {
  if (!sound || state === 'off') {
    playMusic()
    return
  }
  order += 1
  cues = []
  const mine = order
  const from = current
  // A quick fade for everything playing or lined up, then the next song with nothing to cross.
  const now = sound.context.currentTime
  for (const playing of live) {
    playing.gain.gain.cancelScheduledValues(now)
    playing.gain.gain.setValueAtTime(playing.gain.gain.value, now)
    playing.gain.gain.linearRampToValueAtTime(0, now + 0.4)
    try {
      playing.source.stop(now + 0.45)
    } catch {
      // Already told to stop earlier than that.
    }
  }
  current = null
  if (state === 'paused') {
    void sound.context.resume()
    rampTo(volume, 0.3)
    setState('on')
  }
  const last = aimed ?? song
  const index = last === null ? firstSong(savedSong()) : nextSong(last)
  aimed = index
  void loadFrom(index, from).then((loaded) => {
    if (loaded && sound) play(loaded.buffer, sound.context.currentTime, loaded.song, mine)
  })
}

/** Moves to a new volume (the app's softer level after the intro; silent under the guide). */
export function setMusicVolume(level: number, seconds: number) {
  volume = level
  if (state !== 'on' || !sound) return
  // iPhone can pause the music while a video with sound plays: pick it back up.
  if (level > 0) void sound.context.resume()
  rampTo(level, seconds)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useMusic = () => useSyncExternalStore(subscribe, () => state)
/** The song being heard (an index into `SONGS`), or null before the first one. */
export const useSong = () => useSyncExternalStore(subscribe, () => song)
