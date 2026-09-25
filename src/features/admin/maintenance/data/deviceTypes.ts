import { DEVICE_BADGE } from '@/constants/cctv'
import { SOLUTION_TYPE } from '@/types/manage/solution-api'
import type { CameraSolutionGroup } from '@/types/maintenance'

export interface DeviceTypeBadge {
  label: string
  color: string
}

/** ประเภทอุปกรณ์ pills, from `CameraItem.solution_group` (backend 2026-09-16).
 *  A camera serving CCTV + Incident Detection arrives as
 *  `[{id:1,name:'CCTV'},{id:3,name:'Analytic'}]`.
 *
 *  Mapped by SOLUTION_TYPE id onto the app-wide DEVICE_BADGE registry, so the
 *  colours match every other menu AND the UI wording wins over the backend's
 *  (it says "Analytic"/"Counting" where the UI says "Incident"/"Volume"). */
const BADGE_BY_ID: Record<number, DeviceTypeBadge> = {
  [SOLUTION_TYPE.CCTV]: DEVICE_BADGE.cctv,
  [SOLUTION_TYPE.Counting]: DEVICE_BADGE.counting,
  [SOLUTION_TYPE.Analytic]: DEVICE_BADGE.analytic,
  [SOLUTION_TYPE.Traffic]: DEVICE_BADGE.traffic,
  [SOLUTION_TYPE.Crosswalk]: DEVICE_BADGE.crosswalk,
  [SOLUTION_TYPE.VMS]: DEVICE_BADGE.vms,
  [SOLUTION_TYPE.WIM]: DEVICE_BADGE.wim_camera,
}

// Name fallback for ids the registry has no camera badge for (Lighting,
// Tunnel, Bridge Lighting) and for any future rename.
const BADGE_BY_NAME: Record<string, DeviceTypeBadge> = {}
for (const [key, entry] of Object.entries(DEVICE_BADGE)) {
  BADGE_BY_NAME[key] = entry
  BADGE_BY_NAME[entry.label.toLowerCase()] = entry
}
BADGE_BY_NAME['volume'] = DEVICE_BADGE.counting
BADGE_BY_NAME['incident'] = DEVICE_BADGE.analytic
BADGE_BY_NAME['wim'] = DEVICE_BADGE.wim_camera
BADGE_BY_NAME['tracking'] = DEVICE_BADGE.wim_camera

export const parseDeviceTypes = (
  groups?: CameraSolutionGroup[] | null,
): DeviceTypeBadge[] => {
  const out: DeviceTypeBadge[] = []
  for (const group of groups ?? []) {
    const hit = BADGE_BY_ID[group.id]
      ?? BADGE_BY_NAME[String(group.name ?? '').trim().toLowerCase()]
    // An unknown solution type still deserves a pill — show the backend's own
    // name in neutral grey rather than dropping the device's role silently.
    const badge = hit ?? (group.name ? { label: group.name, color: '#979797' } : null)
    if (badge && !out.some((e) => e.label === badge.label)) out.push(badge)
  }
  return out
}

/** Same data as plain text, for tables that print the type instead of pills
 *  (the case page's ข้อมูลอุปกรณ์ table) and for exports. */
export const deviceTypeText = (groups?: CameraSolutionGroup[] | null): string => {
  const labels = parseDeviceTypes(groups).map((b) => b.label)
  return labels.length > 0 ? labels.join(', ') : 'CCTV'
}

/** ประเภทอุปกรณ์ in Thai — for the หนังสือแจ้งซ่อม ONLY (user 2026-09-22).
 *  An official letter can't read "ปรากฏว่าอุปกรณ์ CCTV"; the on-screen badges
 *  deliberately keep the short English labels, because those match every other
 *  menu in the app.
 *
 *  Keyed by SOLUTION_TYPE id — all ten the backend serves from
 *  `GET /manage/solution/type`. VMS and WIM keep their abbreviation because
 *  that IS how the department writes them. */
const THAI_BY_ID: Record<number, string> = {
  [SOLUTION_TYPE.CCTV]: 'กล้องโทรทัศน์วงจรปิด',
  [SOLUTION_TYPE.Counting]: 'ระบบตรวจนับปริมาณจราจร',
  [SOLUTION_TYPE.Analytic]: 'ระบบตรวจจับเหตุการณ์ผิดปกติด้านการจราจร',
  [SOLUTION_TYPE.Traffic]: 'ระบบสัญญาณไฟจราจร',
  [SOLUTION_TYPE.Crosswalk]: 'ระบบสัญญาณไฟทางข้ามอัจฉริยะ',
  [SOLUTION_TYPE.Lighting]: 'ระบบไฟฟ้าแสงสว่าง',
  [SOLUTION_TYPE.VMS]: 'ป้ายปรับเปลี่ยนข้อความได้ (VMS)',
  [SOLUTION_TYPE.Tunnel]: 'ระบบตรวจสอบและเฝ้าระวังอุโมงค์',
  [SOLUTION_TYPE.WIM]: 'ระบบชั่งน้ำหนักยานพาหนะขณะเคลื่อนที่ (WIM)',
  [SOLUTION_TYPE.BridgeLighting]: 'ระบบไฟประดับสะพาน',
}

/** Thai type names for one camera, in SOLUTION_TYPE order, de-duplicated.
 *  An id the map doesn't know falls back to the backend's own name rather
 *  than vanishing from the letter. */
export const deviceTypeThai = (groups?: CameraSolutionGroup[] | null): string[] => {
  const out: string[] = []
  for (const group of groups ?? []) {
    const name = THAI_BY_ID[group.id] ?? (group.name ? String(group.name).trim() : '')
    if (name && !out.includes(name)) out.push(name)
  }
  return out
}

/** Every Thai type across a whole case, joined for the letter's ¶2. A case
 *  covering a CCTV and a counting camera has to name both — the letter used
 *  to print only the first device's type. */
export const deviceTypeThaiText = (
  groupsPerCamera: Array<CameraSolutionGroup[] | null | undefined>,
): string => {
  const all: string[] = []
  for (const groups of groupsPerCamera) {
    for (const name of deviceTypeThai(groups)) {
      if (!all.includes(name)) all.push(name)
    }
  }
  return all.length > 0 ? all.join(' และ ') : THAI_BY_ID[SOLUTION_TYPE.CCTV]
}
