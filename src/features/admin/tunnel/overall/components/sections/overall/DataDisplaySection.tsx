"use client"
import React, { useCallback, useMemo, useState } from 'react'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import FormSearchTunnel from './FormSearchTunnel'
import TableTunnelData from './TableTunnelData'
import ModalTunnelViewer, {
  type TunnelViewerTarget,
} from './ModalTunnelViewer'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import ExportFileModal from '@/components/export/ExportFileModal'
import { hideProjectNameColumns } from '@/constants/featureFlags'
import { groupByBureau } from '@/features/admin/traffic-volume/shared/utils/groupByBureau'
import { useTunnelCentralList } from '@/hooks/queries/tunnel'
import { useDeptId } from '@/hooks/useDeptId'
import type { TunnelProject } from '@/features/admin/tunnel/overall/data/tunnel'
import type { TunnelCentralSolution } from '@/types/tunnel/overview-api'

interface Props { }

const TUNNEL_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'online',
    label: 'ออนไลน์',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'offline',
    label: 'ออฟไลน์',
    colorPrimary: '#E94C4C',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
  {
    key: 'in-warranty',
    label: 'ในค้ำ',
    statKey: 'inWarranty',
    colorPrimary: '#05F2DB',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#016f64] text-white',
    badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]',
  },
  {
    key: 'expired',
    label: 'หมดค้ำ',
    colorPrimary: '#979797',
    colorTextLightSolid: '#212121',
    badgeActiveClass: 'bg-[#4a4a4a] text-white',
    badgeIdleClass: 'bg-[#979797]/20 text-[#979797]',
  },
]

/** Adapter: `/overview/central/list` solution row → UI `TunnelProject`.
 *  Bureau is filled by the caller because it lives one level up in the
 *  nested response. Connection status comes from `tunnel.is_online` (the
 *  อุโมงค์ device health), NOT from the camera's online state.
 *
 *  The endpoint returns `tunnel.camera_count` / `tunnel.lighting_count`;
 *  per-camera online/offline breakdowns are not part of this contract, so
 *  the UI's `onlineCount` / `offlineCount` are left as 0. */
const apiSolutionToProject = (
  item: TunnelCentralSolution,
  bureau: string,
): TunnelProject => {
  const solution = item?.solution
  const project = item?.project
  const road = item?.road
  const tunnel = item?.tunnel
  return {
    id: solution?.id != null ? String(solution.id) : '',
    projectId: project?.id != null ? String(project.id) : undefined,
    roadId: road?.id != null ? String(road.id) : undefined,
    roadCode: road?.code_name ?? '',
    projectName: project?.project_name,
    installPoint: solution?.solution_name ?? '',
    contractNo: project?.contract_no ?? '',
    budgetYear: project?.budget_year,
    warranty: item?.is_warranty ? 'in-warranty' : 'expired',
    connection: tunnel?.is_online ? 'online' : 'offline',
    bureau,
    totalCameras: tunnel?.camera_count ?? 0,
    onlineCount: 0,
    offlineCount: 0,
    totalLighting: tunnel?.lighting_count ?? 0,
    tunnelUrl: item?.tunnel_url,
  }
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen TableTunnelData (รหัสสายทาง → ชื่อโครงการ →
// จุดติดตั้ง → เลขที่สัญญา → การค้ำประกัน → สถานะ → กล้องทั้งหมด →
// ไฟส่องสว่าง), plus ลำดับ/หน่วยงาน since the export flattens the table's
// per-สำนัก divider rows (same treatment as CCTV_EXPORT_COLUMNS in
// cctv/overall). `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
const TUNNEL_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: TunnelProject, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 10, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.roadCode || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 18, align: 'left', value: (r) => r.projectName || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 18, align: 'left', value: (r) => r.installPoint || '-' },
  // Mirrors ContractInfoCell's visible label: contract no → ปีงบประมาณ → '-'.
  {
    header: 'เลขที่สัญญา', width: 20, widthPct: 12,
    value: (r) => (r.contractNo.trim() ? r.contractNo : r.budgetYear ? `ปีงบประมาณ ${r.budgetYear}` : '-'),
  },
  { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => (r.warranty === 'in-warranty' ? 'ในค้ำ' : 'หมดค้ำ') },
  { header: 'สถานะ', width: 12, widthPct: 6, value: (r) => (r.connection === 'online' ? 'ออนไลน์' : 'ออฟไลน์') },
  { header: 'กล้องทั้งหมด', width: 12, widthPct: 7, value: (r) => r.totalCameras },
  { header: 'ไฟส่องสว่าง', width: 12, widthPct: 7, value: (r) => r.totalLighting },
]

