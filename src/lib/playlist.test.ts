import { describe, expect, it } from 'vitest'
import { MUSIC_LABELS } from './labels'
import { SONGS, firstSong, nextSong, songFile } from './playlist'

describe('playlist', () => {
  it('has a title for every song file', () => {
    expect(SONGS).toHaveLength(MUSIC_LABELS.songs.length)
    expect(SONGS.every((song) => song.title && song.file)).toBe(true)
  })

  it('picks AAC for Safari and Opus elsewhere, with relative paths', () => {
    expect(songFile(0, true)).toBe('music/salsa-en-juanchito.m4a')
    expect(songFile(3, false)).toBe('music/boogaloo-en-la-sexta.webm')
    expect(songFile(1, true).startsWith('/')).toBe(false)
  })

  it('takes turns and comes back round to the first', () => {
    expect([0, 1, 2, 3].map(nextSong)).toEqual([1, 2, 3, 0])
  })

  it('starts a visit on the song after the last one she heard', () => {
    expect(firstSong(null)).toBe(0)
    expect(firstSong('0')).toBe(1)
    expect(firstSong('3')).toBe(0)
  })

  it('starts on the first song when what was saved makes no sense', () => {
    expect(firstSong('')).toBe(0)
    expect(firstSong('7')).toBe(0)
    expect(firstSong('-1')).toBe(0)
    expect(firstSong('1.5')).toBe(0)
    expect(firstSong('abc')).toBe(0)
  })
})
