// Mock daily report data + types. Swap with a real
// `/counting/report/daily?from=…&to=…` endpoint when the backend ships it.

export interface DailyReportRow {
  /** ISO date — drives the "วันที่" column. */
  date: string
  /** Counts per vehicle type. */
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  /** Total vehicle count for the day. */
  totalVehicles: number
  /** Total PCU for the day. */
  totalPCU: number
  /** Peak hour PCU. */
  maxPCUPerHour: number
  /** Heavy-truck share (0–100). */
  truckPercent: number
}

export interface DailyReportSummary {
  daysCount: number
  totalVehicles: number
  totalPCU: number
  avgVehiclesPerDay: number
  avgPCUPerDay: number
  maxVehiclesPerDay: number
  maxPCUPerDay: number
  truckPercent: number
}

const range = (from: string, to: string): string[] => {
  const out: string[] = []
  const start = new Date(from)
  const end = new Date(to)
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    out.push(new Date(d).toISOString().slice(0, 10))
  }
  return out
}

/** Generate 7 identical rows (matches the design's mock numbers). Swap with
 *  per-day API data when the report endpoint exists. */
export const MOCK_REPORT_ROWS: DailyReportRow[] = range(
  '2026-04-14',
  '2026-04-20'
).map((date) => ({
  date,
  motorcycle: 388,
  car: 3039,
  pickup: 1343,
  taxi: 0,
  bus: 5,
  truck: 3225,
  trailer: 164,
  totalVehicles: 8164,
  totalPCU: 12961.5,
  maxPCUPerHour: 286,
  truckPercent: 41.6,
}))

export const MOCK_REPORT_SUMMARY: DailyReportSummary = {
  daysCount: 7,
  totalVehicles: 86930,
  totalPCU: 19661.5,
  avgVehiclesPerDay: 2496,
  avgPCUPerDay: 1982.3,
  maxVehiclesPerDay: 8164,
  maxPCUPerDay: 12961.5,
  truckPercent: 41.6,
}

// ── Hourly report ────────────────────────────────────────────────────────────
// Per-camera, per-hour rows. Hours are grouped under their camera, and each
// group gets a "รวมเฉลี่ย" footer row in the table.

export interface HourlyReportRow {
  /** ISO timestamp at the hour mark — e.g. "2026-04-19T20:00:00+07:00". */
  hourTimestamp: string
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  totalVehicles: number
  totalPCU: number
  truckPercent: number
}

export interface HourlyReportCameraGroup {
  cameraName: string
  /** Pre-computed "เก็บข้อมูล N ชั่วโมง" label count. */
  hoursCollected: number
  rows: HourlyReportRow[]
}

/** Mock hourly report — 2 cameras, a few hours each, identical numbers per
 *  row to match the screenshot. Swap with real data when backend ships. */
const mkHour = (date: string, hour: number): HourlyReportRow => ({
  hourTimestamp: `${date}T${hour.toString().padStart(2, '0')}:00:00+07:00`,
  motorcycle: 388,
  car: 3039,
  pickup: 1343,
  taxi: 0,
  bus: 5,
  truck: 3225,
  trailer: 164,
  totalVehicles: 8164,
  totalPCU: 12961.5,
  truckPercent: 0,
})

export const MOCK_HOURLY_REPORT: HourlyReportCameraGroup[] = [
  {
    cameraName: 'P11-CAM-F01',
    hoursCollected: 4,
    rows: [
      mkHour('2026-04-19', 20),
      mkHour('2026-04-19', 21),
      mkHour('2026-04-19', 22),
      mkHour('2026-04-19', 23),
    ],
  },
  {
    cameraName: 'P11-CAM-F02',
    hoursCollected: 3,
    rows: [
      mkHour('2026-04-20', 0),
      mkHour('2026-04-20', 8),
      mkHour('2026-04-20', 9),
    ],
  },
]

/** Summary row for the hourly view (2 days worth of data per the design). */
export const MOCK_HOURLY_SUMMARY: DailyReportSummary = {
  ...MOCK_REPORT_SUMMARY,
  daysCount: 2,
}

// ── Monthly report ───────────────────────────────────────────────────────────
// One row per month with "เก็บข้อมูล N วัน" sub-label. Otherwise same column
// shape as the daily table.

export interface MonthlyReportRow {
  /** Gregorian year — the table renders the Buddhist Era year via dayjs. */
  year: number
  /** 1-12. */
  month: number
  /** How many days of data the month accumulated. */
  daysCollected: number
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  totalVehicles: number
  totalPCU: number
  maxPCUPerHour: number
  truckPercent: number
}

