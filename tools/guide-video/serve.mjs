// Serves the built app as GitHub Pages does, at /Marcela-s-Closet-/, on port 4173.
// Usage: node tools/guide-video/serve.mjs   (after npm run build)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
const BASE = '/Marcela-s-Closet-/'

const types = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.m4a':'audio/mp4','.webm':'audio/webm','.woff2':'font/woff2','.ico':'image/x-icon','.svg':'image/svg+xml' }
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const send = () => {
    if (!url.pathname.startsWith(BASE)) { res.statusCode = 404; return res.end() }
    let file = path.join(root, path.normalize(decodeURIComponent(url.pathname.slice(BASE.length))).replace(/^(\.\.[\/\\])+/, ''))
    if (!file.startsWith(root)) { res.statusCode = 403; return res.end() }
    if (file.endsWith('/') || url.pathname === BASE) file = path.join(file, 'index.html')
    fs.readFile(file, (err, data) => {
      if (err) { res.statusCode = 404; return res.end() }
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream')
      res.end(data)
    })
  }
  send()
}).listen(4173, '127.0.0.1', () => console.log('Serving', root, 'at http://localhost:4173' + BASE))
