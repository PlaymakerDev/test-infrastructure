"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { dayjs, type Dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import AppPagination from '@/components/pagination/AppPagination'
import FilterBarReport, {
  type DateRange,
  type HourView,
} from './FilterBarReport'
import HourlyMatrixTable from './HourlyMatrixTable'
import ReportStatsRow, { type ReportStatsUnit } from './ReportStatsRow'
import VehicleTypeStatsRow from './VehicleTypeStatsRow'
import DailyReportTable from './DailyReportTable'
import HourlyReportTable from './HourlyReportTable'
import MonthlyReportTable from './MonthlyReportTable'
import YearlyReportTable from './YearlyReportTable'
import VehicleTypeReportTable from './VehicleTypeReportTable'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'
import { VEHICLE_TYPES } from '../overall/data/vehicleTypes'
import {
  useTrafficVolumeReportSummaryInfinite,
  useTrafficVolumeSolutionCameras,
} from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import {
  computeReportSummary,
  groupByCamera,
} from '@/features/admin/traffic-volume/shared/utils/reportSummary'
import type {
  CountingReportSummaryRow,
  CountingReportRow,
  CountingReportType,
  CountingVehicleTypeAggRow,
  CountingVehicleTypeAPISummary,
} from '@/types/traffic-volume/detail-api'
import {
  type DailyReportRow,
  type DailyReportSummary,
  type HourlyReportCameraGroup,
  type HourlyReportRow,
  type MonthlyReportRow,
  type YearlyReportRow,
  type VehicleTypeReportRow,
  type VehicleTypeReportSummary,
} from './data/reportMock'

interface Props {}

/** Default range — last 7 days ending today. Loaded on first render so
 *  the report shows recent activity without the user having to pick a
 *  range first. */
const DEFAULT_RANGE: DateRange = [dayjs().subtract(6, 'day'), dayjs()]

/** Wide fallback bounds used when the user explicitly clears the date
 *  range (either endpoint of `range` becomes null). Picked deliberately
 *  far outside any realistic data window so the backend returns
 *  everything it has. */
const ALL_DATA_START = '2000-01-01'
const ALL_DATA_END = '2099-12-31'

/** Year report locks the range to the current calendar year so the
 *  backend always rolls up the full year regardless of what the user
 *  previously picked. Derived from `dayjs()` so the value tracks the
 *  active year automatically (was hardcoded to 2026 before). */
const buildYearFixedRange = (): DateRange => {
  const year = dayjs().year()
  return [dayjs(`${year}-01-01`), dayjs(`${year}-12-31`)]
}

/** Soft cap on how many pages the infinite-query auto-walks. At 10 rows
 *  per backend page that's 500 rows — comfortably above a year of daily
 *  rows (~365) but a hard ceiling against a user picking 2000→2099 and
 *  triggering hundreds of HTTP requests in a row. The "show more" CTA
 *  could be added on the table footer if a higher ceiling is needed. */
const MAX_AUTO_PAGES = 50

const fmtDate = (d: Dayjs | null): string | undefined =>
  d ? d.format('YYYY-MM-DD') : undefined

/** Convert one API row → DailyReportRow shape consumed by DailyReportTable.
 *  Field mapping mirrors the wire contract; `percent_truck` already arrives
 *  in 0–100 range so we pass it through as-is. */
const toDailyRow = (r: CountingReportSummaryRow): DailyReportRow => ({
  date: r.date,
  motorcycle: r.bike_count,
  car: r.car_count,
  pickup: r.pickup_count,
  taxi: r.taxi_count,
  bus: r.bus_count,
  truck: r.truck_count,
  trailer: r.trailer_count,
  totalVehicles: r.total_count,
  totalPCU: r.total_pcu,
  maxPCUPerHour: r.peak_pcu,
  truckPercent: r.percent_truck,
})

/** Convert one API row → MonthlyReportRow consumed by MonthlyReportTable.
 *  Year + month are sliced from the ISO date directly (not via `new Date`)
 *  to avoid timezone shifts pushing the bucket to the previous month.
 *  `daysCollected` is `0` because the report endpoint doesn't return it —
 *  the table hides that sub-label when the count is `0`. */
const toMonthlyRow = (r: CountingReportSummaryRow): MonthlyReportRow => ({
  year: parseInt(r.date.slice(0, 4), 10),
  month: parseInt(r.date.slice(5, 7), 10),
  daysCollected: 0,
  motorcycle: r.bike_count,
  car: r.car_count,
  pickup: r.pickup_count,
  taxi: r.taxi_count,
  bus: r.bus_count,
  truck: r.truck_count,
  trailer: r.trailer_count,
  totalVehicles: r.total_count,
  totalPCU: r.total_pcu,
  maxPCUPerHour: r.peak_pcu,
  truckPercent: r.percent_truck,
})

/** Convert one API row → YearlyReportRow consumed by YearlyReportTable.
 *  Year is sliced from the ISO date directly to avoid timezone shifts.
 *  `daysCollected` is `0` because the report endpoint doesn't return it —
 *  the table hides that sub-label when the count is `0`. */
const toYearlyRow = (r: CountingReportSummaryRow): YearlyReportRow => ({
  year: parseInt(r.date.slice(0, 4), 10),
  daysCollected: 0,
  motorcycle: r.bike_count,
  car: r.car_count,
  pickup: r.pickup_count,
  taxi: r.taxi_count,
  bus: r.bus_count,
  truck: r.truck_count,
  trailer: r.trailer_count,
  totalVehicles: r.total_count,
  totalPCU: r.total_pcu,
  maxPCUPerHour: r.peak_pcu,
  truckPercent: r.percent_truck,
})

/** Backend's `vehicle_type` value → our internal key. The API sometimes
 *  strips the leading "รถ" on motorcycle, so we keep both forms. Unknown
 *  labels fall back to the raw API label (the table renders by `label`
 *  via VEHICLE_TYPES so unmapped keys still display the API string). */
