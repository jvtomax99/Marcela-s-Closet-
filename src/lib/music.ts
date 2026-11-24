import { useSyncExternalStore } from 'react'

/**
 * The app's own sound (Jose, 2026-11-21; cut down 2026-11-24): "Open with sound" plays the
 * intro's piece once, with the doors, and then it is quiet. Her songs live in her own Spotify
 * playlist, opened from the masthead's record (`MusicPlayer`, `spotify.ts`).
 * 'off' means nothing is playing (not started, finished, or stopped); 'paused' is her pause.
 */
export type MusicState = 'off' | 'on' | 'paused'

/** Volume during the intro, and the softer volume once the app shows. */
export const INTRO_VOLUME = 0.9
export const APP_VOLUME = 0.45

/** The song order key of the old four-song playlist (2026-11-23), cleared once. */
const OLD_SONG_KEY = 'marcelas-closet:music-song'

let sound: { context: AudioContext; master: GainNode } | null = null
let source: AudioBufferSourceNode | null = null
let state: MusicState = 'off'
let volume = INTRO_VOLUME
const listeners = new Set<() => void>()

/** How long after her tap the intro's piece may take to arrive before the app stays quiet. */
const PIECE_WAIT_MS = 4000

const emit = () => listeners.forEach((listener) => listener())
const setState = (next: MusicState) => {
  state = next
  emit()
}

try {
  localStorage.removeItem(OLD_SONG_KEY)
} catch {
  // Private browsing: nothing was kept anyway.
}

const rampTo = (level: number, seconds: number) => {
  if (!sound) return
  const { master, context } = sound
  const now = context.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(master.gain.value, now)
  master.gain.linearRampToValueAtTime(level, now + seconds)
}

type Session = { type: string }
const audioSession = () => (navigator as Navigator & { audioSession?: Session }).audioSession

/** Back to the phone's usual sound rules once the piece is over, so the video guide is heard. */
const releaseSession = () => {
  const session = audioSession()
  if (session) session.type = 'auto'
}

const finish = () => {
  source = null
  releaseSession()
  setState('off')
}

// A phone pauses the sound when she leaves the app (or for a call); pick it back up when she returns.
const onVisible = () => {
  if (document.visibilityState === 'visible' && sound && state === 'on') void sound.context.resume()
}

/** Makes the sound system. Must happen inside her tap, or the phone won't let it play. */
function makeSound() {
  if (sound) return sound
  const Context =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return null
  // On iPhone, mix with whatever else plays (her Spotify) instead of stopping it. The cost:
  // with the silent switch on, the intro is silent too.
  const session = audioSession()
  if (session) session.type = 'ambient'
  const context = new Context()
  void context.resume()
  const master = context.createGain()
  master.gain.value = 0
  master.connect(context.destination)
  sound = { context, master }
  document.addEventListener('visibilitychange', onVisible)
  context.onstatechange = onVisible
  return sound
}

/** From the intro's "Open with sound": the intro's piece, once. Inside her tap. */
export function startMusic(data: Promise<ArrayBuffer | null>) {
  if (source || !makeSound()) return
  volume = INTRO_VOLUME
  rampTo(volume, 0.4)
  setState('on')
  // Stopped before the piece arrived (she opened Spotify first): nothing more to do.
  const stopped = () => !sound || state === 'off'
  // A first visit on one bar of signal: rather quiet than the piece starting late in the app.
  const late = new Promise<null>((resolve) => setTimeout(() => resolve(null), PIECE_WAIT_MS))
  void Promise.race([data, late]).then(async (bytes) => {
    if (!sound || stopped()) return
    const buffer = bytes ? await sound.context.decodeAudioData(bytes.slice(0)).catch(() => null) : null
    if (!buffer || stopped()) {
      if (!stopped()) finish()
      return
    }
    const piece = sound.context.createBufferSource()
    piece.buffer = buffer
    piece.connect(sound.master)
    piece.onended = () => {
      piece.disconnect()
      if (source === piece) finish()
    }
    source = piece
    piece.start()
  })
}

/** The intro's round button: pause or carry on. */
export function toggleMusic() {
  if (!sound) return
  if (state === 'on') {
    void sound.context.suspend()
    setState('paused')
  } else if (state === 'paused') {
    void sound.context.resume()
    rampTo(volume, 0.3)
    setState('on')
  }
}

/** Stops the intro's piece for good, with a short fade (before she opens Spotify). */
export function stopMusic() {
  if (state === 'off' || !sound) return
  const playing = source
  finish()
  void sound.context.resume()
  rampTo(0, 0.3)
  try {
    playing?.stop(sound.context.currentTime + 0.35)
  } catch {
    // Already ended.
  }
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
