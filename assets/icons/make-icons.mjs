// Draws the app icons: an italic serif "C" on a photo print pinned at a
// slight angle on the paper board, the same look as the outfit collage.
// Colors are the light-mode tokens from src/index.css (--board, --mat,
// --sand, --accent). Not part of the build; run by hand after `npm install`
// with the installed Playwright:  node assets/icons/make-icons.mjs
// Writes public/icon-192.png, icon-512.png, icon-maskable-512.png,
// apple-touch-icon.png and scripts/closet.ico.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Playwright is not in package.json: use the copy installed on the machine
const { chromium } = createRequire(import.meta.url)('playwright')
const root = fileURLToPath(new URL('../../', import.meta.url))
const font = readFileSync(
  root + 'node_modules/@fontsource-variable/cormorant-garamond/files/cormorant-garamond-latin-wght-italic.woff2',
).toString('base64')

// card: print width as a share of the icon (maskable keeps inside the safe circle)
function page(size, card) {
  // too small for the print to read: just the letter on the board
  if (card === 0) return `<!doctype html><html><head><style>
  @font-face { font-family: C; src: url(data:font/woff2;base64,${font}); font-style: italic; font-weight: 300 700; }
  html, body { margin: 0; width: ${size}px; height: ${size}px; overflow: hidden; }
  body { background: #ece4d6; display: grid; place-items: center; }
  .c { font: italic 700 ${size * 1.2}px/1 C; color: #8c3a2b; transform: translate(-3%, -2%); }
  </style></head><body><span class="c">C</span></body></html>`
  const w = size * card
  const h = w * 1.25
  return `<!doctype html><html><head><style>
  @font-face { font-family: C; src: url(data:font/woff2;base64,${font}); font-style: italic; font-weight: 300 700; }
  html, body { margin: 0; width: ${size}px; height: ${size}px; overflow: hidden; }
  body { background: #ece4d6; display: grid; place-items: center; }
  .print { width: ${w}px; height: ${h}px; box-sizing: border-box; padding: ${w * 0.07}px;
    background: #fffdf8; transform: rotate(-4deg);
    box-shadow: 0 ${size * 0.004}px ${size * 0.004}px rgb(60 45 30 / 0.08),
      0 ${size * 0.03}px ${size * 0.06}px -${size * 0.012}px rgb(60 45 30 / 0.28); }
  .photo { width: 100%; height: 100%; background: #e8dfd0; display: grid; place-items: center; }
  .c { font: italic 500 ${w * 0.78}px/1 C; color: #8c3a2b; transform: translate(-2%, -3%); }
  </style></head><body><div class="print"><div class="photo"><span class="c">C</span></div></div></body></html>`
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

writeFileSync(root + 'public/icon-512.png', await shot(512, 0.56))
writeFileSync(root + 'public/icon-192.png', await shot(192, 0.56))
writeFileSync(root + 'public/apple-touch-icon.png', await shot(180, 0.56))
writeFileSync(root + 'public/icon-maskable-512.png', await shot(512, 0.46))
const icoSizes = [16, 32, 48, 256]
const icoPngs = []
for (const size of icoSizes) icoPngs.push({ size, buf: await shot(size, size <= 32 ? 0 : 0.6) })
writeFileSync(root + 'scripts/closet.ico', ico(icoPngs))
await browser.close()
console.log('icons written')