const VEHICLE_API_LABEL_TO_KEY: Record<string, string> = {
  จักรยานยนต์: 'motorcycle',
  รถจักรยานยนต์: 'motorcycle',
  รถยนต์: 'car',
  รถกระบะ: 'pickup',
  รถแท็กซี่: 'taxi',
  รถบัส: 'bus',
  รถบรรทุก: 'truck',
  รถพ่วง: 'trailer',
}

/** Map one backend `vehicle_type` row → the UI's `VehicleTypeReportRow`.
 *  Fields are already aggregated server-side; we just translate names. */
const toVehicleTypeRow = (
  r: CountingVehicleTypeAggRow
): VehicleTypeReportRow => ({
  vehicleKey: VEHICLE_API_LABEL_TO_KEY[r.vehicle_type] ?? r.vehicle_type,
  totalVehicles: r.total_count,
  totalPCU: r.total_pcu,
  pcuFactor: r.pcu_factor,
  sharePercent: r.percent,
  avgPCUPerHour: r.avg_hour,
  maxPCUPerHour: r.peak_hour,
})

/** Map the backend's `summary` envelope → the UI's `VehicleTypeReportSummary`.
 *  Field renames are mostly cosmetic; `count` becomes `daysCount` so the
 *  same stats row component handles all report modes (the label cell on
 *  the strip already reads "จำนวนรายการ" for vehicle_type, which is what
 *  `count` represents). */
const mapVehicleTypeAPISummary = (
  s: CountingVehicleTypeAPISummary
): VehicleTypeReportSummary => ({
  daysCount: s.count,
  totalVehicles: s.total_count,
  totalPCU: s.total_pcu,
  dominantVehicleLabel: s.main_vehicle_type,
  dominantVehiclePercent: s.main_vehicle_type_percent,
  lightVehiclePercent: s.percent_normal_vehicle,
  truckCount: s.truck_count,
  truckPercent: s.percent_truck_vehicle,
})

const EMPTY_VEHICLE_TYPE_SUMMARY: VehicleTypeReportSummary = {
  daysCount: 0,
  totalVehicles: 0,
  totalPCU: 0,
  dominantVehicleLabel: '-',
  dominantVehiclePercent: 0,
  lightVehiclePercent: 0,
  truckCount: 0,
  truckPercent: 0,
}

/** Map the FE dropdown value to the API's `report_type` enum. Same values
 *  apart from the legacy `daily` key (the backend uses the same literal). */
const toBackendReportType = (v: string): CountingReportType => {
  switch (v) {
    case 'hour':
    case 'month':
    case 'year':
    case 'vehicle_type':
      return v
    default:
      return 'daily'
  }
}

// ── นำออกเอกสาร (export) ────────────────────────────────────────────────────

/** Shared column config for both PDF and Excel exports — one set per report
 *  type, mirroring that table's on-screen columns exactly (same headers,
 *  same order, same formatting). `width` = Excel chars, `widthPct` = PDF
 *  table percent (each set sums to 100). */
interface ExportColumn<Row> {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: Row, index: number) => string | number
}

/** Type-erased spec consumed by the shared export modal — built per active
 *  report type by `makeExportSpec` so one modal serves all 6 layouts. */
interface ExportSpec {
  filenameBase: string
  title: string
  sheetName: string
  columns: ExportColumn<unknown>[]
  rows: unknown[]
  /** Data-row count for the modal — excludes appended "รวมเฉลี่ย" rows. */
  dataCount: number
  /** Present only for report types whose on-screen table paginates (month /
   *  year): the visible page's rows with a "รวมเฉลี่ย" summed from just that
   *  slice — used when the modal's scope toggle picks หน้าปัจจุบัน. Absent →
   *  the modal renders without the scope toggle. */
  pageRows?: unknown[]
  /** Data-row count of `pageRows` — excludes its "รวมเฉลี่ย" row. */
  pageDataCount?: number
}

/** Pairs a typed column set with its rows, then erases the generic — safe
 *  because columns and rows always travel together. */
function makeExportSpec<Row>(spec: {
  filenameBase: string
  title: string
  sheetName: string
  columns: ExportColumn<Row>[]
  rows: Row[]
  dataCount: number
  pageRows?: Row[]
  pageDataCount?: number
}): ExportSpec {
  return spec as unknown as ExportSpec
}

/** Marks an appended "รวมเฉลี่ย" summary row — the first column prints the
 *  label instead of its date/camera value, every numeric column reads the
 *  pre-summed fields through the normal value fns (same rendering rule the
 *  on-screen tables use via their `_summary` flag). */
interface SummaryFlag {
  _summaryLabel?: string
}

const thaiDate = (iso: string) => dayjs(iso).locale('th').format('D MMM BBBB')

/** Cells shared by the daily / hourly / monthly / yearly layouts — the 7
 *  vehicle-type counts + both totals, same order as every on-screen table.
 *  Counts stay numeric (Excel-friendly, mirrors the CCTV overview export);
 *  รวม PCU keeps the screen's 1-decimal formatting. */
interface VehicleCountCells {
  motorcycle: number
  car: number
  pickup: number
  taxi: number
  bus: number
  truck: number
  trailer: number
  totalVehicles: number
  totalPCU: number
}

function vehicleCountColumns<Row extends VehicleCountCells>(): ExportColumn<Row>[] {
  return [
    { header: 'รถจักรยานยนต์', width: 13, widthPct: 7, value: (r) => r.motorcycle },
    { header: 'รถยนต์', width: 10, widthPct: 7, value: (r) => r.car },
    { header: 'รถกระบะ', width: 10, widthPct: 7, value: (r) => r.pickup },
    { header: 'รถแท็กซี่', width: 10, widthPct: 7, value: (r) => r.taxi },
    { header: 'รถบัส', width: 9, widthPct: 7, value: (r) => r.bus },
    { header: 'รถบรรทุก', width: 10, widthPct: 7, value: (r) => r.truck },
    { header: 'รถพ่วง', width: 9, widthPct: 7, value: (r) => r.trailer },
    { header: 'รวมยานพาหนะ', width: 13, widthPct: 10, value: (r) => r.totalVehicles },
    { header: 'รวม PCU', width: 11, widthPct: 10, value: (r) => fmtNumber(r.totalPCU, 1) },
  ]
}

