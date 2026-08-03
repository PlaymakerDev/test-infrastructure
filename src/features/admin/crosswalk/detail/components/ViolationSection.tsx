"use client"
import React, { useMemo, useState, useCallback } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import {
  FormSearchViolation,
  ViolationStatCard,
  TableViolationData,
  CCTVViolationData,
} from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { CROSSING_TYPE_MAP, defaultViolationFilter, type ViolationFilter } from './sections/violation/filter'
import { STATUS_OPTIONS } from './sections/violation/FormSearchViolation'
import { parseViolationTimestamp, useViolationRows } from './sections/violation/useViolationRows'
import { FETCH_CONCURRENCY, fetchViolationPages, mapWithConcurrency } from './sections/violation/fetchViolationPages'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'

// `BBBB` (Buddhist-Era year) in the export's date-range filter note.
dayjs.extend(buddhistEra)

interface Props { }

/** Violation row + its resolved IP — the export mirrors the on-screen IP
 *  lookup (cameras-list ip_address → '-'; no sta fallback, a km value under
 *  an "IP Address" header reads as a bug). */
type ExportViolationRow = CrosswalkViolationRow & { ip: string }

// Excel export columns — SAME columns, SAME order as the on-screen
// TableViolationData; the ภาพเหตุการณ์ column exports its image URL (Excel
// can't embed images). Backend pre-formats `timestamp` as "DD/MM/BBBB HH:mm"
// (Thai BE year) — exported as-is. `width` = Excel chars. The PDF export is
// card-based (`entries` block), not a table, so no widthPct here.
const VIOLATION_EXPORT_COLUMNS: {
  header: string
  width: number
  value: (row: ExportViolationRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, value: (_r, i) => i + 1 },
  { header: 'วันที่และเวลา', width: 18, value: (r) => r.crosswalk.timestamp || '-' },
  { header: 'ประเภทเหตุการณ์', width: 22, value: (r) => r.crosswalk.name_th || '-' },
  { header: 'กล้อง', width: 42, value: (r) => r.camera.name || '-' },
  { header: 'IP Address', width: 16, value: (r) => r.ip },
  { header: 'ภาพเหตุการณ์', width: 50, value: (r) => r.image_path || '-' },
]

// ── ทั้งหมด-scope fetch policy ────────────────────────────────────────────────
// Page fetching goes through the shared parallel helper (fetchViolationPages —
// the backend caps limit at 100/request and a station's unbounded range can
// hold >100k rows, e.g. สปข.2001 measured at 110,986). The export stops at an
// explicit ceiling, telling the reader (PDF note) when the set was truncated;
// narrowing the date range is the intended way to get a complete document.
/** Excel row ceiling for ทั้งหมด scope. */
const EXPORT_MAX_ROWS = 10_000
/** PDF photo-card ceiling — each card embeds a fetched snapshot, so the PDF
 *  cap is much lower than Excel's to keep export time/file size sane. */
const PDF_MAX_CARDS = 1_000

