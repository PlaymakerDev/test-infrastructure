import type { LightingLamp, LightingLampCurrentHour, LightingLampDay } from '@/types/lighting'
import { thaiDateBE } from '@/utils/thaiDate'

/** One row of ตารางข้อมูลอุปกรณ์ — a lamp. `null` = the API has no such
 *  figure for it yet: the cell reads "-". */
export interface LampRow {
  key: string
  order: number
  code: string
  isWorking: boolean | null
  isConnected: boolean | null
  current: number | null
  updatedAt: string
  /** `device_id` exactly as `/lamps` sent it — the per-lamp endpoints answer
   *  404 once its trailing spaces are trimmed. */
  deviceId?: string
  /** [lng, lat] — the lamp's own pin on the map. */
  coord?: [number, number] | null
}

/** สถานะโคมไฟ — the gateway's working / not-working split. */
export interface LampSummary {
  total: number
  working: number
  notWorking: number
}

const STAMP = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/

/** "15/09/2569 07:36:28" — the lighting service's Buddhist-year stamp — as a
 *  Date; null when empty or not that shape. */
export const parseLightingStamp = (value: string | null | undefined): Date | null => {
  const m = STAMP.exec((value ?? '').trim())
  if (!m) return null
  const [, d, mo, y, h, mi, s] = m.map(Number)
  const date = new Date(y - 543, mo - 1, d, h, mi, s)
  return Number.isNaN(date.getTime()) ? null : date
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** "15 ก.ย. 2569 07:36:28" — the table cell's format. */
export const formatLampStamp = (date: Date): string =>
  `${thaiDateBE(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`

/** "ปกติ" works, "ดับ" doesn't — BE also reads a lamp silent for 13 hours as
 *  ดับ. Anything else is not a status this page knows. */
const workingFromStatus = (status: string | null | undefined): boolean | null =>
  status === 'ปกติ' ? true : status === 'ดับ' ? false : null

const poleNumber = (pole: string | null | undefined): number | null => {
  const n = Number.parseInt((pole ?? '').trim(), 10)
  return Number.isFinite(n) ? n : null
}

/** [lng, lat], or null when BE has no usable position for the lamp. */
const lampCoord = ({ lng, lat }: Pick<LightingLamp, 'lng' | 'lat'>): [number, number] | null =>
  typeof lng === 'number' && typeof lat === 'number' && Number.isFinite(lng) && Number.isFinite(lat) &&
  (lng !== 0 || lat !== 0)
    ? [lng, lat]
    : null

/** The lamps in pole order (`/lamps`, user 2026-11-05): status, connection,
 *  current and when each last reported, as BE gives them. */
export const lampRowsFromLamps = (lamps: LightingLamp[] | null | undefined): LampRow[] =>
  (lamps ?? [])
    .map((lamp, i) => ({ lamp, i, pole: poleNumber(lamp.pole) }))
    .sort((a, b) => (a.pole ?? Infinity) - (b.pole ?? Infinity) || a.i - b.i)
    .map(({ lamp, i, pole }, place) => {
      const reported = parseLightingStamp(lamp.last_update)
      const code = lamp.device_id?.trim() ?? ''
      return {
        key: `${code || 'lamp'}~${i}`,
        order: pole ?? place + 1,
        code: code || '-',
        isWorking: workingFromStatus(lamp.status),
        isConnected: typeof lamp.is_online === 'boolean' ? lamp.is_online : null,
        current: typeof lamp.current === 'number' ? lamp.current : null,
        updatedAt: reported ? formatLampStamp(reported) : '-',
        deviceId: lamp.device_id ?? '',
        coord: lampCoord(lamp),
      }
    })

/** ทั้งหมด / UP / DOWN — the table's filter: UP = the lamp works, DOWN = it
 *  doesn't (สถานะโคมไฟ). */
export type LampFilter = 'ALL' | 'UP' | 'DOWN'

export const LAMP_FILTER_LABELS: Record<LampFilter, string> = {
  ALL: 'ทั้งหมด',
  UP: 'UP (ทำงาน)',
  DOWN: 'DOWN (ไม่ทำงาน)',
}

/** UP / DOWN can only pick lamps once the API says which work. */
export const hasLampStatus = (rows: LampRow[]) => rows.some((row) => row.isWorking != null)

export const filterLamps = (rows: LampRow[], filter: LampFilter): LampRow[] =>
  filter === 'ALL' ? rows : rows.filter((row) => row.isWorking === (filter === 'UP'))

/** ค้นหา (user 2026-11-05) — a lamp by its pole number, whole ("15" is โคม
 *  15, not 115 or 150), or by any part of its device code, any case. */
export const searchLamps = (rows: LampRow[], query: string): LampRow[] => {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => String(row.order) === q || row.code.toLowerCase().includes(q))
}