function maxPcuColumn<Row extends { maxPCUPerHour: number }>(): ExportColumn<Row> {
  return { header: 'PCU สูงสุด / ชั่วโมง', width: 16, widthPct: 10, value: (r) => fmtNumber(r.maxPCUPerHour, 0) }
}

function truckPctColumn<Row extends { truckPercent: number }>(): ExportColumn<Row> {
  return { header: 'รถบรรทุก (%)', width: 12, widthPct: 8, value: (r) => `${fmtNumber(r.truckPercent, 1)}%` }
}

type DailyExportRow = DailyReportRow & SummaryFlag

const DAILY_EXPORT_COLUMNS: ExportColumn<DailyExportRow>[] = [
  {
    header: 'วันที่',
    width: 26,
    widthPct: 13,
    // Same two lines the on-screen cell shows: "27 มิ.ย. 2569" + weekday.
    value: (r) =>
      r._summaryLabel ?? `${thaiDate(r.date)} (วัน${dayjs(r.date).locale('th').format('dddd')})`,
  },
  ...vehicleCountColumns<DailyExportRow>(),
  maxPcuColumn<DailyExportRow>(),
  truckPctColumn<DailyExportRow>(),
]

/** Hour rows flattened out of their per-camera groups — the on-screen camera
 *  header rows become a leading กล้อง column (same treatment the overview
 *  exports give their per-สำนัก divider rows). */
type HourlyExportRow = HourlyReportRow & { cameraName: string } & SummaryFlag

const HOURLY_EXPORT_COLUMNS: ExportColumn<HourlyExportRow>[] = [
  { header: 'กล้อง', width: 20, widthPct: 10, align: 'left', value: (r) => r.cameraName },
  {
    header: 'วันที่ / เวลา',
    width: 26,
    widthPct: 13,
    value: (r) =>
      r._summaryLabel ?? `${thaiDate(r.hourTimestamp)} ${r.hourTimestamp.slice(11, 13)}:00 น.`,
  },
  ...vehicleCountColumns<HourlyExportRow>(),
  truckPctColumn<HourlyExportRow>(),
]

type MonthlyExportRow = MonthlyReportRow & SummaryFlag

const MONTHLY_EXPORT_COLUMNS: ExportColumn<MonthlyExportRow>[] = [
  {
    header: 'เดือน',
    width: 26,
    widthPct: 13,
    value: (r) => {
      if (r._summaryLabel) return r._summaryLabel
      const label = dayjs(`${r.year}-${String(r.month).padStart(2, '0')}-01`)
        .locale('th')
        .format('MMM BBBB')
      // Screen hides the sub-label when the count is 0 — mirror that.
      return r.daysCollected > 0 ? `${label} (เก็บข้อมูล ${fmtNumber(r.daysCollected, 0)} วัน)` : label
    },
  },
  ...vehicleCountColumns<MonthlyExportRow>(),
  maxPcuColumn<MonthlyExportRow>(),
  truckPctColumn<MonthlyExportRow>(),
]

type YearlyExportRow = YearlyReportRow & SummaryFlag

const YEARLY_EXPORT_COLUMNS: ExportColumn<YearlyExportRow>[] = [
  {
    header: 'ปี',
    width: 26,
    widthPct: 13,
    // Buddhist Era year, same as the on-screen cell (+543).
    value: (r) => {
      if (r._summaryLabel) return r._summaryLabel
      return r.daysCollected > 0
        ? `${r.year + 543} (เก็บข้อมูล ${fmtNumber(r.daysCollected, 0)} วัน)`
        : `${r.year + 543}`
    },
  },
  ...vehicleCountColumns<YearlyExportRow>(),
  maxPcuColumn<YearlyExportRow>(),
  truckPctColumn<YearlyExportRow>(),
]

/** Sum the shared numeric cells across rows — the exported "รวมเฉลี่ย" rows
 *  aggregate exactly like the on-screen tables' sumRow helpers (plain column
 *  sums of what's displayed, including maxPCU / truckPercent). */
function sumNumericCells<Row extends VehicleCountCells & { truckPercent: number }>(
  rows: Row[]
): VehicleCountCells & { truckPercent: number; maxPCUPerHour: number; daysCollected: number } {
  const acc = {
    motorcycle: 0, car: 0, pickup: 0, taxi: 0, bus: 0, truck: 0, trailer: 0,
    totalVehicles: 0, totalPCU: 0, truckPercent: 0, maxPCUPerHour: 0, daysCollected: 0,
  }
  for (const r of rows) {
    acc.motorcycle += r.motorcycle
    acc.car += r.car
    acc.pickup += r.pickup
    acc.taxi += r.taxi
    acc.bus += r.bus
    acc.truck += r.truck
    acc.trailer += r.trailer
    acc.totalVehicles += r.totalVehicles
    acc.totalPCU += r.totalPCU
    acc.truckPercent += r.truckPercent
    acc.maxPCUPerHour += (r as { maxPCUPerHour?: number }).maxPCUPerHour ?? 0
    acc.daysCollected += (r as { daysCollected?: number }).daysCollected ?? 0
  }
  return acc
}

/** Append the trailing "รวมเฉลี่ย" row (mirrors the on-screen table) to a
 *  daily/monthly/yearly export row list. No-op when there's no data. `base`
 *  fills the non-numeric identity fields (date/year/month placeholders) —
 *  the first column prints the summary label instead of reading them. */
function withSummaryRow<Row extends VehicleCountCells & { truckPercent: number }>(
  rows: Row[],
  base: Partial<Row>
): (Row & SummaryFlag)[] {
  if (rows.length === 0) return rows
  const summary = {
    ...base,
    ...sumNumericCells(rows),
    _summaryLabel: 'รวมเฉลี่ย',
  } as unknown as Row & SummaryFlag
  return [...rows, summary]
}

/** Same label lookup VehicleTypeReportTable builds from VEHICLE_TYPES. */
const VEHICLE_EXPORT_LABELS: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPES.map((v) => [v.key, v.label])
)