const ViolationSection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { id } = useDetailContext()
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [filter, setFilter] = useState<ViolationFilter>(() => defaultViolationFilter())
  const [exportOpen, setExportOpen] = useState(false)

  // Mirror of the ACTIVE view's pagination (table/grid mount exclusively; a
  // view switch remounts the child fresh at page 1 / size 10, so one mirror
  // serves both). Drives the export modal's หน้าปัจจุบัน scope — the children
  // report page changes up via `onPageChange`, and the child's internal
  // reset-to-page-1 on filter change is mirrored in `handleFilterChange`.
  const [viewPage, setViewPage] = useState({ page: 1, pageSize: 10 })

  const handleFilterChange = useCallback(
    (patch: Partial<ViolationFilter>) => {
      setFilter((prev) => ({ ...prev, ...patch }))
      // useViolationRows resets its page to 1 on any filter change (pageSize
      // is kept) — keep the mirror in lockstep.
      setViewPage((prev) => ({ ...prev, page: 1 }))
    },
    [],
  )

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setDisplayType(mode)
    // The incoming view mounts a fresh useViolationRows instance (page 1,
    // size 10) — reset the mirror to match.
    setViewPage({ page: 1, pageSize: 10 })
  }, [])

  const handleChildPageChange = useCallback((page: number, pageSize: number) => {
    setViewPage({ page, pageSize })
  }, [])

  // `serverTotal` = the backend's TRUE count for the date range + status
  // filter (crosswalk_type travels server-side) — drives both the pagination
  // and the export toggle labels. Shares the children's page-query cache.
  const { serverTotal } = useViolationRows(filter, 10)

  // Same IP lookup the table/grid render: cameras-list ip_address (single
  // cached request shared with the OVERALL tab) → '-' when missing.
  const { data: camerasData } = useCrosswalkCameras(deptId, { solution_id: id })

  /** Server-side violation-type value for the active status filter
   *  (crosswalk_type 2=คน, 3=รถ) — undefined for ทั้งหมด. */
  const crosswalkType = filter.status === 'ALL' ? undefined : CROSSING_TYPE_MAP[filter.status]

  /** Rows count the ACTIVE view's current page shows — label for the modal's
   *  หน้าปัจจุบัน option, derived from the server total (every status pages
   *  server-side now). */
  const pageCount = Math.max(
    0,
    Math.min(viewPage.pageSize, (serverTotal ?? 0) - (viewPage.page - 1) * viewPage.pageSize),
  )

  /** หน้าปัจจุบัน scope: fetch exactly the page the child table shows (same
   *  page/limit/filter → same rows; cache-shared with the child's query) and
   *  dress it with the IP fallback. */
  const fetchMirroredPage = async (): Promise<ExportViolationRow[]> => {
    const { getCrosswalkViolationListAPI } = await import('@/services/routes/CrosswalkService')
    const r = await getCrosswalkViolationListAPI({
      solution_id: id,
      start_date: filter.startDate || undefined,
      end_date: filter.endDate || undefined,
      crosswalk_type: crosswalkType,
      limit: viewPage.pageSize,
      page: viewPage.page,
    })
    const ipByCameraId = new Map<string, string | undefined>()
    for (const c of camerasData?.cameras ?? []) ipByCameraId.set(c.id, c.ip_address)
    return (r.data.res_data ?? []).map((row) => ({
      ...row,
      ip: ipByCameraId.get(row.camera.id) || '-',
    }))
  }

  // Human-readable note of the active filters — printed in the export header
  // so a reader knows the date window / violation type of this set.
  const exportNote = useMemo(() => {
    const parts: string[] = [
      filter.startDate && filter.endDate
        ? `ช่วงวันที่ ${dayjs(filter.startDate).format('DD/MM/BBBB')} - ${dayjs(filter.endDate).format('DD/MM/BBBB')}`
        : 'ช่วงเวลา ทั้งหมด',
    ]
    if (filter.status !== 'ALL') {
      const statusLabel = STATUS_OPTIONS.find((s) => s.value === filter.status)?.label
      if (statusLabel) parts.push(`สถานะ ${statusLabel}`)
    }
    return parts.join(' · ')
  }, [filter])

  // ทั้งหมด scope — fetch the full date-range set OURSELVES in parallel
  // batches of FETCH_CONCURRENCY (the backend caps limit at 100/request, so a
  // wide range means many pages; the on-screen hook walks them serially and is
  // far too slow for six-digit sets). Rows come back newest-first from the
  // API; stops at `cap` rows, then applies the same client-side status filter
  // and IP fallback the screen uses.
  const fetchAllViolations = async (cap: number): Promise<{ rows: ExportViolationRow[]; fetchedAll: boolean }> => {
    // The status filter travels server-side (crosswalk_type) — the fetched
    // pages already contain only the selected type.
    const { rows: raw, fetchedAll } = await fetchViolationPages(
      { solution_id: id, start_date: filter.startDate, end_date: filter.endDate, crosswalk_type: crosswalkType },
      cap,
    )
    const ipByCameraId = new Map<string, string | undefined>()
    for (const c of camerasData?.cameras ?? []) ipByCameraId.set(c.id, c.ip_address)
    return {
      rows: raw.map((r) => ({ ...r, ip: ipByCameraId.get(r.camera.id) || '-' })),
      fetchedAll,
    }
  }

  // PDF = photo cards mirroring the on-screen violation cards (snapshot +
  // ประเภทเหตุการณ์ + วันเวลา + camera fields). Snapshots are pre-fetched and
  // re-encoded (utils/export/image.ts); any image that fails just renders its
  // card photo-less. `scope` comes from the modal's ทั้งหมด/หน้าปัจจุบัน toggle.
  const handleExportPdf = async (scope?: 'all' | 'page') => {
    const [{ exportReportPdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const all = scope === 'page' ? null : await fetchAllViolations(PDF_MAX_CARDS)
    const rows =
      scope === 'page' ? await fetchMirroredPage() : all!.rows
    const truncNote =
      all && !all.fetchedAll && serverTotal != null
        ? ` · แสดง ${rows.length.toLocaleString()} รายการล่าสุดจากทั้งหมด ${serverTotal.toLocaleString()} (แคบช่วงวันที่เพื่อออกรายงานให้ครบ)`
        : ''
    const images = await mapWithConcurrency(rows, FETCH_CONCURRENCY, (r) => fetchImageAsDataUrl(r.image_path))
    await exportReportPdf({
      filenameBase: 'Crosswalk_Violations_Report',
      title: 'รายงานการฝ่าฝืนสัญญาณไฟทางข้าม (Crosswalk Violations)',
      subtitleNote: exportNote + truncNote,
      blocks: [
        {
          type: 'entries',
          title: 'ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม',
          items: rows.map((r, i) => {
            const { date, time } = parseViolationTimestamp(r.crosswalk.timestamp)
            return {
              image: images[i],
              heading: r.crosswalk.name_th,
              subheading: time ? `${date} ${time} น.` : date,
              fields: [
                { label: 'กล้อง', value: r.camera.name || '-' },
                { label: 'IP Address', value: r.ip },
              ],
            }
          }),
        },
      ],
    })
  }

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableViolationData filter={filter} onPageChange={handleChildPageChange} />
      case 'GRID':
        return <CCTVViolationData filter={filter} onPageChange={handleChildPageChange} />
      default:
        return null
    }
  }, [displayType, filter, handleChildPageChange])

  return (
    <div>
      <section>
        <FormSearchViolation value={filter} onChange={handleFilterChange} />
      </section>
      <section className='mt-5'>
        <ViolationStatCard filter={filter} />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางข้อมูลการฝ่าฝืนสัญญาณไฟทางข้าม'
          onViewModeChange={handleViewModeChange}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — PDF = photo cards (snapshot ต่อเหตุการณ์), Excel = flat
          table with the same columns as TableViolationData. The modal's scope
          toggle picks between ทั้งหมด (the FULL set matching the active
          filter — every page) and หน้าปัจจุบัน (the active view's visible
          page). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        // ทั้งหมด shows the backend's TRUE range total when the client-side
        // status filter is off (the walked count can be capped far below it);
        // with a status filter only the walked-filtered count is knowable.
        scope={{ totalCount: serverTotal ?? 0, pageCount }}
        onExportPdf={handleExportPdf}
        onExportExcel={async (scope) => {
          const { exportExcel } = await import('@/utils/export/excel')
          // หน้าปัจจุบัน scope: the on-screen table numbers rows continuously
          // across pages (seq = pageStart + i + 1) — offset ลำดับ to match.
          const pageOffset = (viewPage.page - 1) * viewPage.pageSize
          const columns =
            scope === 'page'
              ? VIOLATION_EXPORT_COLUMNS.map((c) =>
                  c.header === 'ลำดับ'
                    ? { ...c, value: (_r: ExportViolationRow, i: number) => pageOffset + i + 1 }
                    : c,
                )
              : VIOLATION_EXPORT_COLUMNS
          const rows =
            scope === 'page'
              ? await fetchMirroredPage()
              : (await fetchAllViolations(EXPORT_MAX_ROWS)).rows
          exportExcel({
            filenameBase: 'Crosswalk_Violations_Report',
            sheetName: 'Crosswalk Violations',
            title: 'รายงานการฝ่าฝืนสัญญาณไฟทางข้าม (Crosswalk Violations)',
            filterNote: exportNote,
            columns,
            rows,
          })
        }}
      />

      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(ViolationSection)
