// Draws the app icons (see page() below). Not part of the build; run by hand after `npm install`
// with the installed Playwright:  node assets/icons/make-icons.mjs
// Writes public/icon-192.png, icon-512.png, icon-maskable-512.png,
// apple-touch-icon.png and scripts/closet.ico.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Playwright is not in package.json: use the copy installed on the machine
const { chromium } = createRequire(import.meta.url)('playwright')
const root = fileURLToPath(new URL('../../', import.meta.url))

const inter = readFileSync(root + 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2').toString('base64')
const script = readFileSync(root + 'node_modules/@fontsource/parisienne/files/parisienne-latin-400-normal.woff2').toString('base64')
// Marce from the intro clip's last frame (AI-made, approved by her for the intro and, on
// 2026-11-21, for the icon; her own photos are never in the repo).
const photo = 'data:image/jpeg;base64,' + readFileSync(root + 'assets/icons/cover-photo.jpg').toString('base64')

// The icon (Jose's pick "C1b", 2026-11-21): a magazine cover. Marce in front of her wardrobe,
// a cream fade at the top, a small "CLOSET" over "Marce" in the greeting's script, both above
// her head. `scale` shrinks the words toward the middle (maskable icons keep inside Android's
// safe circle); 0 means too small for words: just her face, closer.
function page(size, scale) {
  const head = `<!doctype html><html><head><style>
  @font-face { font-family: I; src: url(data:font/woff2;base64,${inter}); font-weight: 100 900; }
  @font-face { font-family: P; src: url(data:font/woff2;base64,${script}); }
  html, body { margin: 0; width: ${size}px; height: ${size}px; overflow: hidden; }
  body { position: relative; background: #fbf3ea url(${photo}) center / cover; }`
  if (scale === 0)
    return `${head} body { background-size: 230%; background-position: 54% 48%; } </style></head><body></body></html>`
  const u = (n) => n * size
  const top = (1 - scale) * 0.5
  return `${head}
  .fade { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(251 243 234 / 0.96) 0,
    rgb(251 243 234 / 0.7) ${(top + 0.22 * scale) * 100}%, rgb(251 243 234 / 0) ${(top + 0.4 * scale) * 100}%); }
  .k { position: absolute; top: ${u(top + 0.045 * scale)}px; left: 0; right: 0; text-align: center;
    font: 600 ${u(0.045 * scale)}px/1 I; letter-spacing: 0.35em; padding-left: 0.35em; color: #6e5a63; }
  .m { position: absolute; top: ${u(top + 0.075 * scale)}px; left: 0; right: 0; text-align: center;
    font: 400 ${u(0.2 * scale)}px/1.1 P; color: #c2255c; }
  </style></head><body><div class="fade"></div><div class="k">CLOSET</div><div class="m">Marce</div></body></html>`
}

// Windows .ico holding PNG images (allowed since Vista)
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length)
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4)
  let offset = head.length
  pngs.forEach(({ size, buf }, i) => {
    const o = 6 + 16 * i
    head.writeUInt8(size >= 256 ? 0 : size, o); head.writeUInt8(size >= 256 ? 0 : size, o + 1)
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6)
    head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12)
    offset += buf.length
  })
  return Buffer.concat([head, ...pngs.map((p) => p.buf)])
}

const browser = await chromium.launch()
async function shot(size, card) {
  const p = await browser.newPage({ viewport: { width: size, height: size } })
  await p.setContent(page(size, card))
  await p.evaluate(() => document.fonts.ready)
  const buf = await p.screenshot({ type: 'png' })
  await p.close()
  return buf
}

writeFileSync(root + 'public/icon-512.png', await shot(512, 1))
writeFileSync(root + 'public/icon-192.png', await shot(192, 1))
writeFileSync(root + 'public/apple-touch-icon.png', await shot(180, 1))
writeFileSync(root + 'public/icon-maskable-512.png', await shot(512, 0.8))
const icoSizes = [16, 32, 48, 256]
const icoPngs = []
for (const size of icoSizes) icoPngs.push({ size, buf: await shot(size, size <= 48 ? 0 : 1) })
writeFileSync(root + 'scripts/closet.ico', ico(icoPngs))
await browser.close()
console.log('icons written')