const VEHICLE_TYPE_EXPORT_COLUMNS: ExportColumn<VehicleTypeReportRow>[] = [
  { header: 'ประเภทยานพาหนะ', width: 20, widthPct: 22, align: 'left', value: (r) => VEHICLE_EXPORT_LABELS[r.vehicleKey] ?? r.vehicleKey },
  { header: 'รวมยานพาหนะ', width: 13, widthPct: 13, value: (r) => r.totalVehicles },
  { header: 'รวม PCU', width: 11, widthPct: 13, value: (r) => fmtNumber(r.totalPCU, Number.isInteger(r.totalPCU) ? 0 : 1) },
  { header: 'PCU Factor', width: 11, widthPct: 13, value: (r) => fmtNumber(r.pcuFactor, Number.isInteger(r.pcuFactor) ? 0 : 2) },
  { header: 'สัดส่วน (%)', width: 11, widthPct: 13, value: (r) => `${fmtNumber(r.sharePercent, 1)}%` },
  { header: 'PCU เฉลี่ย / ชั่วโมง', width: 16, widthPct: 13, value: (r) => fmtNumber(r.avgPCUPerHour, Number.isInteger(r.avgPCUPerHour) ? 0 : 1) },
  { header: 'PCU สูงสุด / ชั่วโมง', width: 16, widthPct: 13, value: (r) => fmtNumber(r.maxPCUPerHour, Number.isInteger(r.maxPCUPerHour) ? 0 : 1) },
]

/** 24 hour-bucket keys "00".."23" — mirrors HourlyMatrixTable's HOURS. */
const EXPORT_HOURS = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'))

/** One exported matrix line: camera + date + unit in the label, then a value
 *  per hour. คัน and PCU lines are separate rows, exactly like the screen. */
interface MatrixExportRow {
  label: string
  /** Per-hour values, keyed by "00".."23". */
  hourly: Record<string, number>
}

/** Matrix (วัน × 24 ชม.) columns — วันที่ + 00–23 = 25 columns, landscape.
 *  The on-screen "รวม" column and the derived "รวมเฉลี่ย" summary rows are
 *  dropped (data rows only); the camera-group headers fold into the first
 *  column's label so 24 hour cells fit the page. */
const MATRIX_EXPORT_COLUMNS: ExportColumn<MatrixExportRow>[] = [
  { header: 'วันที่', width: 34, widthPct: 16, align: 'left', value: (r) => r.label },
  ...EXPORT_HOURS.map(
    (hh): ExportColumn<MatrixExportRow> => ({
      header: `${hh}:00`,
      width: 8,
      widthPct: 3.5,
      value: (r) => r.hourly[hh] ?? 0,
    })
  ),
]

/** Regroup the hour-bucketed wire rows by camera → date the same way
 *  HourlyMatrixTable does, emitting one คัน row and one PCU row per date. */
const buildMatrixExportRows = (rows: CountingReportSummaryRow[]): MatrixExportRow[] => {
  // camera → date → hh → { count, pcu }
  const cams = new Map<string, Map<string, Map<string, { count: number; pcu: number }>>>()
  for (const r of rows) {
    if (typeof r.date !== 'string' || r.date.length < 13) continue
    const cam = r.camera_name ?? '-'
    const day = r.date.slice(0, 10)
    const hh = r.date.slice(11, 13)
    let dayMap = cams.get(cam)
    if (!dayMap) {
      dayMap = new Map()
      cams.set(cam, dayMap)
    }
    let hourMap = dayMap.get(day)
    if (!hourMap) {
      hourMap = new Map()
      dayMap.set(day, hourMap)
    }
    hourMap.set(hh, { count: r.total_count, pcu: r.total_pcu })
  }
  const out: MatrixExportRow[] = []
  for (const [cam, dayMap] of cams) {
    const days = Array.from(dayMap.keys()).sort()
    // Count rows first, then PCU rows — same order as the on-screen matrix.
    for (const unit of ['count', 'pcu'] as const) {
      const unitLabel = unit === 'pcu' ? 'PCU' : 'คัน'
      // Trailing "รวมเฉลี่ย" per camera × unit — same per-hour sums across
      // all dates that HourlyMatrixTable's summary rows show.
      const summed: Record<string, number> = {}
      for (const hh of EXPORT_HOURS) summed[hh] = 0
      for (const day of days) {
        const hourMap = dayMap.get(day)!
        const hourly: Record<string, number> = {}
        for (const hh of EXPORT_HOURS) {
          const v = unit === 'pcu' ? (hourMap.get(hh)?.pcu ?? 0) : (hourMap.get(hh)?.count ?? 0)
          // PCU keeps 1 decimal (like the screen) but stays numeric so the
          // Excel cells remain summable.
          hourly[hh] = unit === 'pcu' ? Math.round(v * 10) / 10 : v
          summed[hh] += v
        }
        out.push({
          label: `${cam} · ${thaiDate(day)} (${unitLabel})`,
          hourly,
        })
      }
      if (days.length > 0) {
        for (const hh of EXPORT_HOURS) {
          summed[hh] = unit === 'pcu' ? Math.round(summed[hh] * 10) / 10 : summed[hh]
        }
        out.push({ label: `${cam} · รวมเฉลี่ย (${unitLabel})`, hourly: summed })
      }
    }
  }
  return out
}

/** Tab content for "รายงานการนับปริมาณจราจร".
 *
 *  Layout:
 *  • TOP    — date-range + report-type + camera + export toolbar.
 *  • STATS  — 8 KPI summary row (summary numbers track the active report type).
 *  • TABLE  — one of 5 table layouts based on report type.
 *
 *  Daily + hour modes are wired to `/counting/reports/summary` via
 *  `useTrafficVolumeReportSummary`. Month / year / vehicle_type still
 *  consume mocks until the backend ships their payloads. */
