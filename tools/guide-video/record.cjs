// Records the Closet app guide for one language, timed to that language's narration.
// Usage: node tools/guide-video/record.cjs <en|es>   (see README.md: build and serve the app first)
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const LANG = process.argv[2]
const HERE = __dirname
const V = path.join(HERE, '.work') // narration in, recordings out; never committed
const DIST = path.resolve(HERE, '../../dist')
const BASE = process.env.GUIDE_BASE || 'http://localhost:4173/Marcela-s-Closet-/'
const SCENES = ['s1-intro', 's1b-install', 's2-today', 's3-add', 's4-looks', 's5-lookbook', 's6-forgotten', 's7-backup', 's8-close']
const PAD = 0.9 // seconds of breathing room after each line

const dur = (id) =>
  Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${V}/audio/${LANG}-${id}.mp3`).toString())
const D = Object.fromEntries(SCENES.map((id) => [id, dur(id) + PAD]))

// ---- Stand-in clothing pictures, drawn here (never her photos) ----
function drawGarment({ kind, color }) {
  const W = 900, H = 1200
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')
  const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#f1ebe3'); bg.addColorStop(1, '#e4dacd')
  x.fillStyle = bg; x.fillRect(0, 0, W, H)
  x.save(); x.shadowColor = 'rgba(40,25,20,.28)'; x.shadowBlur = 40; x.shadowOffsetY = 18
  x.fillStyle = color; x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 4
  const p = new Path2D()
  const cx = W / 2
  if (kind === 'top' || kind === 'knit' || kind === 'blouse') {
    p.moveTo(cx - 90, 300); p.quadraticCurveTo(cx, 360, cx + 90, 300); p.lineTo(cx + 250, 360); p.lineTo(cx + 330, 560)
    p.lineTo(cx + 230, 600); p.lineTo(cx + 200, 520); p.lineTo(cx + 205, 900); p.lineTo(cx - 205, 900); p.lineTo(cx - 200, 520)
    p.lineTo(cx - 230, 600); p.lineTo(cx - 330, 560); p.lineTo(cx - 250, 360); p.closePath()
  } else if (kind === 'coat') {
    p.moveTo(cx - 100, 230); p.lineTo(cx + 100, 230); p.lineTo(cx + 260, 300); p.lineTo(cx + 330, 820); p.lineTo(cx + 250, 840)
    p.lineTo(cx + 215, 480); p.lineTo(cx + 230, 1010); p.lineTo(cx - 230, 1010); p.lineTo(cx - 215, 480); p.lineTo(cx - 250, 840)
    p.lineTo(cx - 330, 820); p.lineTo(cx - 260, 300); p.closePath()
  } else if (kind === 'trousers' || kind === 'jeans') {
    p.moveTo(cx - 190, 220); p.lineTo(cx + 190, 220); p.lineTo(cx + 230, 1020); p.lineTo(cx + 40, 1020); p.lineTo(cx, 470)
    p.lineTo(cx - 40, 1020); p.lineTo(cx - 230, 1020); p.closePath()
  } else if (kind === 'skirt') {
    p.moveTo(cx - 170, 330); p.lineTo(cx + 170, 330); p.lineTo(cx + 290, 880); p.quadraticCurveTo(cx, 920, cx - 290, 880); p.closePath()
  } else if (kind === 'dress') {
    p.moveTo(cx - 70, 190); p.quadraticCurveTo(cx, 240, cx + 70, 190); p.lineTo(cx + 160, 230); p.lineTo(cx + 150, 520)
    p.lineTo(cx + 300, 1040); p.quadraticCurveTo(cx, 1080, cx - 300, 1040); p.lineTo(cx - 150, 520); p.lineTo(cx - 160, 230); p.closePath()
  } else if (kind === 'shoes') {
    for (const dx of [-120, 120]) {
      p.moveTo(cx + dx - 85, 420); p.quadraticCurveTo(cx + dx - 95, 330, cx + dx, 330); p.quadraticCurveTo(cx + dx + 95, 330, cx + dx + 85, 420)
      p.lineTo(cx + dx + 95, 820); p.quadraticCurveTo(cx + dx, 900, cx + dx - 95, 820); p.closePath()
    }
  } else if (kind === 'bag') {
    p.rect(cx - 260, 430, 520, 470)
  }
  x.fill(p); x.restore(); x.stroke(p)
  x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 3
  if (kind === 'knit') for (let y = 560; y < 900; y += 26) { x.beginPath(); x.moveTo(cx - 195, y); x.lineTo(cx + 195, y); x.stroke() }
  if (kind === 'jeans') { x.strokeStyle = 'rgba(240,200,120,.55)'; x.beginPath(); x.moveTo(cx - 190, 290); x.lineTo(cx + 190, 290); x.stroke() }
  if (kind === 'coat') { x.strokeStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.moveTo(cx, 330); x.lineTo(cx, 1005); x.moveTo(cx - 100, 232); x.lineTo(cx, 420); x.lineTo(cx + 100, 232); x.stroke() }
  if (kind === 'bag') { x.strokeStyle = color; x.lineWidth = 26; x.beginPath(); x.arc(cx, 430, 150, Math.PI, 0); x.stroke() }
  if (kind === 'blouse') { x.fillStyle = 'rgba(0,0,0,.08)'; x.beginPath(); x.moveTo(cx - 90, 300); x.lineTo(cx, 420); x.lineTo(cx + 90, 300); x.fill() }
  return c.toDataURL('image/jpeg', 0.86).split(',')[1]
}

const CLOSET = [
  ['t1', 'Ivory blouse', 'top', 'blouse', ['ivory'], '#efe5cf', 3, [], true],
  ['t2', 'Navy tee', 'top', 'top', ['navy'], '#283454', 2, []],
  ['t3', 'Blush knit', 'top', 'knit', ['blush'], '#e6b1ac', 3, ['fall', 'winter']],
  ['t4', 'Black tee', 'top', 'top', ['black'], '#1f1f1f', 2, []],
  ['b1', 'Camel trousers', 'bottom', 'trousers', ['camel'], '#b8875a', 3, []],
  ['b2', 'Dark jeans', 'bottom', 'jeans', ['denim'], '#2f4766', 2, []],
  ['b3', 'Black skirt', 'bottom', 'skirt', ['black'], '#232323', 3, []],
  ['d1', 'Green wrap dress', 'dress', 'dress', ['green'], '#2f7d55', 3, ['spring', 'summer']],
  ['d2', 'Burgundy dress', 'dress', 'dress', ['burgundy'], '#7a2234', 4, ['fall', 'winter'], true],
  ['s1', 'White sneakers', 'shoes', 'shoes', ['white'], '#f4f3f0', 2, []],
  ['s2', 'Camel boots', 'shoes', 'shoes', ['camel'], '#9c6b3f', 3, []],
  ['s3', 'Black heels', 'shoes', 'shoes', ['black'], '#1a1a1a', 4, []],
  ['o1', 'Camel coat', 'outerwear', 'coat', ['camel'], '#a8794a', 3, ['fall', 'winter']],
  ['g1', 'Black tote', 'bag', 'bag', ['black'], '#151515', 3, []],
]

const RIPPLE = `
  addEventListener('pointerdown', (e) => {
    const d = document.createElement('div')
    d.style.cssText = 'position:fixed;left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;width:44px;height:44px;border-radius:50%;background:rgba(194,37,92,.35);border:2px solid rgba(194,37,92,.8);pointer-events:none;z-index:2147483647;transition:transform .55s ease-out, opacity .55s ease-out'
    document.documentElement.appendChild(d)
    requestAnimationFrame(() => { d.style.transform = 'scale(1.9)'; d.style.opacity = '0' })
    setTimeout(() => d.remove(), 700)
  }, true)`

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)))

;(async () => {
  fs.mkdirSync(V, { recursive: true })
  const profile = path.join(V, `profile-${LANG}`)
  fs.rmSync(profile, { recursive: true, force: true })
  const vids = path.join(V, `raw-${LANG}`); fs.rmSync(vids, { recursive: true, force: true })

  // ---- Setup, not recorded: draw pieces, restore the stand-in closet ----
  const day = (offset) => { const d = new Date(Date.now() - offset * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  let ctx = await chromium.launchPersistentContext(profile, { viewport: { width: 390, height: 844 } })
  let page = ctx.pages()[0] ?? (await ctx.newPage())
  await page.goto(BASE + '?intro=0#/closet')
  const now = Date.now()
  const items = []
  for (const [id, name, category, kind, colors, hex, formality, seasons, favorite] of CLOSET) {
    items.push({ id, name, category, colors, pattern: 'solid', fabric: null, formality, seasons, occasions: [], tags: [], favorite: !!favorite,
      createdAt: now - 60 * 864e5, photo: { type: 'image/jpeg', base64: await page.evaluate(drawGarment, { kind, color: hex }) } })
  }
  const look = (id, ids, name, rating) => ({ id, signature: [...ids].sort().join('+'), itemIds: ids, status: 'saved', name, rating, createdAt: now - 20 * 864e5 })
  const backup = { app: 'closet', version: 1, exportedAt: now, items,
    outfits: [look('l1', ['t1', 'b1', 's2'], 'Look Nº 1', 5), look('l2', ['d2', 's3', 'g1'], 'Look Nº 2', 0)],
    wears: [
      { id: 'w1', date: day(45), itemIds: ['t4', 'b2', 's1'], createdAt: now - 45 * 864e5 },
      { id: 'w2', date: day(12), itemIds: ['t2', 'b2', 's1'], createdAt: now - 12 * 864e5 },
      { id: 'w3', date: day(4), itemIds: ['t1', 'b1', 's2'], createdAt: now - 4 * 864e5 },
    ] }
  fs.writeFileSync(path.join(V, 'standin-backup.json'), JSON.stringify(backup))
  // A new piece to add on camera: a mango top.
  fs.writeFileSync(path.join(V, 'mango-top.jpg'), Buffer.from(await page.evaluate(drawGarment, { kind: 'top', color: '#f2a93b' }), 'base64'))
  await page.locator('input[type=file][accept*="json"]').setInputFiles(path.join(V, 'standin-backup.json'))
  await page.getByText(/Restored 14 pieces/).waitFor()
  await page.evaluate(() => localStorage.setItem('marcelas-closet:last-backup', String(Date.now())))
  await page.waitForTimeout(1500) // let the offline helper settle
  await ctx.close()

  // ---- Recording ----
  ctx = await chromium.launchPersistentContext(profile, {
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true,
  })
  await ctx.addInitScript(RIPPLE)
  page = ctx.pages()[0] ?? (await ctx.newPage())
  // Frames straight from the browser at iPhone sharpness (2x), each with its time.
  fs.mkdirSync(vids, { recursive: true })
  const frames = []
  const cdp = await ctx.newCDPSession(page)
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = path.join(vids, `f${String(frames.length).padStart(5, '0')}.jpg`)
    fs.writeFileSync(file, Buffer.from(data, 'base64'))
    frames.push({ t: metadata.timestamp, file })
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 })
  const t0 = Date.now()
  const marks = {}
  let sceneStart = 0
  const start = (id) => { sceneStart = Date.now(); marks[id] = (sceneStart - t0) / 1000 }
  const at = (fraction, id) => sleep(sceneStart + fraction * D[id] * 1000 - Date.now())
  const finish = (id) => sleep(sceneStart + D[id] * 1000 - Date.now())
  const scrollTo = (locator, block = 'center') => locator.evaluate((el, block) => el.scrollIntoView({ behavior: 'smooth', block }), block)
  const nav = (name) => page.locator('nav[aria-label="Main"]').last().getByRole('link', { name }).click()
  const card = page.locator('section[aria-label="Today\'s look"]')

  // 1. Intro: the wardrobe, "Open quietly", the doors open, Looks.
  await page.goto(BASE)
  const quietly = page.getByRole('button', { name: /Open quietly/ })
  await quietly.waitFor()
  await sleep(600)
  start('s1-intro')
  await at(0.22, 's1-intro'); await quietly.click()
  await card.waitFor({ timeout: 15000 })
  await finish('s1-intro')

  // 1b. Putting Closet on the home screen: an illustrated step (Safari's menus can't be recorded here).
  const install = JSON.parse(fs.readFileSync(path.join(HERE, 'script.json'), 'utf8')).find((s) => s.id === 's1b-install')
  const text = install[LANG]
  const spoken = dur('s1b-install')
  // The illustrated step is served next to the built app (a scratch copy; the next build drops it).
  fs.copyFileSync(path.join(HERE, 'install.html'), path.join(DIST, 'guide-install.html'))
  await page.goto(BASE + `guide-install.html?lang=${LANG}`)
  await page.waitForTimeout(300)
  start('s1b-install')
  for (const [i, cue] of install.cues[LANG].entries()) {
    const fraction = (text.indexOf(cue) / text.length) * (spoken / D['s1b-install'])
    await at(fraction, 's1b-install')
    await page.evaluate((n) => window.go(n), i + 1)
  }
  await finish('s1b-install')

  // 2. Today's look: the card, Another, Wore it.
  await page.goto(BASE + '?intro=0')
  await card.waitFor()
  await page.waitForTimeout(400)
  start('s2-today')
  await at(0.08, 's2-today'); await scrollTo(card.locator('p').first())
  await at(0.6, 's2-today'); await card.getByRole('button', { name: 'Another' }).click()
  await at(0.8, 's2-today'); await card.getByRole('button', { name: 'Wore it' }).click()
  await finish('s2-today')

  // 3. Adding a piece: Closet, Add a piece, photo, Top, Add and take another.
  start('s3-add')
  await at(0.04, 's3-add'); await nav('Closet')
  await at(0.16, 's3-add'); await page.getByRole('button', { name: 'Add a piece' }).click()
  await at(0.34, 's3-add'); await page.locator('input[type=file][aria-label="Photo"]').setInputFiles(path.join(V, 'mango-top.jpg'))
  const dialog = page.getByRole('dialog')
  await at(0.5, 's3-add'); await dialog.getByRole('button', { name: 'Top', exact: true }).click()
  await at(0.62, 's3-add'); await scrollTo(dialog.getByText(/Picked from your photo/))
  await at(0.84, 's3-add'); await dialog.getByRole('button', { name: 'Add and take another' }).click()
  await finish('s3-add')

  // 4. More looks: the sentence, Save, Not for me.
  start('s4-looks')
  await page.keyboard.press('Escape')
  await at(0.05, 's4-looks'); await nav('Looks')
  await at(0.16, 's4-looks'); await scrollTo(page.locator('main h2').last(), 'start')
  await at(0.36, 's4-looks'); await page.getByLabel('Occasion').selectOption('work')
  await at(0.52, 's4-looks'); await scrollTo(page.locator('article').filter({ hasText: 'Track' }).first())
  await at(0.66, 's4-looks'); await page.locator('article').filter({ hasText: 'Track' }).first().getByRole('button', { name: /^Save/ }).click()
  await at(0.84, 's4-looks'); await page.locator('article').filter({ hasText: 'Track' }).nth(1).getByRole('button', { name: 'Not for me' }).click()
  await finish('s4-looks')

  // 5. Lookbook: stars, Pieces.
  start('s5-lookbook')
  await at(0.04, 's5-lookbook'); await nav('Lookbook')
  await at(0.4, 's5-lookbook'); await page.getByRole('button', { name: '4 stars' }).last().click()
  await at(0.72, 's5-lookbook'); await page.getByRole('button', { name: /^Pieces/ }).click()
  await finish('s5-lookbook')

  // 6. Forgotten shelf.
  start('s6-forgotten')
  await at(0.04, 's6-forgotten'); await nav('Closet')
  await at(0.3, 's6-forgotten'); await page.getByRole('button', { name: /^Forgotten/ }).click()
  await finish('s6-forgotten')

  // 7. Backup: the note, Back up now.
  start('s7-backup')
  await page.evaluate(() => { localStorage.removeItem('marcelas-closet:last-backup'); dispatchEvent(new StorageEvent('storage')); scrollTo({ top: 0, behavior: 'smooth' }) })
  await at(0.72, 's7-backup')
  const download = page.waitForEvent('download').catch(() => null)
  await page.getByRole('note').getByRole('button', { name: 'Back up now' }).click()
  await download
  await finish('s7-backup')

  // 8. Close: back to Looks.
  start('s8-close')
  await at(0.05, 's8-close'); await nav('Looks')
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' }))
  await finish('s8-close')
  await sleep(400)
  const end = (Date.now() - t0) / 1000

  await cdp.send('Page.stopScreencast')
  await ctx.close()
  // Frames come only when the screen changes: hold each until the next, then encode at 30 fps.
  const list = ['ffconcat version 1.0']
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : t0 / 1000 + end
    list.push(`file '${f.file}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`)
  })
  list.push(`file '${frames[frames.length - 1].file}'`)
  fs.writeFileSync(path.join(vids, 'frames.txt'), list.join('\n'))
  const video = path.join(V, `screen-${LANG}.mp4`)
  const first = frames[0].t - t0 / 1000 // the video starts at the first frame
  execSync(`ffmpeg -v error -y -f concat -safe 0 -i ${path.join(vids, 'frames.txt')} -vf "fps=30,scale=780:1688:force_original_aspect_ratio=decrease,pad=780:1688:(ow-iw)/2:(oh-ih)/2:color=0xfbf3ea,format=yuv420p" -c:v libx264 -crf 18 -preset medium ${video}`)
  for (const id of Object.keys(marks)) marks[id] = +(marks[id] - first).toFixed(3)
  fs.writeFileSync(path.join(V, `marks-${LANG}.json`), JSON.stringify({ marks, durations: D, end: end - first, video, frames: frames.length }, null, 2))
  console.log(LANG, 'recorded', JSON.stringify(marks), 'end', end.toFixed(1))
})()
