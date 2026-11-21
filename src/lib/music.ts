import { useSyncExternalStore } from 'react'

/**
 * The intro's music, kept playing in the app after the intro (Jose, 2026-11-21).
 * It only ever starts from "Open with sound", loops, and plays softer once the app shows.
 * 'off' means it never started (or the phone couldn't play it), so no button shows.
 */
export type MusicState = 'off' | 'on' | 'muted'

/** Volume during the intro, and the softer volume underneath the app. */
export const INTRO_VOLUME = 0.9
export const APP_VOLUME = 0.45

let sound: { context: AudioContext; gain: GainNode } | null = null
let state: MusicState = 'off'
let volume = INTRO_VOLUME
const listeners = new Set<() => void>()

const setState = (next: MusicState) => {
  state = next
  listeners.forEach((listener) => listener())
}

const rampTo = (level: number, seconds: number) => {
  if (!sound) return
  const { gain, context } = sound
  const now = context.currentTime
  gain.gain.cancelScheduledValues(now)
  gain.gain.setValueAtTime(gain.gain.value, now)
  gain.gain.linearRampToValueAtTime(level, now + seconds)
}

// A phone pauses the sound when she leaves the app; pick it back up when she returns.
const onVisible = () => {
  if (document.visibilityState === 'visible' && sound && state !== 'off') void sound.context.resume()
}

/** Starts the looping music. Must be called inside her tap, or the phone won't let it play. */
export function startMusic(data: Promise<ArrayBuffer | null>) {
  if (sound) return
  const Context =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return
  // On iPhone, play even with the silent switch on: she asked for sound.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  if (session) session.type = 'playback'
  const context = new Context()
  void context.resume()
  const gain = context.createGain()
  gain.gain.value = 0
  gain.connect(context.destination)
  sound = { context, gain }
  document.addEventListener('visibilitychange', onVisible)
  void data.then(async (bytes) => {
    if (!bytes || sound?.context !== context) return
    const buffer = await context.decodeAudioData(bytes.slice(0)).catch(() => null)
    if (!buffer || sound?.context !== context) return
    const source = context.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(gain)
    source.start()
    rampTo(volume, 0.4)
    setState('on')
  })
}

/** Moves to a new volume (the app's softer level after the intro), unless she muted it. */
export function setMusicVolume(level: number, seconds: number) {
  volume = level
  if (state === 'on') rampTo(level, seconds)
}

/** Her mute / play button, in the intro and in the masthead. */
export function toggleMusic() {
  if (state === 'off') return
  const muting = state === 'on'
  rampTo(muting ? 0 : volume, 0.15)
  setState(muting ? 'muted' : 'on')
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useMusic = () => useSyncExternalStore(subscribe, () => state)