/** นำออกเอกสาร's "เงื่อนไข" — the status picked, then the search when one is on. */
export const lampExportNote = (filter: LampFilter, query: string) => {
  const q = query.trim()
  return `สถานะโคมไฟ: ${LAMP_FILTER_LABELS[filter]}${q ? ` · ค้นหา "${q}"` : ''}`
}

export const workingLabel = (isWorking: boolean | null) => (isWorking == null ? '-' : isWorking ? 'ทำงาน' : 'ไม่ทำงาน')
export const connectionLabel = (isConnected: boolean | null) => (isConnected == null ? '-' : isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ')
export const currentLabel = (current: number | null) => (current == null ? '-' : current.toFixed(2))

/** นำออกเอกสาร — the table's columns in its order, as text; Excel keeps the
 *  current a number. `width` = Excel characters, `widthPct` = PDF (sums 100). */
export const LAMP_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  pdf: (row: LampRow) => string | number
  excel: (row: LampRow) => string | number
}[] = [
  { header: 'ลำดับโคม', width: 10, widthPct: 10, align: 'center', pdf: (row) => row.order, excel: (row) => row.order },
  { header: 'รหัสอุปกรณ์', width: 22, widthPct: 22, pdf: (row) => row.code, excel: (row) => row.code },
  { header: 'สถานะโคมไฟ', width: 14, widthPct: 15, pdf: (row) => workingLabel(row.isWorking), excel: (row) => workingLabel(row.isWorking) },
  { header: 'การเชื่อมต่อ', width: 14, widthPct: 15, pdf: (row) => connectionLabel(row.isConnected), excel: (row) => connectionLabel(row.isConnected) },
  { header: 'กระแสไฟฟ้า (A)', width: 14, widthPct: 13, align: 'right', pdf: (row) => currentLabel(row.current), excel: (row) => row.current ?? '-' },
  { header: 'อัพเดตล่าสุด', width: 24, widthPct: 25, pdf: (row) => row.updatedAt, excel: (row) => row.updatedAt },
]

/** สถานะโคมไฟวันนี้ — counted from the table's own rows, so the donut, the
 *  UP / DOWN chips and the table always agree. (`/lamps/summary` is the
 *  legacy work master's tally, recomputed every 2 hours: ทล.107 counts 70
 *  working while none of its lamps has reported since 2565.) Null when there
 *  is no lamp. */
export const lampSummaryFromRows = (rows: LampRow[]): LampSummary | null => {
  if (rows.length === 0) return null
  const working = rows.filter((row) => row.isWorking === true).length
  const notWorking = rows.filter((row) => row.isWorking === false).length
  return { total: rows.length, working, notWorking }
}

/** When the newest lamp report came in — under the donut, so "all ดับ" can be
 *  read as "nothing has reported since …". */
export const latestLampReport = (lamps: LightingLamp[] | null | undefined): Date | null =>
  (lamps ?? []).reduce<Date | null>((latest, lamp) => {
    const at = parseLightingStamp(lamp.last_update)
    return at && (!latest || at > latest) ? at : latest
  }, null)

/** One bar group of แผนภูมิแสดงประวัติสถานะโคมไฟ 7 วันย้อนหลัง. */
export interface LampHistoryPoint {
  /** X-axis label, e.g. "30 ต.ค. 2569". */
  label: string
  /** Tooltip header — the same date. */
  tooltipLabel: string
  working: number
  notWorking: number
  /** BarChart reads series by key. */
  [key: string]: string | number
}