const mkMonth = (
  year: number,
  month: number,
  daysCollected: number
): MonthlyReportRow => ({
  year,
  month,
  daysCollected,
  motorcycle: 388,
  car: 3039,
  pickup: 1343,
  taxi: 0,
  bus: 5,
  truck: 3225,
  trailer: 164,
  totalVehicles: 8164,
  totalPCU: 12961.5,
  maxPCUPerHour: 286,
  truckPercent: 41.6,
})

export const MOCK_MONTHLY_REPORT: MonthlyReportRow[] = [
  mkMonth(2026, 1, 20),
  mkMonth(2026, 2, 12),
  mkMonth(2026, 3, 25),
  mkMonth(2026, 4, 14),
]

// ── Yearly report ────────────────────────────────────────────────────────────
// Same column shape as the monthly view — just one row per year.

export interface YearlyReportRow {
  /** Gregorian year — the table renders the Buddhist Era year via +543. */
  year: number
  /** How many days of data the year accumulated. */
  daysCollected: number
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  totalVehicles: number
  totalPCU: number
  maxPCUPerHour: number
  truckPercent: number
}

const mkYear = (year: number, daysCollected: number): YearlyReportRow => ({
  year,
  daysCollected,
  motorcycle: 388,
  car: 3039,
  pickup: 1343,
  taxi: 0,
  bus: 5,
  truck: 3225,
  trailer: 164,
  totalVehicles: 8164,
  totalPCU: 12961.5,
  maxPCUPerHour: 286,
  truckPercent: 41.6,
})

export const MOCK_YEARLY_REPORT: YearlyReportRow[] = [
  mkYear(2024, 240),
  mkYear(2025, 312),
  mkYear(2026, 145),
]

// ── Vehicle-type analysis report ─────────────────────────────────────────────
// One row per vehicle type. The stats row above this table uses a different
// metric set than the daily/hourly/monthly views.

export interface VehicleTypeReportRow {
  /** Matches a `VEHICLE_TYPES.key` value (motorcycle, car, …). */
  vehicleKey: string
  totalVehicles: number
  totalPCU: number
  pcuFactor: number
  /** Share of total vehicle count, 0–100. */
  sharePercent: number
  avgPCUPerHour: number
  maxPCUPerHour: number
}

export interface VehicleTypeReportSummary {
  daysCount: number
  totalVehicles: number
  totalPCU: number
  /** Localised label of the dominant vehicle type (e.g. "รถยนต์"). */
  dominantVehicleLabel: string
  /** Share of the dominant type, 0–100. */
  dominantVehiclePercent: number
  /** Combined share of light vehicles (motorcycle + car + pickup + taxi). */
  lightVehiclePercent: number
  truckCount: number
  truckPercent: number
}

export const MOCK_VEHICLE_TYPE_REPORT: VehicleTypeReportRow[] = [
  { vehicleKey: 'motorcycle', totalVehicles: 936,   totalPCU: 833.2,  pcuFactor: 0.25, sharePercent: 30.1, avgPCUPerHour: 162.2, maxPCUPerHour: 364.1 },
  { vehicleKey: 'car',        totalVehicles: 6203,  totalPCU: 6203,   pcuFactor: 1,    sharePercent: 52.6, avgPCUPerHour: 974.2, maxPCUPerHour: 463.2 },
  { vehicleKey: 'pickup',     totalVehicles: 2374,  totalPCU: 2374,   pcuFactor: 1,    sharePercent: 30.5, avgPCUPerHour: 358.1, maxPCUPerHour: 182.5 },
  { vehicleKey: 'taxi',       totalVehicles: 0,     totalPCU: 0,      pcuFactor: 1,    sharePercent: 0,    avgPCUPerHour: 0,     maxPCUPerHour: 0 },
  { vehicleKey: 'bus',        totalVehicles: 0,     totalPCU: 0,      pcuFactor: 2,    sharePercent: 0,    avgPCUPerHour: 0,     maxPCUPerHour: 0 },
  { vehicleKey: 'truck',      totalVehicles: 388,   totalPCU: 970,    pcuFactor: 2.5,  sharePercent: 15.5, avgPCUPerHour: 53.9,  maxPCUPerHour: 2.4 },
  { vehicleKey: 'trailer',    totalVehicles: 13,    totalPCU: 32.5,   pcuFactor: 2.5,  sharePercent: 3.8,  avgPCUPerHour: 8.1,   maxPCUPerHour: 0.2 },
]

export const MOCK_VEHICLE_TYPE_SUMMARY: VehicleTypeReportSummary = {
  daysCount: 7,
  totalVehicles: 86930,
  totalPCU: 19661.5,
  dominantVehicleLabel: 'รถยนต์',
  dominantVehiclePercent: 45.2,
  lightVehiclePercent: 89.5,
  truckCount: 364,
  truckPercent: 41.6,
}
