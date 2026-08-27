import type { MaintenanceCentralBureau } from '@/types/maintenance'

/** The 3 systems the จุดติดตั้งอุปกรณ์ tab shows (per the 2026-08-24 mock).
 *  Values double as the `?type=` URL param; `apiName` matches
 *  `solution.solution_type_name` in `/manage/solution/{dept}/position` and
 *  `solutionTypeId` is the id `/manage/maintenance/central/{id}` takes. */
export const INSTALL_TYPE_OPTIONS = [
  { label: 'CCTV', value: 'CCTV', apiName: 'CCTV', solutionTypeId: 1 },
  { label: 'Lighting', value: 'LIGHTING', apiName: 'Lighting', solutionTypeId: 6 },
  { label: 'VMS', value: 'VMS', apiName: 'VMS', solutionTypeId: 7 },
] as const

export type InstallType = (typeof INSTALL_TYPE_OPTIONS)[number]['value']

export const installTypeMeta = (type: InstallType) =>
  INSTALL_TYPE_OPTIONS.find((o) => o.value === type) ?? INSTALL_TYPE_OPTIONS[0]

export interface InstallDepartment {
  id: number
  name: string
  online: number
  total: number
}

export interface InstallBureau {
  stch: number
  name: string
  online: number
  total: number
  departments: InstallDepartment[]
}

/**
 * Sidebar tree from `/manage/maintenance/central/{solution_type_id}` (BE
 * 2026-08-26). Counts shown are LOCATION-level (จุดติดตั้ง online/total) —
 * this tab is about install points; device totals also exist on the payload
 * if the design ever wants them. BE order + names are used as-is
 * (`bureau_id` is a DB id, not the สทช. running number).
 */
export const centralToBureaus = (rows: MaintenanceCentralBureau[]): InstallBureau[] =>
  rows.map((b) => ({
    stch: b.bureau_id,
    name: b.bureau_name,
    online: b.location_online_count,
    total: b.location_count,
    departments: (b.departments ?? []).map((d) => ({
      id: d.department_id,
      name: d.department_name,
      online: d.location_online_count,
      total: d.location_count,
    })),
  }))

/** "…-กม.4+250-…" / "sta 0+050" → "กม.4+250". The device/solution names embed
 *  the km marker in several shapes; normalize to the mock's "กม.X+XXX". */
export const extractKm = (text: string | null | undefined): string => {
  if (!text) return '-'
  const m = /(?:กม|km)\s*\.?\s*(?:ที่)?\s*(\d+\s*\+\s*\d+)/i.exec(text) ?? /(\d+\+\d{3})/.exec(text)
  return m ? `กม.${m[1].replace(/\s+/g, '')}` : '-'
}

/** sta field ("0+050") → "กม.0+050"; blank → fall back to name extraction. */
export const kmFromSta = (sta: string | null | undefined, fallbackName?: string | null): string => {
  const s = (sta ?? '').trim()
  if (s !== '') return /^\d+\s*\+\s*\d+$/.test(s) ? `กม.${s.replace(/\s+/g, '')}` : s
  return extractKm(fallbackName)
}

/** Numeric coordinate → fixed 6-decimal display string (mock shows
 *  14.979900); null/undefined/0 from the API's empty placeholder → '-'. */
export const formatCoord = (v: number | null | undefined): string =>
  v != null && Number.isFinite(v) && v !== 0 ? v.toFixed(6) : '-'
