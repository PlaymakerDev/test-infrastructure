import type { MaintenanceCentralBureau } from '@/types/maintenance'

/** The 3 systems the จุดติดตั้งอุปกรณ์ tab shows (per the 2026-08-24 mock).
 *  Values double as the `?type=` URL param; `apiName` matches
 *  `solution.solution_type_name` in `/manage/solution/{dept}/position` and
 *  `solutionTypeId` is the id `/manage/maintenance/central/{id}` takes. */
export const INSTALL_TYPE_OPTIONS = [
  { label: 'CCTV', value: 'CCTV', apiName: 'CCTV', solutionTypeId: 1 },
  // Display renamed Lighting → Street Light 2026-08-31 (customer request);
  // `value` (URL param) and `apiName` stay on the backend's wording.
  { label: 'Street Light', value: 'LIGHTING', apiName: 'Lighting', solutionTypeId: 6 },
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
 * 2026-08-26). Counts shown are DEVICE-level (อุปกรณ์/กล้อง online/total —
 * switched from location-level per the 2026-08-28 request; verified
 * `online_count + offline_count === device_count` on every row). Location
 * counts also exist on the payload if the design ever flips back. BE order +
 * names are used as-is (`bureau_id` is a DB id, not the สทช. running number).
 */
export const centralToBureaus = (rows: MaintenanceCentralBureau[]): InstallBureau[] =>
  rows.map((b) => ({
    stch: b.bureau_id,
    name: b.bureau_name,
    online: b.online_count,
    total: b.device_count,
    departments: (b.departments ?? []).map((d) => ({
      id: d.department_id,
      name: d.department_name,
      online: d.online_count,
      total: d.device_count,
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

/** Badge colour per Lighting device category (BE `device_type`, Thai labels —
 *  2026-08-31 design: โคมไฟ = brand yellow, ตู้โจรกรรม = accent blue). Unknown
 *  or blank (CCTV/VMS always send '') → null, so the cell renders '-'. */
const DEVICE_TYPE_COLOR: Record<string, string> = {
  'โคมไฟ': '#FCD116',
  'ตู้โจรกรรม': '#66AEFF',
}

export interface DeviceTypeBadge {
  label: string
  color: string
}

export const deviceTypeBadge = (value: string | null | undefined): DeviceTypeBadge | null => {
  const label = (value ?? '').trim()
  if (label === '') return null
  // Unrecognised labels still render as a badge — neutral grey rather than
  // dropping data BE decided to send.
  return { label, color: DEVICE_TYPE_COLOR[label] ?? '#979797' }
}
