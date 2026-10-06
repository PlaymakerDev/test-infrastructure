import React, { useCallback, useMemo, useState } from 'react'
import { FormSearchDetection, GridDetectionData, TableDetectionData } from '../components'
import type { DetectionSearchParams } from './sections/detection/FormSearchDetection'
import { getLPRPlateListAPI } from '@/services/routes/NewLPRService'
import { useLPRDetailContext } from '../context'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import ExportFileModal from '@/components/export/ExportFileModal'
import { APIRequestLPRPlateList, LPRPlateData } from '@/types/lpr/new-lpr-api'

// `BBBB` (Buddhist-Era year) in the export filter note.
dayjs.extend(buddhistEra)

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

// ── นำออกเอกสาร ──────────────────────────────────────────────────────────────
// Export columns — SAME headers, SAME order, SAME format expressions as the
// on-screen TableDetectionData, shared by Excel and PDF. ภาพป้ายทะเบียน: Excel
// exports the image URL (xlsx can't embed); the PDF overrides this column
// per-export to embed the real crop. `width` = Excel chars; `widthPct` = PDF
// column % (sums to 100, date-time ≥13).
const EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  value: (row: LPRPlateData, index: number) => string | number
}[] = [
  { header: 'วันที่และเวลา', width: 22, widthPct: 15, value: (r) => r.captured_at_display || '-' },
  { header: 'ป้ายทะเบียน', width: 14, widthPct: 10, value: (r) => r.plate_number || '-' },
  { header: 'จังหวัด', width: 16, widthPct: 10, value: (r) => r.plate_province || '-' },
  { header: 'ประเภทรถ', width: 16, widthPct: 10, value: (r) => r.vehicle_type_name || 'ไม่ระบุ' },
  {
    header: 'Confidence',
    width: 12,
    widthPct: 9,
    value: (r) => (r.confidence == null || Number.isNaN(Number(r.confidence)) ? '-' : `${Number(r.confidence).toFixed(1)}%`),
  },
  { header: 'ชื่อกล้อง', width: 42, widthPct: 20, value: (r) => r.camera_name || '-' },
  { header: 'IP Address', width: 16, widthPct: 11, value: (r) => r.camera_ip || '-' },
  { header: 'ภาพป้ายทะเบียน', width: 50, widthPct: 15, value: (r) => r.plate_image || '-' },
]

// ทั้งหมด-scope policy: pages are walked at 100 rows/request (a fixed batch, so
// it never depends on whether the backend caps `limit`) up to an explicit
// ceiling, and the report notes the truncation. A busy point logs thousands of
// plates per week; narrowing the date range is the way to a complete document.
const EXPORT_PAGE_SIZE = 100
/** Excel row ceiling for ทั้งหมด scope. */
const EXCEL_MAX_ROWS = 5_000
/** PDF row ceiling — react-pdf lays the whole document out in memory and the
 *  plate crops are embedded per row, so the PDF cap stays far lower. */
const PDF_MAX_ROWS = 1_000
/** Parallel page requests while collecting ทั้งหมด. */
const PAGE_FETCH_CONCURRENCY = 5
/** Parallel image prefetches for the PDF's plate-crop column. */
const IMAGE_FETCH_CONCURRENCY = 8

/** Run `fn` over `items` keeping at most `limit` promises in flight,
 *  preserving order. */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  const out = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return out
}

interface Props {

}