const OverallDataDisplaySection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)
  // Modal state is local — the viewer is only ever shown from this section,
  // so hoisting to Context would add noise without any real reuse.
  const [viewerTarget, setViewerTarget] = useState<TunnelViewerTarget | null>(
    null,
  )

  const { data, isLoading } = useTunnelCentralList(deptId)

  const handleOpenTunnel = useCallback((p: TunnelProject) => {
    if (!p.tunnelUrl) return
    setViewerTarget({
      url: p.tunnelUrl,
      title: p.installPoint || p.projectName || p.roadCode || '-',
      subtitle: p.roadCode,
    })
  }, [])

  const handleCloseViewer = useCallback(() => setViewerTarget(null), [])

  // Flatten bureau → sub-dept → solutions, tagging each row with its
  // sub-dept short name so the table groups by bureau out of the box.
  // Defensive across every level — guard against partial responses.
  const projects: TunnelProject[] = useMemo(() => {
    const out: TunnelProject[] = []
    const rootList = Array.isArray(data) ? data : []
    for (const bureau of rootList) {
      const subDepts = Array.isArray(bureau?.sub_department) ? bureau.sub_department : []
      for (const subDept of subDepts) {
        const sols = Array.isArray(subDept?.solutions) ? subDept.solutions : []
        for (const sol of sols) {
          if (!sol) continue
          out.push(apiSolutionToProject(sol, subDept.department_short_name ?? ''))
        }
      }
    }
    return out
  }, [data])

  const stats: FilterStats = useMemo(
    () => ({
      all: projects.length,
      online: projects.filter((p) => p.connection === 'online').length,
      offline: projects.filter((p) => p.connection === 'offline').length,
      inWarranty: projects.filter((p) => p.warranty === 'in-warranty').length,
      expired: projects.filter((p) => p.warranty === 'expired').length,
    }),
    [projects],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter((p) => {
      switch (activeFilter) {
        case 'online': if (p.connection !== 'online') return false; break
        case 'offline': if (p.connection !== 'offline') return false; break
        case 'in-warranty': if (p.warranty !== 'in-warranty') return false; break
        case 'expired': if (p.warranty !== 'expired') return false; break
        case 'all': break
      }
      if (term) {
        const haystack = `${p.roadCode} ${p.projectName ?? ''} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [activeFilter, search, projects])

  // Export rows in the SAME order the table displays: run the filtered list
  // through the same groupByBureau helper TableTunnelData renders from, then
  // keep only the project rows — exports exactly the filtered rows on screen.
  const exportRows = useMemo<TunnelProject[]>(
    () => groupByBureau(filtered).flatMap((r) => (r.kind === 'project' ? [r.project] : [])),
    [filtered],
  )

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = TUNNEL_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (search.trim()) parts.push(`ค้นหา "${search.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, search])

  const cardItems = useMemo<ProjectCardItem[]>(
    () =>
      filtered.map((p) => ({
        key: p.id,
        roadId: Number(p.roadId),
        projectId: p.projectId,
        roadCode: p.roadCode,
        projectName: p.projectName ?? '-',
        installPoint: p.installPoint,
        contractNo: p.contractNo,
        budgetYear: p.budgetYear,
        isWarranty: p.warranty === 'in-warranty',
        bureau: p.bureau,
        total: p.totalCameras,
        online: p.onlineCount,
        offline: p.offlineCount,
        onDetail: () => handleOpenTunnel(p),
      })),
    [filtered, handleOpenTunnel],
  )

  return (
    <div>
      <section>
        <SearchBar
          filters={TUNNEL_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          formSearch={<FormSearchTunnel onSearchChange={setSearch} />}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
          shows), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Tunnel_Overview_Report',
            title: 'รายงานสรุปภาพรวมอุโมงค์ (Tunnel Overview)',
            filterNote: exportFilterNote,
            columns: hideProjectNameColumns(TUNNEL_EXPORT_COLUMNS).map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Tunnel_Overview_Report',
            sheetName: 'Tunnel Overview',
            columns: hideProjectNameColumns(TUNNEL_EXPORT_COLUMNS).map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-5'>
        {viewMode === 'TABLE' ? (
          <TableTunnelData
            projects={filtered}
            loading={isLoading}
            onOpenTunnel={handleOpenTunnel}
          />
        ) : (
          <ProjectCardGrid items={cardItems} totalLabel='กล้องทั้งหมด' />
        )}
      </section>

      <ModalTunnelViewer
        open={viewerTarget !== null}
        target={viewerTarget}
        onClose={handleCloseViewer}
      />
    </div>
  )
}

export default React.memo<Props>(OverallDataDisplaySection)