const ReportVolume: React.FC<Props> = () => {
  const { id: solutionId, location } = useDetailContext()
  const deptId = useDeptId()
  const [reportType, setReportType] = useState<string>('daily')
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE)
  const [cameraId, setCameraId] = useState<string>('all')
  // Hour-view toggle (only exposed in the UI when reportType === 'hour').
  // BY_TYPE = per-vehicle-type columns; MATRIX = camera × hour grid with
  // color banding.
  const [hourView, setHourView] = useState<HourView>('BY_TYPE')
  const [exportOpen, setExportOpen] = useState(false)

  // Switching TO hour report snaps the date range to today (single-day) —
  // hour rollups only make sense for one day at a time. Other report types
  // keep whatever range the user last set.
  const handleReportTypeChange = (next: string) => {
    if (next === 'hour') {
      const today = dayjs()
      setRange([today, today])
    }
    setReportType(next)
  }

  // Year mode pins the range to the current calendar year regardless of
  // what the user previously selected — the picker is also disabled in
  // that mode so this override stays authoritative. Memoised so the
  // dayjs bounds aren't reallocated on every render and infinite query
  // keys stay stable across renders within the same year.
  const yearFixedRange = useMemo(() => buildYearFixedRange(), [])

  // Month mode aggregates rows by month, so the picked day range needs
  // to widen to the month boundaries before being sent to the backend —
  // picking Jun 10–15 should roll up ALL of June (Jun 1 → Jun 30), not
  // just the 6 picked days. Empty endpoints stay null and fall through
  // to ALL_DATA_* below.
  const monthExpandedRange = useMemo<DateRange>(() => {
    const [start, end] = range
    return [
      start ? start.startOf('month') : null,
      end ? end.endOf('month') : null,
    ]
  }, [range])

  const effectiveRange: DateRange =
    reportType === 'year'
      ? yearFixedRange
      : reportType === 'month'
        ? monthExpandedRange
        : range
  // Empty endpoints (user hasn't picked a range) fall back to the wide
  // ALL_DATA_* bounds so the report shows every available row instead of
  // disabling the API call.
  const startDate = fmtDate(effectiveRange[0]) ?? ALL_DATA_START
  const endDate = fmtDate(effectiveRange[1]) ?? ALL_DATA_END

  // Per-solution camera list — drives the "เลือกกล้อง" dropdown AND the
  // hour-mode pagination (one camera per page). Same endpoint the CCTV grid
  // + detail map already use, so the cache is shared.
  const { data: camerasData } = useTrafficVolumeSolutionCameras(
    deptId,
    solutionId
  )
  const allCameras = useMemo(
    () => camerasData?.counting ?? [],
    [camerasData]
  )
  const cameraOptions = useMemo(
    () => [
      { value: 'all', label: 'กล้องทั้งหมด' },
      ...allCameras.map((c) => ({ value: c.id, label: c.camera_name })),
    ],
    [allCameras]
  )

  // Per-mode page indices (only one mode is active at a time, but we keep
  // both so switching back doesn't carry over a stale page from the other
  // mode). Both reset together when an input that re-defines "page 1"
  // changes — uses the "adjusting state on prop change" pattern (compare
  // previous vs current during render) rather than an effect, since
  // `react-hooks/set-state-in-effect` flags setState-in-useEffect as a
  // cascading render.
  // Ref: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [monthlyPage, setMonthlyPage] = useState(1)
  const [monthlyPageSize, setMonthlyPageSize] = useState(10)
  const [yearlyPage, setYearlyPage] = useState(1)
  const [yearlyPageSize, setYearlyPageSize] = useState(10)
  const resetKey = `${reportType}|${startDate ?? ''}|${endDate ?? ''}|${cameraId}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (prevResetKey !== resetKey) {
    setMonthlyPage(1)
    setYearlyPage(1)
    setPrevResetKey(resetKey)
  }

  // ── Daily + Hour (API-backed) ────────────────────────────────────────
  // Both modes use the same infinite-query — it walks the backend's
  // small default page size until the tail page returns. We need the
  // entire dataset locally so the table can paginate at 10 client-side
  // (hour view groups by camera; daily view shows a row per day).
  // Month / year / vehicle_type still use mocks → no fetch fired.
  const reportInfinite = useTrafficVolumeReportSummaryInfinite({
    solution_id: solutionId,
    start_date: startDate,
    end_date: endDate,
    report_type: toBackendReportType(reportType),
    // Daily / month / year / vehicle_type forward camera_id (verified
    // format-compatible). Hour rows carry `camera_name` per row, so hour
    // mode filters client-side instead.
    camera_id:
      reportType !== 'hour' && cameraId !== 'all'
        ? cameraId
        : undefined,
  })

  // Auto-walk every page once enabled — the user shouldn't have to click
  // "load more". Capped at `MAX_AUTO_PAGES` so a wide-open date range
  // (e.g. user cleared the picker → ALL_DATA_*) can't trigger hundreds
  // of HTTP requests in a row. Deps deliberately exclude the
  // `reportInfinite` object itself (new ref each render → would fire
  // continuously); the destructured primitive fields detect a next-page
  // transition fine.
  const fetchNextPage = reportInfinite.fetchNextPage
  const hasNextPage = reportInfinite.hasNextPage
  const isFetchingNextPage = reportInfinite.isFetchingNextPage
  const pagesFetched = reportInfinite.data?.pages.length ?? 0
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    if (pagesFetched >= MAX_AUTO_PAGES) return
    fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, pagesFetched])

  // Flatten all fetched pages into a single mixed-shape array. The
  // endpoint returns either date-bucketed rows or pre-aggregated
  // vehicle-type rows depending on `report_type` — we narrow with
  // type-guards downstream. Each page is `{ data, summary? }`; we only
  // keep the row arrays here and pluck `summary` separately.
  const allRawRows = useMemo<CountingReportRow[]>(
    () =>
      reportInfinite.data?.pages.flatMap((p) => p?.data ?? []) ?? [],
    [reportInfinite.data]
  )

  // Latest non-null backend summary across the fetched pages. Backend
  // currently emits this only on `report_type=vehicle_type`; other modes
  // leave it `undefined` and we fall back to client-side aggregation.
  const apiVehicleTypeSummary = useMemo(() => {
    const pages = reportInfinite.data?.pages ?? []
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i]?.summary) return pages[i]!.summary
    }
    return undefined
  }, [reportInfinite.data])

  // Date-bucketed rows (daily / hour / month / year). `date` is the
  // discriminator that proves the row isn't a vehicle-type aggregate.
  const allApiRows = useMemo<CountingReportSummaryRow[]>(
    () =>
      allRawRows.filter(
        (r): r is CountingReportSummaryRow =>
          typeof (r as CountingReportSummaryRow).date === 'string' &&
          (r as CountingReportSummaryRow).date.length > 0
      ),
    [allRawRows]
  )

  // Vehicle-type aggregated rows — narrowed by the presence of the
  // `vehicle_type` discriminator field.
  const vehicleTypeApiRows = useMemo<CountingVehicleTypeAggRow[]>(
    () =>
      allRawRows.filter(
        (r): r is CountingVehicleTypeAggRow =>
          typeof (r as CountingVehicleTypeAggRow).vehicle_type === 'string'
      ),
    [allRawRows]
  )

  // Daily — every fetched row mapped to the UI shape. Rendered in one
  // scroll (no pagination) so the trailing "รวมเฉลี่ย" total in
  // DailyReportTable sums the whole filtered range, not just a page.
  const dailyRowsAll = useMemo<DailyReportRow[]>(
    () => allApiRows.map(toDailyRow),
    [allApiRows]
  )

  // Monthly + yearly aggregates omit `daysCollected`, so fire a parallel
  // `report_type=daily` query on the same range and count days that
  // reported >0 vehicles. Cache is shared with the main daily view — no
  // duplicate fetch when the user visits it.
  const needsDailyHelper = reportType === 'month' || reportType === 'year'
  const dailyHelper = useTrafficVolumeReportSummaryInfinite({
    solution_id: solutionId,
    start_date: startDate,
    end_date: endDate,
    report_type: needsDailyHelper ? 'daily' : undefined,
    camera_id: cameraId !== 'all' ? cameraId : undefined,
  })

  const dailyFetchNext = dailyHelper.fetchNextPage
  const dailyHasNext = dailyHelper.hasNextPage
  const dailyIsFetchingNext = dailyHelper.isFetchingNextPage
  const dailyPagesFetched = dailyHelper.data?.pages.length ?? 0
  useEffect(() => {
    if (!needsDailyHelper) return
    if (!dailyHasNext || dailyIsFetchingNext) return
    if (dailyPagesFetched >= MAX_AUTO_PAGES) return
    dailyFetchNext()
  }, [
    needsDailyHelper,
    dailyHasNext,
    dailyIsFetchingNext,
    dailyFetchNext,
    dailyPagesFetched,
  ])

  const dailyHelperRows = useMemo<CountingReportSummaryRow[]>(() => {
    const rows = dailyHelper.data?.pages.flatMap((p) => p?.data ?? []) ?? []
    return rows.filter(
      (r): r is CountingReportSummaryRow =>
        typeof (r as CountingReportSummaryRow).date === 'string' &&
        (r as CountingReportSummaryRow).total_count > 0,
    )
  }, [dailyHelper.data])

  const daysCollectedByMonth = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of dailyHelperRows) {
      const key = r.date.slice(0, 7)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [dailyHelperRows])

  const daysCollectedByYear = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of dailyHelperRows) {
      const key = r.date.slice(0, 4)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [dailyHelperRows])

  // Monthly — same shape as daily; client-paginated (page size selectable).
  const monthlyRowsAll = useMemo<MonthlyReportRow[]>(
    () =>
      allApiRows.map((r) => {
        const row = toMonthlyRow(r)
        const key = r.date.slice(0, 7)
        return { ...row, daysCollected: daysCollectedByMonth.get(key) ?? 0 }
      }),
    [allApiRows, daysCollectedByMonth]
  )
  const monthlyRows = useMemo<MonthlyReportRow[]>(() => {
    const start = (monthlyPage - 1) * monthlyPageSize
    return monthlyRowsAll.slice(start, start + monthlyPageSize)
  }, [monthlyRowsAll, monthlyPage, monthlyPageSize])
  const showMonthlyPagination =
    reportType === 'month' && monthlyRowsAll.length > 0

  // Yearly — same shape as daily/monthly; client-paginated (page size selectable).
  const yearlyRowsAll = useMemo<YearlyReportRow[]>(
    () =>
      allApiRows.map((r) => {
        const row = toYearlyRow(r)
        const key = r.date.slice(0, 4)
        return { ...row, daysCollected: daysCollectedByYear.get(key) ?? 0 }
      }),
    [allApiRows, daysCollectedByYear]
  )
  const yearlyRows = useMemo<YearlyReportRow[]>(() => {
    const start = (yearlyPage - 1) * yearlyPageSize
    return yearlyRowsAll.slice(start, start + yearlyPageSize)
  }, [yearlyRowsAll, yearlyPage, yearlyPageSize])
  const showYearlyPagination =
    reportType === 'year' && yearlyRowsAll.length > 0

  // Hourly — group every fetched row by camera (now we have ALL rows so
  // each group contains the camera's full hour list). Narrow by the
  // dropdown selection by matching against `camera_name`.
  const allHourlyGroups = useMemo<HourlyReportCameraGroup[]>(
    () => groupByCamera(allApiRows),
    [allApiRows]
  )
  const filteredHourlyGroups = useMemo(() => {
    if (cameraId === 'all') return allHourlyGroups
    const selectedName = allCameras.find((c) => c.id === cameraId)?.camera_name
    if (!selectedName) return allHourlyGroups
    return allHourlyGroups.filter((g) => g.cameraName === selectedName)
  }, [allHourlyGroups, cameraId, allCameras])
  // Camera-narrowed wire rows — used by both hour and vehicle_type modes
  // (both filter client-side because their rows carry `camera_name`).
  // "all" mode keeps the aggregate across every fetched camera.
  const filteredHourRows = useMemo<CountingReportSummaryRow[]>(() => {
    if (cameraId === 'all') return allApiRows
    const selectedName = allCameras.find((c) => c.id === cameraId)?.camera_name
    if (!selectedName) return allApiRows
    return allApiRows.filter((r) => r.camera_name === selectedName)
  }, [allApiRows, cameraId, allCameras])

  // Vehicle-type rows come pre-aggregated from the backend (one row per
  // category). We just map the wire shape to the UI shape — no per-row
  // math needed. `camera_id` is forwarded on the request for this mode
  // (the API filters server-side), so we don't slice the rows further.
  const vehicleTypeRows = useMemo<VehicleTypeReportRow[]>(
    () => vehicleTypeApiRows.map(toVehicleTypeRow),
    [vehicleTypeApiRows]
  )
  // KPI strip — backend pre-computes this in `res_data.summary` for
  // vehicle_type mode, so we map it directly. Falls back to an empty
  // strip while the response hasn't arrived yet.
  const vehicleTypeSummary = useMemo<VehicleTypeReportSummary>(
    () =>
      apiVehicleTypeSummary
        ? mapVehicleTypeAPISummary(apiVehicleTypeSummary)
        : EMPTY_VEHICLE_TYPE_SUMMARY,
    [apiVehicleTypeSummary]
  )

  // 8-KPI summary — shared shape across daily/hourly. Both modes feed
  // from the same `allApiRows` (every fetched row in the date range);
  // hour additionally filters by camera so picking a specific camera
  // collapses the KPIs to just that camera.
  const apiSummary = useMemo(
    () =>
      computeReportSummary(
        reportType === 'hour' ? filteredHourRows : allApiRows
      ),
    [reportType, filteredHourRows, allApiRows]
  )

  // ── นำออกเอกสาร ────────────────────────────────────────────────────────
  // Hour rows flattened with their camera name — same rows the BY_TYPE
  // table renders inside its camera groups, each group closed by the same
  // trailing "รวมเฉลี่ย" row the screen shows (sums of that camera's rows).
  const hourlyExportRows = useMemo<HourlyExportRow[]>(
    () =>
      filteredHourlyGroups.flatMap((g) => {
        const rows: HourlyExportRow[] = g.rows.map((r) => ({ ...r, cameraName: g.cameraName }))
        if (rows.length > 0) {
          rows.push({
            ...sumNumericCells(rows),
            hourTimestamp: '',
            cameraName: g.cameraName,
            _summaryLabel: 'รวมเฉลี่ย',
          })
        }
        return rows
      }),
    [filteredHourlyGroups]
  )

  // Matrix rows are only built while that view is active — the grouping
  // walks every fetched hour row.
  const matrixExportRows = useMemo<MatrixExportRow[]>(
    () =>
      reportType === 'hour' && hourView === 'MATRIX'
        ? buildMatrixExportRows(filteredHourRows)
        : [],
    [reportType, hourView, filteredHourRows]
  )

  /** Everything the modal + both handlers need for the ACTIVE report type —
   *  the same rows the on-screen table renders. Month/year default to the
   *  whole filtered set (every page) and additionally carry `pageRows` so the
   *  modal's หน้าปัจจุบัน scope can export just the visible slice. */
  const exportSpec = useMemo<ExportSpec>(() => {
    switch (reportType) {
      case 'hour':
        return hourView === 'MATRIX'
          ? makeExportSpec({
              filenameBase: 'Traffic_Volume_Hourly_Matrix',
              title: 'รายงานสรุปรายชั่วโมงปริมาณจราจร แบบ Matrix (Hourly Traffic Volume Matrix)',
              sheetName: 'Hourly Matrix',
              columns: MATRIX_EXPORT_COLUMNS,
              rows: matrixExportRows,
              // Matrix rows carry embedded "รวมเฉลี่ย" lines — count only data lines.
              dataCount: matrixExportRows.filter((r) => !r.label.includes('รวมเฉลี่ย')).length,
            })
          : makeExportSpec({
              filenameBase: 'Traffic_Volume_Hourly_Report',
              title: 'รายงานสรุปรายชั่วโมงปริมาณจราจร (Hourly Traffic Volume Report)',
              sheetName: 'Hourly Report',
              columns: HOURLY_EXPORT_COLUMNS,
              rows: hourlyExportRows,
              dataCount: hourlyExportRows.filter((r) => !r._summaryLabel).length,
            })
      case 'month':
        return makeExportSpec({
          filenameBase: 'Traffic_Volume_Monthly_Report',
          title: 'รายงานสรุปรายเดือนปริมาณจราจร (Monthly Traffic Volume Report)',
          sheetName: 'Monthly Report',
          columns: MONTHLY_EXPORT_COLUMNS,
          rows: withSummaryRow(monthlyRowsAll, { year: 0, month: 0 }),
          dataCount: monthlyRowsAll.length,
          // หน้าปัจจุบัน scope — the visible pagination slice, its "รวมเฉลี่ย"
          // re-summed from just that slice.
          pageRows: withSummaryRow(monthlyRows, { year: 0, month: 0 }),
          pageDataCount: monthlyRows.length,
        })
      case 'year':
        return makeExportSpec({
          filenameBase: 'Traffic_Volume_Yearly_Report',
          title: 'รายงานสรุปรายปีปริมาณจราจร (Yearly Traffic Volume Report)',
          sheetName: 'Yearly Report',
          columns: YEARLY_EXPORT_COLUMNS,
          rows: withSummaryRow(yearlyRowsAll, { year: 0 }),
          dataCount: yearlyRowsAll.length,
          // หน้าปัจจุบัน scope — the visible pagination slice, its "รวมเฉลี่ย"
          // re-summed from just that slice.
          pageRows: withSummaryRow(yearlyRows, { year: 0 }),
          pageDataCount: yearlyRows.length,
        })
      case 'vehicle_type':
        return makeExportSpec({
          filenameBase: 'Traffic_Volume_Vehicle_Type_Report',
          title: 'รายงานวิเคราะห์ตามประเภทรถ (Vehicle Type Analysis Report)',
          sheetName: 'Vehicle Type Report',
          columns: VEHICLE_TYPE_EXPORT_COLUMNS,
          rows: vehicleTypeRows,
          dataCount: vehicleTypeRows.length,
        })
      case 'daily':
      default:
        return makeExportSpec({
          filenameBase: 'Traffic_Volume_Daily_Report',
          title: 'รายงานสรุปรายวันปริมาณจราจร (Daily Traffic Volume Report)',
          sheetName: 'Daily Report',
          columns: DAILY_EXPORT_COLUMNS,
          rows: withSummaryRow(dailyRowsAll, { date: '' }),
          dataCount: dailyRowsAll.length,
        })
    }
  }, [
    reportType,
    hourView,
    matrixExportRows,
    hourlyExportRows,
    monthlyRowsAll,
    monthlyRows,
    yearlyRowsAll,
    yearlyRows,
    vehicleTypeRows,
    dailyRowsAll,
  ])

  // Human-readable "เงื่อนไข" line for the PDF header — install point +
  // active date range + camera, so a reader knows the exported subset.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const solutionName = location?.solution?.solution_name
    if (solutionName) parts.push(`จุดติดตั้ง ${solutionName}`)
    const [start, end] = effectiveRange
    if (start && end) {
      parts.push(
        `ช่วงวันที่ ${start.locale('th').format('D MMM BBBB')} - ${end.locale('th').format('D MMM BBBB')}`
      )
    }
    if (cameraId !== 'all') {
      const cameraLabel = cameraOptions.find((o) => o.value === cameraId)?.label
      if (cameraLabel) parts.push(`กล้อง ${cameraLabel}`)
    }
    return parts.length ? parts.join(' · ') : undefined
  }, [location, effectiveRange, cameraId, cameraOptions])

  const renderTable = () => {
    switch (reportType) {
      case 'hour':
        // Hourly view has NO pagination — every camera's full hour list is
        // rendered so the per-group "รวมเฉลี่ย" total sums the whole day
        // for each camera (not just the sliced page). The `hourView` toggle
        // decides between the per-vehicle-type layout and the color-banded
        // camera × hour matrix.
        return hourView === 'MATRIX' ? (
          <HourlyMatrixTable rows={filteredHourRows} />
        ) : (
          <HourlyReportTable groups={filteredHourlyGroups} />
        )
      case 'month':
        return (
          <div className='flex flex-col gap-3'>
            <MonthlyReportTable rows={monthlyRows} />
            {showMonthlyPagination && (
              <AppPagination
                current={monthlyPage}
                pageSize={monthlyPageSize}
                total={monthlyRowsAll.length}
                onChange={(p, s) => {
                  setMonthlyPage(p)
                  setMonthlyPageSize(s)
                }}
              />
            )}
          </div>
        )
      case 'year':
        return (
          <div className='flex flex-col gap-3'>
            <YearlyReportTable rows={yearlyRows} />
            {showYearlyPagination && (
              <AppPagination
                current={yearlyPage}
                pageSize={yearlyPageSize}
                total={yearlyRowsAll.length}
                onChange={(p, s) => {
                  setYearlyPage(p)
                  setYearlyPageSize(s)
                }}
              />
            )}
          </div>
        )
      case 'vehicle_type':
        return <VehicleTypeReportTable rows={vehicleTypeRows} />
      case 'daily':
      default:
        // Daily view intentionally has NO pagination — the user wants every
        // filtered day visible in one scroll so the trailing "รวมเฉลี่ย"
        // total covers the entire selected range (not just a page).
        return <DailyReportTable rows={dailyRowsAll} />
    }
  }

  /** The vehicle-type view has its own KPI set (dominant type, light-vehicle
   *  share, truck count). The other four share `ReportStatsRow`'s shape,
   *  but the per-time-unit labels (จำนวน{วัน|ชั่วโมง|เดือน|ปี},
   *  เฉลี่ย…ต่อ{...}) follow the active report type. */
  const renderStats = () => {
    if (reportType === 'vehicle_type') {
      return <VehicleTypeStatsRow summary={vehicleTypeSummary} />
    }
    // All non-vehicle-type modes are now API-backed by `apiSummary`.
    const summary: DailyReportSummary = apiSummary
    // Map dropdown value → ReportStatsRow's `unit` prop. Unknown values fall
    // through to 'day' so the labels stay sensible.
    const unitMap: Record<string, ReportStatsUnit> = {
      daily: 'day',
      hour: 'hour',
      month: 'month',
      year: 'year',
    }
    return <ReportStatsRow summary={summary} unit={unitMap[reportType] ?? 'day'} />
  }

  return (
    <div className='flex flex-col gap-6'>
      <FilterBarReport
        range={effectiveRange}
        onRangeChange={setRange}
        dateDisabled={reportType === 'year'}
        defaultReportType={reportType}
        onReportTypeChange={handleReportTypeChange}
        cameraOptions={cameraOptions}
        defaultCamera={cameraId}
        onCameraChange={setCameraId}
        hourView={hourView}
        onHourViewChange={setHourView}
        onExport={() => setExportOpen(true)}
      />

      {/* ── นำออกเอกสาร — exports the ACTIVE report type's table through the
            shared pdf/excel utils (columns + rows swap per exportSpec). The
            ทั้งหมด/หน้าปัจจุบัน scope toggle appears only for month/year —
            the only report types whose on-screen table paginates (exportSpec
            carries `pageRows` for them); the rest keep the plain count. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportSpec.dataCount}
        scope={
          exportSpec.pageRows
            ? { totalCount: exportSpec.dataCount, pageCount: exportSpec.pageDataCount ?? 0 }
            : undefined
        }
        onExportPdf={async (scope) => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: exportSpec.filenameBase,
            title: exportSpec.title,
            filterNote: exportFilterNote,
            columns: exportSpec.columns.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: scope === 'page' && exportSpec.pageRows ? exportSpec.pageRows : exportSpec.rows,
          })
        }}
        onExportExcel={async (scope) => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: exportSpec.filenameBase,
            sheetName: exportSpec.sheetName,
            columns: exportSpec.columns.map(({ header, width, value }) => ({ header, width, value })),
            rows: scope === 'page' && exportSpec.pageRows ? exportSpec.pageRows : exportSpec.rows,
          })
        }}
      />

      {renderStats()}
      {renderTable()}
    </div>
  )
}

export default React.memo<Props>(ReportVolume)
