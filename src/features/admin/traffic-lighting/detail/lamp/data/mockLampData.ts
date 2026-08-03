import type { DetailsLineChecks } from '@/types/lighting'
import { thaiDateBE } from '@/utils/thaiDate'

/* ────────────────────────────────────────────────────────────────────────────
 * ⚠️  DEMO DATA — NOT FROM THE BACKEND
 *
 * The lighting API is cabinet-level only (every endpoint in LightingService is
 * keyed on IMEI or department); there is no per-lamp resource yet. These
 * builders fill the three per-lamp sections so the Figma layout can be built
 * and reviewed before that endpoint exists.
 *
 * Flip MOCK_LAMP_DATA to false to restore the honest
 * "ยังไม่มีข้อมูลรายโคมจาก API" empty states — nothing else needs editing.
 *
 * Real values are used wherever the API already provides them (lamp count,
 * per-line on/off from `line_checks`), so the mock never contradicts the
 * diagram or the stat cards on the same screen. Only what the backend genuinely
 * does not expose — per-lamp codes, current, update times, history — is
 * synthesised.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Master switch. `false` restores the pre-mock empty states everywhere. */
export const MOCK_LAMP_DATA = true

/** Figma palette for the lamp sections. */
export const LAMP_WORKING_COLOR = '#66AEFF'
export const LAMP_FAULT_COLOR = '#E94C4C'

/** Deterministic 32-bit hash so a given IMEI always yields the same figures —
 *  re-randomising per render would make the page flicker and read as broken. */
const hashSeed = (value: string): number => {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — small, stable PRNG seeded from the hash above. */
const makeRandom = (seed: number) => {
  let state = seed || 1
  return () => {
    state |= 0
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** "21 เม.ย. 2569" */
const thaiDate = (d: Date) => thaiDateBE(d)
/** "21 เม.ย. 2569 11:09:21" — the format the Figma table cell uses. */
const thaiDateTime = (d: Date) =>
  `${thaiDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`

/** `line_checks` is a flat object of 8 numbered fields; read the first
 *  `count` of them as the real per-lamp working state. Missing/!=1 → faulty. */
const readLineChecks = (checks: DetailsLineChecks | undefined, count: number): boolean[] =>
  Array.from({ length: count }, (_, i) => {
    if (!checks) return true
    const key = `line_check${i + 1}` as keyof DetailsLineChecks
    return checks[key] === 1
  })

export interface MockLampRow {
  key: string
  /** ลำดับโคม */
  order: number
  /** Short per-lamp device code, e.g. "10D4B". */
  code: string
  /** สถานะโคมไฟ — ทำงาน / ไม่ทำงาน */
  isWorking: boolean
  /** การเชื่อมต่อ — เชื่อมต่อ / ไม่เชื่อมต่อ */
  isConnected: boolean
  /** กระแสไฟฟ้า (A), 2dp in the table. */
  current: number
  /** อัพเดตล่าสุด — "21 เม.ย. 2569 11:09:21" */
  updatedAt: string
}

/** One row per lamp. Working state comes from the real `line_checks`; the
 *  device code, current draw and update time have no backend source yet. */
export const buildMockLampRows = (
  imei: string,
  lampCount: number,
  lineChecks: DetailsLineChecks | undefined,
  now: number,
): MockLampRow[] => {
  const count = Math.max(1, lampCount)
  const random = makeRandom(hashSeed(imei))
  const states = readLineChecks(lineChecks, count)

  return states.map((isWorking, index) => {
    // Codes in the design look like short hex tags ("10D4B", "10D43").
    const code = `10D${(hashSeed(`${imei}:${index}`) % 256).toString(16).toUpperCase().padStart(2, '0')}`
    // A lamp that stopped working also stopped reporting a short while ago.
    const staleMinutes = isWorking ? Math.round(random() * 9) : 60 + Math.round(random() * 900)
    const updated = new Date(now - staleMinutes * 60000)
    return {
      key: `${imei}-l${index + 1}`,
      order: index + 1,
      code,
      isWorking,
      // A faulty lamp usually still answers; a disconnected one never does.
      isConnected: isWorking || random() > 0.45,
      current: isWorking ? Number((0.78 + random() * 0.42).toFixed(2)) : 0,
      updatedAt: thaiDateTime(updated),
    }
  })
}

export interface MockLampSummary {
  total: number
  working: number
  notWorking: number
}

export const buildMockLampSummary = (rows: MockLampRow[]): MockLampSummary => {
  const working = rows.filter((r) => r.isWorking).length
  return { total: rows.length, working, notWorking: rows.length - working }
}

export interface MockLampHistoryPoint {
  /** X-axis label, e.g. "27 มี.ค. 2569". */
  label: string
  /** Tooltip header, e.g. "27 มี.ค. 2569". */
  tooltipLabel: string
  working: number
  notWorking: number
  /** Structural match for BarChart's `BarChartDataPoint`, which indexes series
   *  by key — declared here so the chart accepts these points without this
   *  module importing from the chart component. */
  [key: string]: string | number
}

/** 7-day working / not-working split. Mostly healthy with the occasional
 *  outage day — a flat week would read as broken plumbing rather than data. */
export const buildMockLampHistory = (
  imei: string,
  lampCount: number,
  todayWorking: number,
  now: number,
): MockLampHistoryPoint[] => {
  const count = Math.max(1, lampCount)
  const random = makeRandom(hashSeed(`${imei}:history`))
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now)
    day.setDate(day.getDate() - (6 - i))
    const roll = random()
    const lost = roll > 0.78 ? Math.min(2, count) : roll > 0.5 ? Math.min(1, count) : 0
    // The last bar must agree with today's real line_checks, or the chart would
    // contradict the status card sitting right above it.
    const working = i === 6 ? todayWorking : count - lost
    return {
      label: thaiDate(day),
      tooltipLabel: thaiDate(day),
      working,
      notWorking: count - working,
    }
  })
}
