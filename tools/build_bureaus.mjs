// One-shot script — reads th-provinces.geojson + province→stch mapping,
// unions province polygons per bureau (สำนัก), writes th-bureaus.geojson.
// Mapping sourced from provinces.ts, corrected with the DB (แพร่ belongs to
// สทช.17 per tbl_roads.department_id / tbl_department.department_group, not
// สทช.10 as an older FE hardcode had it).
//
// Run:  node /tmp/build_bureaus.mjs
import fs from 'node:fs'
import path from 'node:path'
import { union } from '@turf/union'
import { featureCollection, feature } from '@turf/helpers'
import centroid from '@turf/centroid'

const REPO = '/home/itsatlas/drr-its-new'
const SRC = path.join(REPO, 'public/data/th-provinces.geojson')
const OUT = path.join(REPO, 'public/data/th-bureaus.geojson')

// code → stch (0 for กท = กรุงเทพ, ไม่มี ขทช. — บริหารส่วนกลาง)
// Verified against the DB 2026-07-18: same as provinces.ts EXCEPT แพร่ (พร)
// which sits under สทช.17 not สทช.10.
const CODE_TO_STCH = {
  ปท: 1, นบ: 1, สป: 1, อย: 1, อท: 1, กท: 0,
  สบ: 2, ลบ: 2, สห: 2, ชน: 2,
  ชบ: 3, รย: 3, จบ: 3, ตร: 3,
  พบ: 4, ปข: 4, รบ: 4, สส: 4, สค: 4,
  นม: 5, ชย: 5, บร: 5, สร: 5,
  ขก: 6, ลย: 6, มค: 6, รอ: 6,
  อบ: 7, ศก: 7, อจ: 7, ยส: 7,
  นว: 8, อน: 8, ตก: 8, กพ: 8, พจ: 8,
  อต: 9, สท: 9, พล: 9, พช: 9,
  ชม: 10, มส: 10, ลพ: 10, ลป: 10,
  สฎ: 11, นศ: 11, ชพ: 11, รน: 11,
  สข: 12, สต: 12, ยล: 12, ปน: 12, นธ: 12,
  ฉช: 13, ปจ: 13, นย: 13, สก: 13,
  กบ: 14, พง: 14, ภก: 14, ตง: 14, พท: 14,
  อด: 15, นภ: 15, นค: 15, บก: 15,
  กส: 16, สน: 16, นพ: 16, มห: 16,
  ชร: 17, พย: 17, นน: 17, พร: 17,
  สพ: 18, กจ: 18, นฐ: 18,
}

const BUREAU_META = {
  1:  { name: 'สทช.1',  base: 'ปทุมธานี' },
  2:  { name: 'สทช.2',  base: 'สระบุรี' },
  3:  { name: 'สทช.3',  base: 'ชลบุรี' },
  4:  { name: 'สทช.4',  base: 'เพชรบุรี' },
  5:  { name: 'สทช.5',  base: 'นครราชสีมา' },
  6:  { name: 'สทช.6',  base: 'ขอนแก่น' },
  7:  { name: 'สทช.7',  base: 'อุบลราชธานี' },
  8:  { name: 'สทช.8',  base: 'นครสวรรค์' },
  9:  { name: 'สทช.9',  base: 'อุตรดิตถ์' },
  10: { name: 'สทช.10', base: 'เชียงใหม่' },
  11: { name: 'สทช.11', base: 'สุราษฎร์ธานี' },
  12: { name: 'สทช.12', base: 'สงขลา' },
  13: { name: 'สทช.13', base: 'ฉะเชิงเทรา' },
  14: { name: 'สทช.14', base: 'กระบี่' },
  15: { name: 'สทช.15', base: 'อุดรธานี' },
  16: { name: 'สทช.16', base: 'กาฬสินธุ์' },
  17: { name: 'สทช.17', base: 'เชียงราย' },
  18: { name: 'สทช.18', base: 'สุพรรณบุรี' },
}

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'))
console.log(`source: ${src.features.length} province features`)

// Group province features by stch. Skip กท (stch=0) — no bureau polygon,
// ทช. central handles it directly; it stays visible on the base province
// layer at deeper zoom.
const byStch = new Map()
const missing = []
for (const f of src.features) {
  const code = f.properties?.code
  const stch = CODE_TO_STCH[code]
  if (stch === undefined) { missing.push(code); continue }
  if (stch === 0) continue
  if (!byStch.has(stch)) byStch.set(stch, [])
  byStch.get(stch).push(f)
}
if (missing.length) console.warn(`WARN: unmapped codes: ${missing.join(', ')}`)

// Union each group with turf. `union` takes a FeatureCollection; if a bureau
// has only ONE province the input already is the answer, so we short-circuit.
const bureauFeatures = []
for (const [stch, feats] of [...byStch.entries()].sort((a, b) => a[0] - b[0])) {
  let merged
  if (feats.length === 1) {
    merged = feats[0]
  } else {
    // turf's `union` accepts a FeatureCollection since v7 — pass the whole
    // group in one call so all pairwise unions run internally.
    merged = union(featureCollection(feats))
  }
  const meta = BUREAU_META[stch]
  const c = centroid(merged).geometry.coordinates
  const provinceCodes = feats.map((f) => f.properties.code)
  bureauFeatures.push({
    type: 'Feature',
    properties: {
      stch,
      name: meta.name,
      base_province: meta.base,
      provinces: provinceCodes,
      // Centroid stashed in properties so the FE marker layer doesn't have
      // to recompute it every render.
      centroid: c,
    },
    geometry: merged.geometry,
  })
  console.log(`  สทช.${stch.toString().padStart(2, ' ')}  ${meta.name.padEnd(8, ' ')}  ${feats.length} provinces  → ${merged.geometry.type}`)
}

const out = featureCollection(bureauFeatures)
fs.writeFileSync(OUT, JSON.stringify(out))
console.log(`wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB, ${bureauFeatures.length} features)`)
