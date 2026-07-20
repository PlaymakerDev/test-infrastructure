"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Input, Spin } from 'antd'
import { TbSearch } from 'react-icons/tb'
import { TableTrafficLighting, MapTrafficLighting } from '../components'
import { useOverallContext } from '../context'
import DiagramIframe from '@/features/admin/traffic-lighting/shared/DiagramIframe'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import ProjectCardGrid, { type ProjectCardItem } from '@/components/table/ProjectCardGrid'
import ExportFileModal from '@/components/export/ExportFileModal'
import type { TrafficLightingProject } from '../data/trafficLightingProjects'
import {
  buildLightingDetailUrl,
  resolveLightingImei,
} from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'

// Same 5 filters/colors as the old static summaryStats badges — now wired to
// actually filter the list (they never did before), matching the shared
// SearchBar pattern every other overall page (crosswalk, cctv, etc.) already uses.
const TRAFFIC_LIGHTING_FILTERS: FilterConfig[] = [
  { key: 'all', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'online', label: 'ออนไลน์', colorPrimary: '#66AEFF', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'offline', label: 'ออฟไลน์', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'in-warranty', label: 'ในค้ำ', colorPrimary: '#05F2DB', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#016f64] text-white', badgeIdleClass: 'bg-[#05F2DB]/20 text-[#05F2DB]' },
  { key: 'expired', label: 'หมดค้ำ', colorPrimary: '#979797', colorTextLightSolid: '#212121', badgeActiveClass: 'bg-[#4a4a4a] text-white', badgeIdleClass: 'bg-[#979797]/20 text-[#979797]' },
]

// Text-only twins of TableTrafficLighting's pill labels (warranty/connection +
// LINE_STATUS_LABELS/CIRCUIT_STATUS_LABELS) — the export needs the same
// visible text, minus colors/icons.
const EXPORT_WARRANTY_TEXT: Record<TrafficLightingProject['warranty'], string> = {
  'in-warranty': 'ในค้ำ',
  expired: 'หมดค้ำ',
  unknown: '-',
}
const EXPORT_CONNECTION_TEXT: Record<TrafficLightingProject['connection'], string> = {
  online: 'ออนไลน์',
  offline: 'ออฟไลน์',
  unknown: '-',
}
// lineStatus and circuitStatus share the same normal/abnormal/unknown union
// and the same on-screen texts (they differ only in pill color).
const EXPORT_LINE_CIRCUIT_TEXT: Record<TrafficLightingProject['lineStatus'], string> = {
  normal: 'ปกติ',
  abnormal: 'ผิดปกติ',
  unknown: '-',
}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen TableTrafficLighting (รหัสสายทาง → ชื่อโครงการ →
// เลขที่สัญญา → การค้ำประกัน → จุดติดตั้ง → Phase → สถานะการเชื่อมต่อ →
// สถานะสาย → สถานะวงจร), plus ลำดับ/หน่วยงาน since the export flattens the
// table's per-สำนัก divider rows (same treatment as CCTV_EXPORT_COLUMNS in
// cctv/overall). `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
const LIGHTING_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: TrafficLightingProject, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'หน่วยงาน', width: 16, widthPct: 10, value: (r) => r.bureau || '-' },
  { header: 'รหัสสายทาง', width: 13, widthPct: 9, value: (r) => r.roadCode || '-' },
  { header: 'ชื่อโครงการ', width: 34, widthPct: 17, align: 'left', value: (r) => r.projectName || '-' },
  { header: 'เลขที่สัญญา', width: 20, widthPct: 11, value: (r) => r.contractNo || '-' },
  { header: 'การค้ำประกัน', width: 13, widthPct: 8, value: (r) => EXPORT_WARRANTY_TEXT[r.warranty] },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 15, align: 'left', value: (r) => r.installPoint || '-' },
  { header: 'Phase', width: 8, widthPct: 5, value: (r) => r.phase ?? '-' },
  { header: 'สถานะการเชื่อมต่อ', width: 16, widthPct: 8, value: (r) => EXPORT_CONNECTION_TEXT[r.connection] },
  { header: 'สถานะสาย', width: 10, widthPct: 6, value: (r) => EXPORT_LINE_CIRCUIT_TEXT[r.lineStatus] },
  { header: 'สถานะวงจร', width: 10, widthPct: 6, value: (r) => EXPORT_LINE_CIRCUIT_TEXT[r.circuitStatus] },
]

