import { describe, expect, it } from 'vitest'
import { entryScript, isNewVersion } from './update'

const built = (name: string) =>
  `<!doctype html><html><head><link rel="preload" as="image" href="intro/closed.webp" />` +
  `<script type="module" crossorigin src="./assets/${name}"></script>` +
  `<link rel="stylesheet" crossorigin href="./assets/index-abc.css"></head><body></body></html>`

describe('app updates', () => {
  it('reads the main script name from the built page', () => {
    expect(entryScript(built('index-CsWb2a1Q.js'))).toBe('index-CsWb2a1Q.js')
    expect(entryScript('<script crossorigin type="module" src="assets/index-x1.js"></script>')).toBe('index-x1.js')
  })

  it('finds nothing in the development page or a broken answer', () => {
    expect(entryScript('<script type="module" src="/src/main.tsx"></script>')).toBeNull()
    expect(entryScript('Not found')).toBeNull()
  })

  it('only calls it new when both versions are known and differ', () => {
    expect(isNewVersion('index-a.js', 'index-b.js')).toBe(true)
    expect(isNewVersion('index-a.js', 'index-a.js')).toBe(false)
    expect(isNewVersion('index-a.js', null)).toBe(false)
    expect(isNewVersion(null, 'index-b.js')).toBe(false)
  })
})
