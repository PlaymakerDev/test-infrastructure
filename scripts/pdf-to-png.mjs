/* Dev-only: rasterize a PDF's pages to PNGs via pdf.js inside Playwright's
 * Chromium, so Thai glyph completeness in an export can be eyeballed.
 *   node scripts/pdf-to-png.mjs <file.pdf> <outDir>
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const [pdfPath, outDir = '.tmp/pages'] = process.argv.slice(2)
const b64 = fs.readFileSync(pdfPath).toString('base64')
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge' })
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } })
await page.setContent('<body style="margin:0"><div id="root"></div></body>')
await page.addScriptTag({ url: 'https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.min.mjs', type: 'module' })

const count = await page.evaluate(async (data) => {
  const pdfjs = await import('https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.min.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs'
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
  const doc = await pdfjs.getDocument({ data: bytes }).promise
  const root = document.getElementById('root')
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i)
    const viewport = p.getViewport({ scale: 1.6 })
    const canvas = document.createElement('canvas')
    canvas.id = `page-${i}`
    canvas.width = viewport.width
    canvas.height = viewport.height
    root.appendChild(canvas)
    await p.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
  }
  return doc.numPages
}, b64)

for (let i = 1; i <= count; i++) {
  await page.locator(`#page-${i}`).screenshot({ path: path.join(outDir, `page-${i}.png`) })
}
console.log('pages:', count, '→', outDir)
await browser.close()
