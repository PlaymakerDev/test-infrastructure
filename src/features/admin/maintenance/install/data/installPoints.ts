import type { DashboardPositionLocation } from '@/types/dashboard/api'
import { BUREAU_BY_STCH } from '@/features/admin/dashboard/data/bureaus'

/** The 3 systems the จุดติดตั้งอุปกรณ์ tab shows (per the 2026-08-24 mock).
 *  Values double as the `?type=` URL param; `apiName` matches
 *  `solution.solution_type_name` in `/manage/solution/{dept}/position`. */
export const INSTALL_TYPE_OPTIONS = [
  { label: 'CCTV', value: 'CCTV', apiName: 'CCTV' },
  { label: 'Lighting', value: 'LIGHTING', apiName: 'Lighting' },
  { label: 'VMS', value: 'VMS', apiName: 'VMS' },
] as const

export type InstallType = (typeof INSTALL_TYPE_OPTIONS)[number]['value']

export const installApiName = (type: InstallType): string =>
  INSTALL_TYPE_OPTIONS.find((o) => o.value === type)?.apiName ?? 'CCTV'

export interface InstallRoad {
  id: number
  code: string
  name: string
  /** Solutions (จุดติดตั้ง) of the selected type on this road. */
  solutions: DashboardPositionLocation[]
}

export interface InstallDepartment {
  id: number
  name: string
  online: number
  total: number
  roads: InstallRoad[]
}

export interface InstallBureau {
  stch: number
  name: string
  online: number
  total: number
  departments: InstallDepartment[]
}

/** Bureau display name — BUREAU_BY_STCH covers สทช.1–18; everything outside
 *  (0, 20, 21 …) is the central bucket, same collapse rule the dashboard map
 *  uses (see dashboard/data/bureaus.ts). */
const bureauName = (stch: number): string => {
  const b = BUREAU_BY_STCH[stch]
  // "สทช.1 (ปทุมธานี)" — same label shape as the statistics sidebar.
  return b ? `${b.name} (${b.base})` : 'ทช. ส่วนกลาง'
}

const bureauKey = (stch: number): number => (BUREAU_BY_STCH[stch] ? stch : 0)

/**
 * Group the dept-0 `/position` payload (already filtered to one solution type)
 * into the sidebar tree: สทช. → ขทช. → สายทาง, with online/total counted at
 * every level. `deptNames` maps department_id → ขทช. short name (from
 * /manage/departments — the position rows carry only ids).
 */
export const groupInstallPositions = (
  locations: DashboardPositionLocation[],
  deptNames: Map<number, string>,
): InstallBureau[] => {
  const bureaus = new Map<number, InstallBureau>()
  for (const loc of locations) {
    const stch = bureauKey(loc.road.stch)
    let bureau = bureaus.get(stch)
    if (!bureau) {
      bureau = { stch, name: bureauName(stch), online: 0, total: 0, departments: [] }
      bureaus.set(stch, bureau)
    }
    let dept = bureau.departments.find((d) => d.id === loc.road.department_id)
    if (!dept) {
      dept = {
        id: loc.road.department_id,
        name: deptNames.get(loc.road.department_id) ?? `ขทช. #${loc.road.department_id}`,
        online: 0,
        total: 0,
        roads: [],
      }
      bureau.departments.push(dept)
    }
    let road = dept.roads.find((r) => r.id === loc.road.id)
    if (!road) {
      road = { id: loc.road.id, code: loc.road.road_code, name: loc.road.road_name, solutions: [] }
      dept.roads.push(road)
    }
    road.solutions.push(loc)
    bureau.total += 1
    dept.total += 1
    if (loc.is_online === true) {
      bureau.online += 1
      dept.online += 1
    }
  }
  // Stable ordering: ส่วนกลาง (0) first, then สทช.1..18; ขทช. by name; roads by code.
  const list = [...bureaus.values()].sort((a, b) => a.stch - b.stch)
  for (const b of list) {
    b.departments.sort((a, c) => a.name.localeCompare(c.name, 'th'))
    for (const d of b.departments) d.roads.sort((a, c) => a.code.localeCompare(c.code, 'th'))
  }
  return list
}

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

/** [lng, lat] → fixed 6-decimal display strings (mock shows 14.979900). */
export const formatLat = (gp: [number, number] | null | undefined): string =>
  gp && Number.isFinite(gp[1]) ? gp[1].toFixed(6) : '-'
export const formatLng = (gp: [number, number] | null | undefined): string =>
  gp && Number.isFinite(gp[0]) ? gp[0].toFixed(6) : '-'
