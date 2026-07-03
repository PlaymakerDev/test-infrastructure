"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { TbArrowLeft, TbArrowRight } from 'react-icons/tb'
import { dayjs, type Dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
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
import {
  useTrafficVolumeReportSummaryInfinite,
  useTrafficVolumeSolutionCameras,
} from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import {
  buildPageList,
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

interface BluePaginationProps {
  current: number
  total: number
  onChange: (page: number) => void
}

/** Numbered pagination styled per the report-tab design — round blue
 *  active pill, blue page numbers, ก่อนหน้า / ถัดไป labels with arrows.
 *  Built locally instead of using `antd/Pagination` because the design
 *  diverges from Antd's defaults (round active state + Thai prev/next
 *  labels with custom layout). */
const BluePagination: React.FC<BluePaginationProps> = ({
  current,
  total,
  onChange,
}) => {
  const pages = buildPageList(current, total)
  const prevDisabled = current === 1
  const nextDisabled = current >= total
  const BLUE = '#66AEFF'
  return (
    <nav className='flex items-center justify-end gap-2 mt-2 select-none'>
      <button
        type='button'
        disabled={prevDisabled}
        onClick={() => onChange(Math.max(1, current - 1))}
        className={`inline-flex items-center gap-2 px-2 py-1 fs-14 ${
          prevDisabled
            ? 'text-white/35 cursor-not-allowed'
            : 'cursor-pointer hover:opacity-80'
        }`}
        style={{ color: prevDisabled ? undefined : BLUE }}
      >
        <TbArrowLeft size={18} />
        <span>ก่อนหน้า</span>
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className='inline-flex items-center justify-center w-8 h-8 fs-14'
            style={{ color: BLUE }}
          >
            ...
          </span>
        ) : p === current ? (
          <span
            key={p}
            className='inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-semibold fs-14'
            style={{ background: BLUE }}
          >
            {p}
          </span>
        ) : (
          <button
            key={p}
            type='button'
            onClick={() => onChange(p)}
            className='inline-flex items-center justify-center w-8 h-8 rounded-full fs-14 hover:bg-white/5 cursor-pointer'
            style={{ color: BLUE }}
          >
            {p}
          </button>
        )
      )}
      <button
        type='button'
        disabled={nextDisabled}
        onClick={() => onChange(Math.min(total, current + 1))}
        className={`inline-flex items-center gap-2 px-2 py-1 fs-14 ${
          nextDisabled
            ? 'text-white/35 cursor-not-allowed'
            : 'cursor-pointer hover:opacity-80'
        }`}
        style={{ color: nextDisabled ? undefined : BLUE }}
      >
        <span>ถัดไป</span>
        <TbArrowRight size={18} />
      </button>
    </nav>
  )
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
  const { id: solutionId } = useDetailContext()
  const deptId = useDeptId()
  const [reportType, setReportType] = useState<string>('daily')
  const [range, setRange] = useState<DateRange>(DEFAULT_RANGE)
  const [cameraId, setCameraId] = useState<string>('all')
  // Hour-view toggle (only exposed in the UI when reportType === 'hour').
  // BY_TYPE = per-vehicle-type columns; MATRIX = camera × hour grid with
  // color banding.
  const [hourView, setHourView] = useState<HourView>('BY_TYPE')

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
  const [yearlyPage, setYearlyPage] = useState(1)
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

  // Monthly — same shape as daily; client-paginated at 10 per page.
  const MONTHLY_PAGE_SIZE = 10
  const monthlyRowsAll = useMemo<MonthlyReportRow[]>(
    () => allApiRows.map(toMonthlyRow),
    [allApiRows]
  )
  const monthlyRows = useMemo<MonthlyReportRow[]>(() => {
    const start = (monthlyPage - 1) * MONTHLY_PAGE_SIZE
    return monthlyRowsAll.slice(start, start + MONTHLY_PAGE_SIZE)
  }, [monthlyRowsAll, monthlyPage])
  const monthlyTotalPages = Math.max(
    1,
    Math.ceil(monthlyRowsAll.length / MONTHLY_PAGE_SIZE)
  )
  const showMonthlyPagination =
    reportType === 'month' && monthlyTotalPages > 1

  // Yearly — same shape as daily/monthly; client-paginated at 10 per page.
  const YEARLY_PAGE_SIZE = 10
  const yearlyRowsAll = useMemo<YearlyReportRow[]>(
    () => allApiRows.map(toYearlyRow),
    [allApiRows]
  )
  const yearlyRows = useMemo<YearlyReportRow[]>(() => {
    const start = (yearlyPage - 1) * YEARLY_PAGE_SIZE
    return yearlyRowsAll.slice(start, start + YEARLY_PAGE_SIZE)
  }, [yearlyRowsAll, yearlyPage])
  const yearlyTotalPages = Math.max(
    1,
    Math.ceil(yearlyRowsAll.length / YEARLY_PAGE_SIZE)
  )
  const showYearlyPagination =
    reportType === 'year' && yearlyTotalPages > 1

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
              <BluePagination
                current={monthlyPage}
                total={monthlyTotalPages}
                onChange={setMonthlyPage}
              />
            )}
          </div>
        )
      case 'year':
        return (
          <div className='flex flex-col gap-3'>
            <YearlyReportTable rows={yearlyRows} />
            {showYearlyPagination && (
              <BluePagination
                current={yearlyPage}
                total={yearlyTotalPages}
                onChange={setYearlyPage}
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
      />
      {renderStats()}
      {renderTable()}
    </div>
  )
}

export default React.memo<Props>(ReportVolume)