const OverallSection: React.FC = () => {
  const router = useRouter()
  const {
    deptId,
    searchQuery,
    setSearchQuery,
    centralListLoaded,
    centralListError,
    retryCentralList,
    statCards,
    summaryStats,
    filteredProjects,
    leftPanelItems,
    phaseLabel,
    phaseSubLabel,
    phaseMetrics,
    leftBottomCards,
    diagramImei,
  } = useOverallContext()
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  // summaryStats already carries the live totals (from a separate totals
  // endpoint, unaffected by the search box) — reshape into SearchBar's
  // {key: value} stats lookup instead of refetching anything new.
  const filterStats: FilterStats = useMemo(() => {
    const byLabel = new Map(summaryStats.map((s) => [s.label, s.value]))
    return {
      all: byLabel.get('ทั้งหมด'),
      online: byLabel.get('ออนไลน์'),
      offline: byLabel.get('ออฟไลน์'),
      'in-warranty': byLabel.get('ในค้ำ'),
      expired: byLabel.get('หมดค้ำ'),
    }
  }, [summaryStats])

  // filteredProjects (context) is already search-filtered; apply the status
  // filter on top, same as crosswalk's OverallDataDisplaySection.
  const displayedProjects = useMemo(() => {
    switch (activeFilter) {
      case 'online': return filteredProjects.filter((p) => p.connection === 'online')
      case 'offline': return filteredProjects.filter((p) => p.connection === 'offline')
      case 'in-warranty': return filteredProjects.filter((p) => p.warranty === 'in-warranty')
      case 'expired': return filteredProjects.filter((p) => p.warranty === 'expired')
      default: return filteredProjects
    }
  }, [filteredProjects, activeFilter])

  // Export rows in the SAME order the table displays: grouped by สำนัก
  // (bureau) — mirrors TableTrafficLighting's grouping so the printed report
  // reads exactly like the screen. Exports the CURRENTLY FILTERED rows.
  const exportRows = useMemo(() => {
    const groups = new Map<string, TrafficLightingProject[]>()
    for (const p of displayedProjects) {
      const list = groups.get(p.bureau) ?? []
      list.push(p)
      groups.set(p.bureau, list)
    }
    return [...groups.values()].flat()
  }, [displayedProjects])

  // Human-readable note of the active filter/search — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts: string[] = []
    const filterLabel = TRAFFIC_LIGHTING_FILTERS.find((f) => f.key === activeFilter)?.label
    if (activeFilter !== 'all' && filterLabel) parts.push(`สถานะ ${filterLabel}`)
    if (searchQuery.trim()) parts.push(`ค้นหา "${searchQuery.trim()}"`)
    return parts.length ? parts.join(' · ') : undefined
  }, [activeFilter, searchQuery])

  // Same navigation as TableTrafficLighting's onRow. URL params make the
  // detail route portable; tab-local context only enriches its header.
  const goToDetail = useCallback((project: TrafficLightingProject) => {
    const type = project.equipment.type ?? ''
    const imei = resolveLightingImei(project.id, project.imei)
    router.push(buildLightingDetailUrl({
      routeId: project.id,
      imei,
      type,
      deptId,
    }))
  }, [router, deptId])

  const cardItems = useMemo<ProjectCardItem[]>(
    () => displayedProjects.map((p) => ({
      key: p.id,
      roadId: p.roadId ?? 0,
      projectId: p.projectId,
      roadCode: p.roadCode,
      projectName: p.projectName,
      installPoint: p.installPoint,
      contractNo: p.contractNo,
      budgetYear: p.budgetYear,
      isWarranty: p.warranty === 'in-warranty',
      bureau: p.bureau,
      // The central endpoint exposes connectivity per installation, not per
      // individual lamp/controller. Keep all three counters in that unit.
      total: 1,
      online: p.connection === 'online' ? 1 : 0,
      offline: p.connection === 'offline' ? 1 : 0,
      onDetail: () => goToDetail(p),
    })),
    [displayedProjects, goToDetail],
  )

  return (
    <>
      <section className='mt-4 relative flex flex-col gap-3 md:min-h-[760px]'>
        <div className='w-full md:absolute md:top-0 md:left-0 md:z-10 md:w-[280px] lg:w-[340px] xl:w-[400px] h-auto min-h-[280px] sm:min-h-[320px] md:h-[760px] md:min-h-0 md:max-h-[760px] md:overflow-y-auto rounded-[20px] bg-[#2B2B2B] p-3 sm:p-4 flex flex-col overflow-hidden'>
          <div className='flex flex-col gap-3 shrink-0'>
            {leftPanelItems.map((item) => (
              <div key={item.id} className='flex flex-col gap-1 min-w-0 flex-1'>
                <div className='flex flex-row items-center gap-0.5'>
                  <p className='text-[12px] font-normal m-0 shrink-0' style={{ color: '#66AEFF' }}>{item.cabinet}</p>
                </div>
                <div className='flex flex-row items-center gap-2 justify-between'>
                  <p className='text-[12px] font-normal m-0 shrink-0' style={{ color: '#979797' }}>IMEI : {item.imei}</p>
                  <button
                    type='button'
                    disabled={!item.imei || item.imei === '-'}
                    className='shrink-0 flex items-center justify-center border-0 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 p-0 text-[12px] font-normal text-white leading-none'
                    style={{ width: 80, height: 27, borderRadius: 88, background: '#212121' }}
                    onClick={() => {
                      const equipType = item.equipmentType || ''
                      router.push(buildLightingDetailUrl({
                        routeId: item.imei,
                        imei: item.imei,
                        type: equipType,
                        deptId,
                      }))
                    }}
                  >
                    ดูเพิ่มเติม
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-3 flex-1 min-h-0 w-full min-w-0 flex flex-col overflow-hidden'>
            {diagramImei && (
              <div className='shrink-0 min-h-[180px] sm:min-h-[210px] w-full min-w-0 flex items-center justify-center'>
                <DiagramIframe
                  imei={diagramImei}
                  minHeight={180}
                  className='h-full max-h-[210px] sm:max-h-[250px] md:max-h-[220px] lg:max-h-[280px] xl:max-h-[340px]'
                />
              </div>
            )}
            <div className='flex-1 min-h-0 flex flex-col gap-2 w-full min-w-0'>
              <div
                className='flex-1 min-h-[200px] rounded-[20px] w-full min-w-0 p-3 sm:p-4 flex flex-col'
                style={{ background: '#191919CC' }}
              >
                <div className='flex flex-row items-start gap-2 shrink-0'>
                  <img src='/atlas/images/Lighting/icelt1.png' alt='' width={40} height={40} className='shrink-0 w-8 h-8 sm:w-10 sm:h-10' />
                  <p className='text-[14px] sm:text-[16px] font-bold m-0 text-white'>ระบบไฟฟ้า</p>
                </div>
                <div className='flex-1 flex flex-col items-center justify-center text-center py-2 sm:py-3 min-h-[56px]'>
                  <p className='text-[22px] sm:text-[28px] lg:text-[30px] xl:text-[32px] font-bold m-0 text-white leading-none'>{phaseLabel}</p>
                  <p className='text-[11px] sm:text-[13px] xl:text-[14px] font-normal m-0 mt-1' style={{ color: '#66AEFF' }}>{phaseSubLabel}</p>
                </div>
                <div className='grid grid-cols-5 gap-1.5 sm:gap-2 w-full min-w-0 shrink-0 mt-auto'>
                  {phaseMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className='flex flex-col items-center justify-center rounded-[10px] w-full min-w-0 min-h-[56px] sm:min-h-[60px] xl:min-h-[64px] px-1 py-1.5'
                      style={{ background: '#191919', border: '1px solid #66AEFF' }}
                    >
                      <span className='text-[10px] sm:text-[11px] font-normal m-0 leading-none' style={{ color: '#66AEFF' }}>{metric.label}</span>
                      <span className='text-[10px] sm:text-[12px] xl:text-[11px] font-bold m-0 mt-1 text-white tabular-nums leading-tight text-center w-full'>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className='flex flex-col gap-2 shrink-0'>
                {leftBottomCards.map((card) => (
                  <div
                    key={card.border}
                    className='w-full min-w-0 min-h-[72px] sm:min-h-[80px] xl:min-h-[96px] rounded-[16px] sm:rounded-[20px] px-2 sm:px-3 py-2 sm:py-3 flex flex-row items-center'
                    style={{ background: '#66AEFF1A', border: `2px solid ${card.border}` }}
                  >
                    <img src={card.icon} alt='' width={30} height={30} className='shrink-0 w-7 h-7 sm:w-[30px] sm:h-[30px] ml-1 sm:ml-2' />
                    <div className='flex flex-col min-w-0 flex-1 pl-2 sm:pl-3'>
                      <p className='text-[11px] sm:text-[13px] xl:text-[14px] font-bold m-0 leading-tight truncate' style={{ color: card.titleColor }}>{card.title}</p>
                      <p className='text-[16px] sm:text-[18px] xl:text-[22px] font-bold m-0 mt-0.5 text-white leading-none truncate'>{card.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='relative w-full min-w-0 h-[300px] sm:h-[400px] md:w-full md:min-h-[400px] md:h-[760px] rounded-[20px] overflow-hidden'>
          <MapTrafficLighting deptId={deptId} />
        </div>

        <div className='flex flex-col gap-3 md:gap-4 w-full md:absolute md:top-0 md:right-0 md:z-10 md:w-[240px] lg:w-[280px]'>
          {statCards.map((s) => (
            <div
              key={s.title}
              className='flex flex-col justify-between h-[140px] sm:h-[160px] md:h-[170px] rounded-[20px] border-2 border-solid p-3 sm:p-4'
              style={{
                borderColor: s.titleColor,
                // Layered so the 10% tint blends onto an opaque dark backing
                // instead of the map behind it — a flat `{color}1A` alone
                // would let the busy map bleed through and wash out the text.
                background: `linear-gradient(${s.titleColor}1A, ${s.titleColor}1A), #161616`,
                boxShadow: `0 10px 24px -8px ${s.titleColor}59`,
              }}
            >
              <div className='flex flex-col gap-2'>
                <div
                  className='w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0'
                  style={{ background: `${s.titleColor}26` }}
                >
                  <img src={s.icon} alt='' className='w-5 h-5 sm:w-6 sm:h-6' />
                </div>
                <p style={{ color: s.titleColor, fontWeight: 700, fontSize: 16, margin: 0, lineHeight: 1.2 }}>{s.title}</p>
              </div>
              <div className='flex items-baseline gap-2'>
                <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 32, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: 0 }}>จุดติดตั้ง</p>
              </div>
              <p style={{ color: '#979797', fontWeight: 400, fontSize: 12, margin: 0 }}>Active : {s.active}</p>
            </div>
          ))}
        </div>
      </section>

      <div className='mt-4'>
        <style>{`
          .traffic-lighting-search-input::placeholder {
            color: #FFFFFF80 !important;
            font-weight: 400;
            font-size: 14px;
          }
        `}</style>
        <SearchBar
          filters={TRAFFIC_LIGHTING_FILTERS}
          stats={filterStats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => setExportOpen(true)}
          // Deliberately hidden by the menu's owner (original design) — the
          // export wiring stays ready; flipping this flag enables the button.
          showExportButton={false}
          formSearch={
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...'
              classNames={{
                root: 'traffic-lighting-search !w-full sm:!w-[360px] sm:!max-w-[360px] !shrink-0 !rounded-[10px]! !h-[46px]! !bg-[#2B2B2B]! !border-[#FCD116]! !overflow-hidden',
                input: 'traffic-lighting-search-input !bg-transparent!',
              }}
              styles={{
                root: { height: 46, background: '#2B2B2B', borderRadius: 10 },
                input: { background: 'transparent', fontSize: 14, fontWeight: 400, color: '#FFFFFF' },
              }}
              suffix={<TbSearch style={{ color: '#FCD116', fontSize: 18 }} />}
              allowClear
            />
          }
        />
      </div>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED rows (what the table
          shows), through the shared pdf/excel utils like cctv overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Traffic_Lighting_Overview_Report',
            title: 'รายงานสรุปภาพรวมไฟฟ้าแสงสว่าง (Traffic Lighting Overview)',
            filterNote: exportFilterNote,
            columns: LIGHTING_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Traffic_Lighting_Overview_Report',
            sheetName: 'Traffic Lighting Overview',
            columns: LIGHTING_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />

      <section className='mt-4'>
        {centralListError ? (
          <Alert
            type='error'
            showIcon
            message='ไม่สามารถโหลดข้อมูล Traffic Lighting ได้'
            action={<Button size='small' onClick={retryCentralList}>ลองใหม่</Button>}
          />
        ) : !centralListLoaded ? (
          <div className='flex min-h-40 items-center justify-center'><Spin /></div>
        ) : viewMode === 'TABLE' ? (
          <TableTrafficLighting projects={displayedProjects} />
        ) : (
          <ProjectCardGrid items={cardItems} totalLabel='จุดติดตั้งทั้งหมด' />
        )}
      </section>
    </>
  )
}

export default React.memo(OverallSection)
