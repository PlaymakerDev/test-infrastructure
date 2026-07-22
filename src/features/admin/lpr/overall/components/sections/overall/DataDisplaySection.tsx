"use client"
import React, { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'
import { TableLPRData, LPRList, FormSearchLPR } from '../../../components'
import type { LPRRow } from '../../../data/lprRows'
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDepartments } from '@/hooks/queries/manage'
import { useDeptId } from '@/hooks/useDeptId'

dayjs.extend(buddhistEra)

interface Props {
  deptId?: string | string[] | number
}

// Same chip palette as the sibling menus (cctv / incident-detection):
// ทั้งหมด yellow, Active blue (parallel to ออนไลน์), Idle gray (parallel to
// หมดค้ำ). LPR points carry no online/warranty fields — Active/Idle keys off
// events_hour, the same signal the grid pills + KPI cards already use.
const LPR_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'active',
    label: 'Active',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'idle',
    label: 'Idle',
    colorPrimary: '#979797',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#4a4a4a] text-white',
    badgeIdleClass: 'bg-[#979797]/20 text-[#979797]',
  },
]

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table, plus ลำดับ/หน่วยงาน since the export flattens
// the per-แขวง divider rows (mirrors CCTV_EXPORT_COLUMNS). `width` = Excel
// chars, `widthPct` = PDF table percent (sums to 100).
const LPR_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: LPRRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 9, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.road_code || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 17, align: 'left', value: (r) => r.project_name || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 17, align: 'left', value: (r) => r.solution_name || '-' },
  { header: 'เลขที่สัญญา', width: 20, widthPct: 11, value: (r) => r.contract_no || '-' },
  { header: 'กล้อง', width: 9, widthPct: 5, value: (r) => r.camera_count },
  { header: 'ตรวจจับวันนี้', width: 12, widthPct: 7, value: (r) => r.events_today },
  { header: 'ชั่วโมงล่าสุด', width: 12, widthPct: 7, value: (r) => r.events_hour },
  {
    header: 'ตรวจจับล่าสุด',
    width: 18,
    widthPct: 13,
    value: (r) =>
      r.latest_captured_at
        ? dayjs(r.latest_captured_at).format('DD/MM/BBBB HH:mm')
        : '-',
  },
]

/** Filter bar + table/grid for LPR install-points — same SearchBar wiring as
 *  cctv/incident-detection (chips + debounced search + นำออกเอกสาร + view
 *  toggle). Owns the data: joins bureau names, filters, and hands the same
 *  filtered rows to the table, the grid, and both export formats. */
const DataDisplaySection: React.FC<Props> = ({ deptId: deptIdProp }) => {
  const deptIdFromUrl = useDeptId()
  const deptId = String(deptIdProp ?? deptIdFromUrl ?? '0')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [exportOpen, setExportOpen] = useState(false)

  const { data: points, isLoading } = useLPRPoints()
  const { data: departments } = useDepartments()

  const deptNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of departments ?? []) m.set(d.id, d.department_short_name)
    return m
  }, [departments])

  // Scope by dept, join the แขวง short name, and pre-sort into the table's
  // display order (bureau → road code) so the table's rowSpan merge, the grid,
  // and the export all read the same sequence.
  const allRows = useMemo<LPRRow[]>(() => {
    const all = points ?? []
    const scoped = !deptId || deptId === '0'
      ? all
      : all.filter((p) => p.department_id === Number(deptId))
    return scoped
      .map((p) => ({
        ...p,
        bureau:
          (p.department_id != null ? deptNameById.get(p.department_id) : undefined) ??
          'อื่นๆ',
      }))
      .sort(
        (a, b) =>
          a.bureau.localeCompare(b.bureau, 'th') ||
          (a.road_code ?? '').localeCompare(b.road_code ?? '', 'th'),
      )
  }, [points, deptId, deptNameById])

  const stats: FilterStats = useMemo(
    () => ({
      all: allRows.length,
      active: allRows.filter((r) => r.events_hour > 0).length,
      idle: allRows.filter((r) => r.events_hour === 0).length,
    }),
    [allRows],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allRows.filter((r) => {
      switch (activeFilter) {
        case 'active': if (r.events_hour === 0) return false; break
        case 'idle': if (r.events_hour > 0) return false; break
      }
      if (term) {
        const hay = `${r.bureau} ${r.road_code ?? ''} ${r.project_name ?? ''} ${r.solution_name} ${r.contract_no ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [allRows, activeFilter, search])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = LPR_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  return (
    <div>
      <section>
        <SearchBar
          filters={LPR_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchLPR onSearch={(v) => setSearch(v.search)} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
          shows), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filtered.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'LPR_Overview_Report',
            title: 'รายงานสรุปภาพรวมจุดติดตั้ง LPR (LPR Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(LPR_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: filtered,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'LPR_Overview_Report',
            sheetName: 'LPR Overview',
            columns: hideProjectNameColumns(LPR_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: filtered,
          })
        }}
      />

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableLPRData rows={filtered} loading={isLoading} />
        ) : (
          <LPRList points={filtered} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