/** "30/10/69" — the weekly tally's dd/mm/yy, two-digit Buddhist year — as a
 *  Date; null when not that shape. */
export const parseLampDay = (value: string | null | undefined): Date | null => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec((value ?? '').trim())
  if (!m) return null
  const [, d, mo, yy] = m.map(Number)
  const date = new Date(2500 + yy - 543, mo - 1, d)
  return date.getDate() === d && date.getMonth() === mo - 1 ? date : null
}

/** `/lamps/weekly` as bars, oldest first; a day whose date doesn't parse keeps
 *  its raw text rather than vanishing. */
export const lampHistoryFromWeekly = (days: LightingLampDay[] | null | undefined): LampHistoryPoint[] =>
  (days ?? []).map((day) => {
    const date = parseLampDay(day.date)
    const label = date ? thaiDateBE(date) : day.date
    return { label, tooltipLabel: label, working: day.work, notWorking: day.fail }
  })

/** Whole-lamp ticks up to `max` — about five steps of 1, 2 or 5 × 10ⁿ, so 414
 *  lamps read 0 / 100 / … / 500 rather than a tick per lamp, and a point of 1
 *  never shows "0.5 โคม". */
export const lampCountTicks = (max: number): number[] => {
  const top = Math.max(1, Math.ceil(max))
  const raw = top / 5
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow)
  const end = Math.ceil(top / step) * step
  return Array.from({ length: Math.round(end / step) + 1 }, (_, i) => i * step)
}

/** "286 (67.8%)" — a count and its share of the total, the way the Figma's
 *  "Active : …" line and the donut's legend write it. */
export const countWithShare = (count: number, total: number): string =>
  `${count.toLocaleString('en-US')} (${total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'}%)`

/** "03:00" → "03.00 - 04.00" — an hour as the Figma's Peak Hour Current
 *  writes it; null when the text is not an hour. */
export const formatHourWindow = (hour: string | null | undefined): string | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hour ?? '').trim())
  if (!m) return null
  const h = Number(m[1])
  return `${pad2(h)}.${m[2]} - ${pad2(h + 1)}.${m[2]}`
}

/** The กระแสไฟฟ้าเฉลี่ย card. */
export interface LampCurrentStats {
  /** Mean of the hours that have a reading; null when none has. */
  average: number | null
  /** The hour with the highest average ("03.00 - 04.00"); null when no hour
   *  drew any current. */
  peakHour: string | null
}

/** Hours as `{ hour, amp }` — the point's (`/lamps/current/hourly`) or a
 *  cabinet's amp graph alike. An hour without a reading is null, not 0. */
export const currentStats = (points: { hour: string; amp: number | null }[]): LampCurrentStats => {
  const read = points.filter((p): p is { hour: string; amp: number } => typeof p.amp === 'number' && Number.isFinite(p.amp))
  if (read.length === 0) return { average: null, peakHour: null }
  const average = read.reduce((sum, p) => sum + p.amp, 0) / read.length
  const peak = read.reduce((best, p) => (p.amp > best.amp ? p : best))
  return { average, peakHour: peak.amp > 0 ? formatHourWindow(peak.hour) : null }
}

/** `/lamps/current/hourly` as chart points — all 24 hours, null where no
 *  lamp reported (a gap, not a 0 A reading). */
export const lampCurrentPoints = (hours: LightingLampCurrentHour[] | null | undefined): { hour: string; amp: number | null }[] =>
  (hours ?? []).map((h) => ({ hour: h.hour, amp: typeof h.avg_amp === 'number' ? h.avg_amp : null }))

/** "2026-11-05" — the hourly endpoint's Bangkok day — as a local Date; null
 *  when not that shape. */
export const parseIsoDay = (value: string | null | undefined): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? '').trim())
  if (!m) return null
  const [, y, mo, d] = m.map(Number)
  const date = new Date(y, mo - 1, d)
  return date.getDate() === d && date.getMonth() === mo - 1 ? date : null
}
