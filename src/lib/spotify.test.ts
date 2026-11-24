import { describe, expect, it } from 'vitest'
import { parseSpotifyLink } from './spotify'

const ID = '37i9dQZF1DX10zKzsJ2jva'
const CLEAN = `https://open.spotify.com/playlist/${ID}`

describe('Spotify link', () => {
  it('takes a share link and drops the tracking part', () => {
    expect(parseSpotifyLink(`https://open.spotify.com/playlist/${ID}?si=a1b2c3d4e5`)).toBe(CLEAN)
    expect(parseSpotifyLink(`  ${CLEAN}  `)).toBe(CLEAN)
  })

  it('takes a link with a country part, without https, or inside share text', () => {
    expect(parseSpotifyLink(`https://open.spotify.com/intl-es/playlist/${ID}?si=x`)).toBe(CLEAN)
    expect(parseSpotifyLink(`open.spotify.com/playlist/${ID}`)).toBe(CLEAN)
    expect(parseSpotifyLink(`Salsa para el closet ${CLEAN}?si=zz via Spotify`)).toBe(CLEAN)
  })

  it('takes a spotify: code and albums or artists', () => {
    expect(parseSpotifyLink(`spotify:playlist:${ID}`)).toBe(CLEAN)
    expect(parseSpotifyLink(`https://open.spotify.com/album/${ID}`)).toBe(`https://open.spotify.com/album/${ID}`)
    expect(parseSpotifyLink(`https://open.spotify.com/artist/${ID}`)).toBe(`https://open.spotify.com/artist/${ID}`)
  })

  it('turns down anything that is not a Spotify playlist, album or artist', () => {
    expect(parseSpotifyLink('')).toBeNull()
    expect(parseSpotifyLink('salsa caleña')).toBeNull()
    expect(parseSpotifyLink(`https://open.spotify.com.evil.example/playlist/${ID}`)).toBeNull()
    expect(parseSpotifyLink(`https://evil.example/?u=open.spotify.com/playlist/${ID}`)).toBeNull()
    expect(parseSpotifyLink(`https://open.spotify.com/user/${ID}`)).toBeNull()
    expect(parseSpotifyLink('https://open.spotify.com/playlist/')).toBeNull()
    expect(parseSpotifyLink('javascript:alert(1)//open.spotify.com/playlist/abc')).toBeNull()
  })
})
