import { describe, expect, it } from 'vitest'
import { INTRO_FILES, introLayout, introMode, introMusicFile, shouldShowIntro } from './intro'

describe('intro screen', () => {
  it('shows on every launch unless ?intro=0', () => {
    expect(shouldShowIntro('')).toBe(true)
    expect(shouldShowIntro('?intro=1')).toBe(true)
    expect(shouldShowIntro('?intro=0')).toBe(false)
    expect(shouldShowIntro('?x=1&intro=0')).toBe(false)
  })

  it('skips the clip for reduced motion or data saver', () => {
    expect(introMode({ reducedMotion: false, saveData: false })).toBe('clip')
    expect(introMode({ reducedMotion: true, saveData: false })).toBe('still')
    expect(introMode({ reducedMotion: false, saveData: true })).toBe('still')
  })

  it('shows a photo print on landscape screens', () => {
    expect(introLayout(390, 844)).toBe('full')
    expect(introLayout(1440, 900)).toBe('print')
  })

  it('uses relative paths only', () => {
    for (const path of [...Object.values(INTRO_FILES), introMusicFile(true), introMusicFile(false)])
      expect(path.startsWith('/')).toBe(false)
  })
})
