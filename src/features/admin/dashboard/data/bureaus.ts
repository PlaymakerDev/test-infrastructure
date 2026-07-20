// 18 สำนัก (สทช.1-18) — display metadata for the bureau summary markers.
// Kept next to `provinces.ts` so any place that needs bureau labels imports
// from one place. Geometry lives in `public/data/th-bureaus.geojson` (built
// by `/tmp/build_bureaus.mjs` — one-shot union of the 77-province geojson).

export interface Bureau {
  /** Numeric สทช. id, matches tbl_department.department_group. */
  stch: number
  /** สทช.X label used on the marker. */
  name: string
  /** Base จังหวัด that anchors the bureau's naming (สทช.10 เชียงใหม่ etc.). */
  base: string
}

export const BUREAUS: Bureau[] = [
  { stch:  1, name: 'สทช.1',  base: 'ปทุมธานี' },
  { stch:  2, name: 'สทช.2',  base: 'สระบุรี' },
  { stch:  3, name: 'สทช.3',  base: 'ชลบุรี' },
  { stch:  4, name: 'สทช.4',  base: 'เพชรบุรี' },
  { stch:  5, name: 'สทช.5',  base: 'นครราชสีมา' },
  { stch:  6, name: 'สทช.6',  base: 'ขอนแก่น' },
  { stch:  7, name: 'สทช.7',  base: 'อุบลราชธานี' },
  { stch:  8, name: 'สทช.8',  base: 'นครสวรรค์' },
  { stch:  9, name: 'สทช.9',  base: 'อุตรดิตถ์' },
  { stch: 10, name: 'สทช.10', base: 'เชียงใหม่' },
  { stch: 11, name: 'สทช.11', base: 'สุราษฎร์ธานี' },
  { stch: 12, name: 'สทช.12', base: 'สงขลา' },
  { stch: 13, name: 'สทช.13', base: 'ฉะเชิงเทรา' },
  { stch: 14, name: 'สทช.14', base: 'กระบี่' },
  { stch: 15, name: 'สทช.15', base: 'อุดรธานี' },
  { stch: 16, name: 'สทช.16', base: 'กาฬสินธุ์' },
  { stch: 17, name: 'สทช.17', base: 'เชียงราย' },
  { stch: 18, name: 'สทช.18', base: 'สุพรรณบุรี' },
]

export const BUREAU_BY_STCH: Record<number, Bureau> = Object.fromEntries(
  BUREAUS.map((b) => [b.stch, b])
)

/** Every valid bureau id. Anything outside this set (0, 20, 21) is the
 *  ทช.ส่วนกลาง / กรมทางหลวง ทล. / ด่านชั่งน้ำหนัก bucket — collapsed to a
 *  single "ส่วนกลาง" marker on the dashboard map. */
export const BUREAU_STCH_SET = new Set(BUREAUS.map((b) => b.stch))
