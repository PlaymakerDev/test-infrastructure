/* Dev-only preview harness: renders the Maintenance Case repair letter to a
 * PDF on disk so the Thai layout / glyph completeness can be eyeballed without
 * a browser session. Not imported by the app.
 *
 *   npx esbuild scripts/preview-repair-letter.tsx --bundle --platform=node \
 *     --format=cjs --jsx=automatic --outfile=.tmp/preview.cjs \
 *     --define:process.env.NEXT_PUBLIC_BASE_PATH='"<abs path to public>"'
 *   node .tmp/preview.cjs out.pdf
 */
import fs from 'node:fs'
import path from 'node:path'
import { pdf } from '@react-pdf/renderer'
import { LetterDocument, wrapLetterArgs } from '../src/utils/export/letterPdf'
import { buildRepairLetter } from '../src/features/admin/maintenance/case/data/repairLetter'

const PUBLIC_DIR = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// Mirrors the reference letter the department sent. FILL=0 renders the same
// letter with the contract-recital fields the backend can't supply left as
// dotted blanks — that's what a real export looks like today.
const filled = process.env.FILL !== '0'

const args = buildRepairLetter({
  caseNo: 'C-20260717-0003',
  project: {
    contractor: 'กิจการร่วมค้า ทีดับเบิลยูที',
    contractNo: 'สอป.61/2568',
  },
  ...(filled
    ? {
        contractDate: '21 เมษายน 2568',
        coordinatorName: 'นางสาวสุขาดา แดงเรือง',
        coordinatorPosition: 'นายช่างโยธา (พร.)',
        coordinatorPhone: '085 556 4176',
      }
    : {}),
})

const emblemFile = path.join(PUBLIC_DIR, 'images/export/garuda-emblem.png')
const emblemDataUrl = `data:image/png;base64,${fs.readFileSync(emblemFile).toString('base64')}`

// NO_WRAP=1 renders without the pre-wrap pass, to isolate wrapping bugs from
// layout bugs when the Thai output looks wrong.
;(process.env.NO_WRAP ? Promise.resolve(args) : wrapLetterArgs(args))
  .then((prepared) => pdf(<LetterDocument {...prepared} emblemDataUrl={emblemDataUrl} />).toBuffer())
  .then((stream: NodeJS.ReadableStream) => {
    const out = process.argv[2] ?? 'repair-letter.pdf'
    const chunks: Buffer[] = []
    stream.on('data', (c: Buffer) => chunks.push(c))
    stream.on('end', () => {
      fs.writeFileSync(out, Buffer.concat(chunks))
      console.log('wrote', out, Buffer.concat(chunks).length, 'bytes')
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
