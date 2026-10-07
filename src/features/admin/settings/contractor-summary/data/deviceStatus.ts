import type { DeviceBadgeKey } from '@/constants/cctv'
import type { DeviceTotals } from '@/types/manage/device-status-api'
import type { TunnelCentralItem } from '@/types/tunnel/overview-api'

const toCount = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** A system's totals out of its uptime-statistics response. Each service
 *  names its block differently (`camera`, `vms`, `counting`, …) and Street
 *  Light wraps the object in an array. `null` when the block is missing. */
export const readUptimeTotals = (block: string, body: unknown): DeviceTotals | null => {
  const root = Array.isArray(body) ? body[0] : body
  const totals = root && typeof root === 'object' ? (root as Record<string, unknown>)[block] : null
  if (!totals || typeof totals !== 'object') return null
  const { total, online, offline } = totals as Record<string, unknown>
  const t = toCount(total)
  const on = toCount(online)
  const off = toCount(offline)
  if (t === null || on === null || off === null) return null
  return { total: t, online: on, offline: off }
}

/** Whether a system gets a ring: the contractor has some of it. The backend
 *  means `null` as "no such solution" but in practice answers zeros — both
 *  hide the ring. */
export const hasDevices = (totals: DeviceTotals | null | undefined): totals is DeviceTotals =>
  !!totals && totals.total > 0

/** Offline share in whole percent — what each ring shows. */
export const offlinePercent = (totals: DeviceTotals): number =>
  totals.total > 0 ? Math.round((totals.offline / totals.total) * 100) : 0

/** Tunnel's uptime-statistics ignores `contractor_id` (it answers the same
 *  nationwide totals for everyone, checked 2026-10-01), so its ring is counted
 *  here instead: the tunnels whose project belongs to the contractor — and,
 *  under ในค้ำ / หมดค้ำ, whose own `is_warranty` matches. */
export const tunnelTotalsFor = (
  central: TunnelCentralItem[] | null | undefined,
  projectIds: ReadonlySet<number>,
  isWarranty?: boolean,
): DeviceTotals => {
  let total = 0
  let online = 0
  for (const bureau of central ?? []) {
    for (const dept of bureau.sub_department ?? []) {
      for (const row of dept.solutions ?? []) {
        if (!projectIds.has(row.project?.id)) continue
        if (isWarranty !== undefined && row.is_warranty !== isWarranty) continue
        total++
        if (row.tunnel?.is_online) online++
      }
    }
  }
  return { total, online, offline: total - online }
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
}
const BADGE_ORDER: DeviceBadgeKey[] = ['cctv', 'counting', 'analytic', 'traffic', 'crosswalk', 'wim_camera', 'vms']

/** A camera's function tags. CCTV is always first — every camera here is one. */
export const cameraBadges = (types: { id: number }[] | null | undefined): DeviceBadgeKey[] => {
  const keys = new Set<DeviceBadgeKey>(['cctv'])
  for (const type of types ?? []) {
    const key = BADGE_BY_TYPE[type.id]
    if (key) keys.add(key)
  }
  return BADGE_ORDER.filter((key) => keys.has(key))
}

/** ทั้งหมด / ในค้ำ / หมดค้ำ → the list's `is_warranty`. */
export type WarrantyFilter = 'all' | 'in' | 'out'

export const WARRANTY_FILTER_OPTIONS: { label: string; value: WarrantyFilter }[] = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'ในค้ำ', value: 'in' },
  { label: 'หมดค้ำ', value: 'out' },
]

export const warrantyParam = (filter: WarrantyFilter): boolean | undefined =>
  filter === 'in' ? true : filter === 'out' ? false : undefined
