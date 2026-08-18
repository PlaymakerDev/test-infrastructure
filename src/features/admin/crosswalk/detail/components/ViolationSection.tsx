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
import { useViolationRows } from './sections/violation/useViolationRows'
import { FETCH_CONCURRENCY, fetchViolationPages, mapWithConcurrency } from './sections/violation/fetchViolationPages'
import { useDetailContext } from '../context'
import type { CrosswalkViolationRow } from '@/types/crosswalk/detail-api'

// `BBBB` (Buddhist-Era year) in the export's date-range filter note.
dayjs.extend(buddhistEra)

interface Props { }

// Export columns — SAME columns, SAME order as the on-screen
// TableViolationData, shared by BOTH the Excel sheet and the PDF table
// (2026-08-17: PDF switched from photo cards to a table like every other
// menu — see handleExportPdf). ภาพเหตุการณ์: Excel exports the image URL
// (xlsx can't embed); the PDF overrides this column per-export to embed the
// actual photo (PdfColumn.image). Backend pre-formats `timestamp` as
// "DD/MM/BBBB HH:mm" (Thai BE year) — exported as-is. `width` = Excel
// chars; `widthPct` = PDF column % (sums to 100, date-time ≥13).
// IP comes straight off the row's `camera.camera_ip` (BE added 2026-08) —
// same source as the on-screen table; no sta fallback, a km value under an
// "IP Address" header reads as a bug.
const VIOLATION_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  value: (row: CrosswalkViolationRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 6, value: (_r, i) => i + 1 },
  { header: 'วันที่และเวลา', width: 18, widthPct: 14, value: (r) => r.crosswalk.timestamp || '-' },
  { header: 'ประเภทเหตุการณ์', width: 22, widthPct: 20, value: (r) => r.crosswalk.name_th || '-' },
  { header: 'กล้อง', width: 42, widthPct: 26, value: (r) => r.camera.name || '-' },
  { header: 'ภาพเหตุการณ์', width: 50, widthPct: 22, value: (r) => r.image_path || '-' },
  // IP last — mirrors the on-screen column order (2026-08-17, app-wide rule).
  { header: 'IP Address', width: 16, widthPct: 12, value: (r) => r.camera.camera_ip || '-' },
]

// ── ทั้งหมด-scope fetch policy ────────────────────────────────────────────────
// Page fetching goes through the shared parallel helper (fetchViolationPages —
// the backend caps limit at 100/request and a station's unbounded range can
// hold >100k rows, e.g. สปข.2001 measured at 110,986). The export stops at an
// explicit ceiling, telling the reader (PDF note) when the set was truncated;
// narrowing the date range is the intended way to get a complete document.
/** Excel row ceiling for ทั้งหมด scope. */
const EXPORT_MAX_ROWS = 10_000
/** PDF row ceiling — react-pdf lays the whole document out in memory, so the
 *  PDF cap stays lower than Excel's to keep export time/file size sane. */
const PDF_MAX_ROWS = 1_000

const ViolationSection: React.FC<Props> = () => {
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
   *  page/limit/filter → same rows; cache-shared with the child's query). */
  const fetchMirroredPage = async (): Promise<CrosswalkViolationRow[]> => {
    const { getCrosswalkViolationListAPI } = await import('@/services/routes/CrosswalkService')
    const r = await getCrosswalkViolationListAPI({
      solution_id: id,
      start_date: filter.startDate || undefined,
      end_date: filter.endDate || undefined,
      crosswalk_type: crosswalkType,
      limit: viewPage.pageSize,
      page: viewPage.page,
    })
    return r.data.res_data ?? []
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
  // API and stop at `cap` rows.
  const fetchAllViolations = async (cap: number): Promise<{ rows: CrosswalkViolationRow[]; fetchedAll: boolean }> =>
    fetchViolationPages(
      { solution_id: id, start_date: filter.startDate, end_date: filter.endDate, crosswalk_type: crosswalkType },
      cap,
    )

  /** Export columns for the modal's scope — หน้าปัจจุบัน keeps the on-screen
   *  continuous numbering (seq = pageStart + i + 1) by offsetting ลำดับ. */
  const columnsForScope = (scope?: 'all' | 'page') => {
    if (scope !== 'page') return VIOLATION_EXPORT_COLUMNS
    const pageOffset = (viewPage.page - 1) * viewPage.pageSize
    return VIOLATION_EXPORT_COLUMNS.map((c) =>
      c.header === 'ลำดับ'
        ? { ...c, value: (_r: CrosswalkViolationRow, i: number) => pageOffset + i + 1 }
        : c,
    )
  }

  // PDF = table mirroring the on-screen columns, same as every other menu's
  // นำออกเอกสาร (switched 2026-08-17 from the old photo-card layout). The
  // ภาพเหตุการณ์ column embeds the REAL photo: snapshots are pre-fetched and
  // re-encoded (utils/export/image.ts — react-pdf can't fetch cross-origin/
  // WebP itself); a failed/absent image just renders '-'. `scope` comes from
  // the modal's ทั้งหมด/หน้าปัจจุบัน toggle.
  const handleExportPdf = async (scope?: 'all' | 'page') => {
    const [{ exportTablePdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const all = scope === 'page' ? null : await fetchAllViolations(PDF_MAX_ROWS)
    const rows =
      scope === 'page' ? await fetchMirroredPage() : all!.rows
    const truncNote =
      all && !all.fetchedAll && serverTotal != null
        ? ` · แสดง ${rows.length.toLocaleString()} รายการล่าสุดจากทั้งหมด ${serverTotal.toLocaleString()} (แคบช่วงวันที่เพื่อออกรายงานให้ครบ)`
        : ''
    const images = await mapWithConcurrency(rows, FETCH_CONCURRENCY, (r) => fetchImageAsDataUrl(r.image_path))
    const columns = columnsForScope(scope).map((c) =>
      c.header === 'ภาพเหตุการณ์'
        ? {
            ...c,
            image: (_r: CrosswalkViolationRow, i: number) => images[i]?.dataUrl ?? null,
            value: () => '-',
          }
        : c,
    )
    await exportTablePdf({
      filenameBase: 'Crosswalk_Violations_Report',
      title: 'รายงานการฝ่าฝืนสัญญาณไฟทางข้าม (Crosswalk Violations)',
      filterNote: exportNote + truncNote,
      columns,
      rows,
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

      {/* นำออกเอกสาร — PDF + Excel are both flat tables with the same columns
          as TableViolationData. The modal's scope toggle picks between ทั้งหมด
          (the FULL set matching the active filter — every page) and
          หน้าปัจจุบัน (the active view's visible page). */}
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
          const rows =
            scope === 'page'
              ? await fetchMirroredPage()
              : (await fetchAllViolations(EXPORT_MAX_ROWS)).rows
          exportExcel({
            filenameBase: 'Crosswalk_Violations_Report',
            sheetName: 'Crosswalk Violations',
            title: 'รายงานการฝ่าฝืนสัญญาณไฟทางข้าม (Crosswalk Violations)',
            filterNote: exportNote,
            columns: columnsForScope(scope),
            rows,
          })
        }}
      />

      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(ViolationSection)