const NewDetectionSection: React.FC<Props> = (props) => {
  const { } = props
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE')
  const { solutionId } = useLPRDetailContext()

  const [params, setParams] = useState<APIRequestLPRPlateList>({ page: DEFAULT_PAGE, limit: DEFAULT_LIMIT })

  // keepPreviousData: keep the current rows on screen while the next page / filter loads
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['lpr-plate-list', solutionId, params],
    queryFn: () => getLPRPlateListAPI(solutionId, params),
    enabled: !!solutionId,
    placeholderData: keepPreviousData,
  })

  // a new filter always starts from page 1; explicit undefined clears a previous filter
  const handleSearch = useCallback((filters: DetectionSearchParams) => {
    setParams((prev) => ({ ...prev, ...filters, page: DEFAULT_PAGE }))
  }, [])

  const handlePageChange = useCallback((page: number, limit: number) => {
    setParams((prev) => ({ ...prev, page, limit }))
  }, [])

  const page = params.page ?? DEFAULT_PAGE
  const limit = params.limit ?? DEFAULT_LIMIT

  const [exportOpen, setExportOpen] = useState(false)
  const handleOpenExport = useCallback(() => setExportOpen(true), [])

  const pageRows = data?.data?.res_data ?? []
  const totalCount = data?.data?.meta_data?.count ?? 0

  // Human-readable note of the active filters — printed in the export header.
  // No dates in `params` = the backend default (today), so say so explicitly.
  const exportNote = useMemo(() => {
    const parts: string[] = [
      params.start_date && params.end_date
        ? `ช่วงวันที่ ${dayjs(params.start_date).format('DD/MM/BBBB')} - ${dayjs(params.end_date).format('DD/MM/BBBB')}`
        : `ช่วงวันที่ ${dayjs().format('DD/MM/BBBB')} (วันนี้)`,
    ]
    if (params.vehicle_type) parts.push(`ประเภทรถ ${params.vehicle_type}`)
    if (params.search) parts.push(`ค้นหา "${params.search}"`)
    return parts.join(' · ')
  }, [params.start_date, params.end_date, params.vehicle_type, params.search])

  // ทั้งหมด scope — every plate matching the ACTIVE filters (not just the
  // visible page), fetched 100/request: page 1 first for the total, then the
  // remaining pages with bounded parallelism, capped at `cap` rows.
  const fetchAllPlates = async (cap: number): Promise<{ rows: LPRPlateData[]; truncated: boolean }> => {
    const base = {
      search: params.search,
      vehicle_type: params.vehicle_type,
      start_date: params.start_date,
      end_date: params.end_date,
      limit: EXPORT_PAGE_SIZE,
    }
    const first = await getLPRPlateListAPI(solutionId, { ...base, page: 1 })
    const total = first.data?.meta_data?.count ?? 0
    const lastPage = Math.min(Math.ceil(total / EXPORT_PAGE_SIZE), Math.ceil(cap / EXPORT_PAGE_SIZE))
    const rest = await mapWithConcurrency(
      Array.from({ length: Math.max(lastPage - 1, 0) }, (_, i) => i + 2),
      PAGE_FETCH_CONCURRENCY,
      async (p) => (await getLPRPlateListAPI(solutionId, { ...base, page: p })).data?.res_data ?? [],
    )
    const all = [...(first.data?.res_data ?? []), ...rest.flat()]
    return { rows: all.slice(0, cap), truncated: total > cap }
  }

  const truncatedNote = (shown: number) =>
    ` · แสดง ${shown.toLocaleString()} รายการล่าสุด (เกินจำนวนสูงสุดต่อรายงาน — แคบช่วงวันที่เพื่อออกรายงานให้ครบ)`

  // PDF = table mirroring the on-screen columns; ภาพป้ายทะเบียน embeds the REAL
  // plate crop (pre-fetched + re-encoded via utils/export/image.ts — react-pdf
  // can't fetch cross-origin itself); a failed/absent image renders '-'.
  const handleExportPdf = async (scope?: 'all' | 'page') => {
    const [{ exportTablePdf }, { fetchImageAsDataUrl }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/image'),
    ])
    const all = scope === 'page' ? null : await fetchAllPlates(PDF_MAX_ROWS)
    const rows = all ? all.rows : pageRows
    const images = await mapWithConcurrency(rows, IMAGE_FETCH_CONCURRENCY, (r) =>
      fetchImageAsDataUrl(r.plate_image ?? ''),
    )
    const columns = EXPORT_COLUMNS.map((c) =>
      c.header === 'ภาพป้ายทะเบียน'
        ? { ...c, image: (_r: LPRPlateData, i: number) => images[i]?.dataUrl ?? null, value: () => '-' }
        : c,
    )
    await exportTablePdf({
      filenameBase: 'LPR_Detections_Report',
      title: 'รายงานรายการตรวจจับป้ายทะเบียน (LPR Detections)',
      filterNote: exportNote + (all?.truncated ? truncatedNote(rows.length) : ''),
      columns,
      rows,
    })
  }

  const handleExportExcel = async (scope?: 'all' | 'page') => {
    const { exportExcel } = await import('@/utils/export/excel')
    const all = scope === 'page' ? null : await fetchAllPlates(EXCEL_MAX_ROWS)
    const rows = all ? all.rows : pageRows
    exportExcel({
      filenameBase: 'LPR_Detections_Report',
      sheetName: 'LPR Detections',
      title: 'รายงานรายการตรวจจับป้ายทะเบียน (LPR Detections)',
      filterNote: exportNote + (all?.truncated ? truncatedNote(rows.length) : ''),
      columns: EXPORT_COLUMNS,
      rows,
    })
  }

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case 'TABLE':
        return (
          <TableDetectionData
            data={data?.data}
            isLoading={isFetching}
            isError={isError}
            page={page}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )
      case 'GRID':
        return (
          <GridDetectionData
            data={data?.data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            limit={limit}
            onPageChange={handlePageChange}
          />
        )
      default:
        return null
    }
  }, [viewMode, data, isLoading, isFetching, isError, page, limit, handlePageChange])

  const renderLoadingContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
    return renderContent
  }, [isLoading, isError, renderContent])

  return (
    <div>
      <h3 className='text-(--yellow) font-normal!'>ตารางตรวจจับป้ายทะเบียน</h3>
      <section className='mt-5'>
        <FormSearchDetection
          viewMode={viewMode}
          setViewMode={setViewMode}
          onSearch={handleSearch}
          onExport={handleOpenExport}
        />
      </section>
      {/* นำออกเอกสาร — PDF + Excel are flat tables with the same columns as
          TableDetectionData. The scope toggle picks between ทั้งหมด (every
          plate matching the filters, fetched in full at export time) and
          หน้าปัจจุบัน (the rows on screen). */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        scope={{ totalCount, pageCount: pageRows.length }}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportExcel}
      />
      <section className='mt-5'>
        {renderLoadingContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(NewDetectionSection)
