import type { DeviceBadgeKey } from '@/constants/cctv'
import type { DeviceTotals } from '@/types/manage/device-status-api'

const toCount = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null

/** One system's uptime-statistics: as the backend counts them, and as the
 *  rings of ทั้งหมด / ในค้ำ / หมดค้ำ show them. */
export interface UptimeCounts {
  /** As read — the นอกเหนือการรับประกัน devices among the offline. */
  raw: DeviceTotals
  /** Offline devices with an open นอกเหนือการรับประกัน record (a car hit it, its
   *  cable was cut or stolen…): `out_of_warranty` in the system's own block,
   *  "a part of offline" (BE 2026-11-16, all ten services — the camera-based
   *  systems count the units whose camera has a record). */
  outOfWarranty: number
  /** `raw` less those devices — out of both ออฟไลน์ and ทั้งหมด (user
   *  2026-11-16, option ก.), so ออนไลน์ + ออฟไลน์ still equals ทั้งหมด. */
  totals: DeviceTotals
}

/** Takes the นอกเหนือการรับประกัน devices out of ออฟไลน์ and ทั้งหมด alike —
 *  never more than the offline count, should the backend ever send more. */
export const withoutOutOfWarranty = (totals: DeviceTotals, outOfWarranty: number): DeviceTotals => {
  const removed = Math.min(Math.max(0, outOfWarranty), totals.offline)
  return { total: totals.total - removed, online: totals.online, offline: totals.offline - removed }
}

/** A system's counts out of its uptime-statistics response. Each service
 *  names its block differently (`camera`, `vms`, `counting`, …) and Street
 *  Light wraps the object in an array. `null` when the block is missing. */
export const readUptimeCounts = (block: string, body: unknown): UptimeCounts | null => {
  const root = asRecord(Array.isArray(body) ? body[0] : body)
  const counts = asRecord(root?.[block])
  if (!counts) return null
  const total = toCount(counts.total)
  const online = toCount(counts.online)
  const offline = toCount(counts.offline)
  if (total === null || online === null || offline === null) return null
  const raw = { total, online, offline }
  const outOfWarranty = Math.min(toCount(counts.out_of_warranty) ?? 0, offline)
  return { raw, outOfWarranty, totals: withoutOutOfWarranty(raw, outOfWarranty) }
}

/** Whether a system gets a ring: the contractor has some of it. The backend
 *  means `null` as "no such solution" but in practice answers zeros — both
 *  hide the ring. */
export const hasDevices = (totals: DeviceTotals | null | undefined): totals is DeviceTotals =>
  !!totals && totals.total > 0

/** Offline share in whole percent — what each ring shows. */
export const offlinePercent = (totals: DeviceTotals): number =>
  totals.total > 0 ? Math.round((totals.offline / totals.total) * 100) : 0

/** นอกเหนือการรับประกัน's ring: the share of the system's offline devices
 *  that are recorded out of warranty — whole percent as the other tabs, one
 *  decimal place under 1% only (user 2026-11-17: 3 of 1,221 is 0.2%, where
 *  whole percent read 0). */
export const outOfWarrantyPercent = ({ raw, outOfWarranty }: Pick<UptimeCounts, 'raw' | 'outOfWarranty'>): number => {
  if (raw.offline <= 0) return 0
  const share = (outOfWarranty / raw.offline) * 100
  const tenths = Math.round(share * 10) / 10
  return tenths < 1 ? tenths : Math.round(share)
}

/** That share as the ring and the report write it: "0%", "0.2%", "5%",
 *  "100%" — "<0.1%" only for records too few to show even so, rather than a
 *  0% beside their count. */
export const outOfWarrantyShareText = (counts: Pick<UptimeCounts, 'raw' | 'outOfWarranty'>): string => {
  const percent = outOfWarrantyPercent(counts)
  if (percent === 0) return counts.outOfWarranty > 0 ? '<0.1%' : '0%'
  return percent < 1 ? `${percent.toFixed(1)}%` : `${percent}%`
}

/** "กม. 2+800" — the word once, even when the chainage already carries it;
 *  nothing at all for a group without one (the backend sends "" or null). */
export const staLabel = (sta: string | null | undefined): string => {
  const bare = (sta ?? '').trim().replace(/^กม\.?\s*/, '')
  return bare ? `กม. ${bare}` : ''
}

/** solution_type_id → the app's device badge (label + colour live in
 *  DEVICE_BADGE), in the order the CCTV pages list them. */
const BADGE_BY_TYPE: Record<number, DeviceBadgeKey> = {
  1: 'cctv',
  2: 'counting',
  3: 'analytic',
  4: 'traffic',
  5: 'crosswalk',
  9: 'wim_camera',
  7: 'vms',
  11: 'lpr',
}
const BADGE_ORDER: DeviceBadgeKey[] = ['cctv', 'counting', 'analytic', 'traffic', 'crosswalk', 'wim_camera', 'vms', 'lpr']

/** A camera's function tags. CCTV is always first — every camera here is one. */
export const cameraBadges = (types: { id: number }[] | null | undefined): DeviceBadgeKey[] => {
  const keys = new Set<DeviceBadgeKey>(['cctv'])
  for (const type of types ?? []) {
    const key = BADGE_BY_TYPE[type.id]
    if (key) keys.add(key)
  }
  return BADGE_ORDER.filter((key) => keys.has(key))
}

/** ทั้งหมด / นอกเหนือการรับประกัน / ในค้ำ / หมดค้ำ, in the Figma's order (user
 *  2026-11-16). นอกเหนือการรับประกัน is not a warranty-date filter: its rings
 *  are every project's recorded devices, its table the projects with records. */
export type WarrantyFilter = 'all' | 'excluded' | 'in' | 'out'

export const WARRANTY_FILTER_OPTIONS: { label: string; value: WarrantyFilter }[] = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'นอกเหนือการรับประกัน', value: 'excluded' },
  { label: 'ในค้ำ', value: 'in' },
  { label: 'หมดค้ำ', value: 'out' },
]

/** The filter → the listings' and uptime-statistics' `is_warranty`. */
export const warrantyParam = (filter: WarrantyFilter): boolean | undefined =>
  filter === 'in' ? true : filter === 'out' ? false : undefined
