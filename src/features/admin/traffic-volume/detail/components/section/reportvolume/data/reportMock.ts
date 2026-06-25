// UI DTO shapes for the รายงานการนับปริมาณจราจร tab. The wire format
// (`CountingReportSummaryRow` / `CountingVehicleTypeAggRow` from
// `@/types/traffic-volume/detail-api`) is adapted into these row shapes in
// `reportvolume/index.tsx` via the `to*Row` mappers. The tables consume
// only these UI shapes — they don't see the wire format directly.

// ── Daily / Hourly / Monthly / Yearly shared shape ─────────────────────────

export interface DailyReportRow {
  /** ISO date — drives the "วันที่" column. */
  date: string
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  totalVehicles: number
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

// ── Hourly (per-camera grouped) ────────────────────────────────────────────

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

// ── Monthly ────────────────────────────────────────────────────────────────

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

// ── Yearly ─────────────────────────────────────────────────────────────────

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

// ── Vehicle-type analysis report ───────────────────────────────────────────

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
