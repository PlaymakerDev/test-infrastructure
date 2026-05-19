"use client"
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import MapSectionCctv from './sections/overall/MapSectionCctv'
import StatsSectionCctv from './sections/overall/StatsSectionCctv'
import CameraListCctv from './sections/overall/CameraListCctv'
import CamerasTableCctv from './sections/overall/CamerasTableCctv'
import CardGridCctv from './sections/overall/CardGridCctv'
import {
  SAMPLE_CCTV_CAMERAS,
  CCTV_STATS,
  CCTV_CAMERAS,
  type CctvCameraEntry,
} from '@/features/admin/cctv/overall/data/cctvData'

const CCTV_FILTERS: FilterConfig[] = [
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

const OverallSection: React.FC = () => {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('GRID')

  const stats: FilterStats = useMemo(() => ({
    all: CCTV_CAMERAS.length,
    online: CCTV_CAMERAS.filter((c) => c.connection === 'online').length,
    offline: CCTV_CAMERAS.filter((c) => c.connection === 'offline').length,
    inWarranty: CCTV_CAMERAS.filter((c) => c.warranty === 'in-warranty').length,
    expired: CCTV_CAMERAS.filter((c) => c.warranty === 'expired').length,
  }), [])

  const filtered = useMemo<CctvCameraEntry[]>(() => {
    const term = search.trim().toLowerCase()
    return CCTV_CAMERAS.filter((c) => {
      switch (activeFilter) {
        case 'online':      if (c.connection !== 'online') return false; break
        case 'offline':     if (c.connection !== 'offline') return false; break
        case 'in-warranty': if (c.warranty !== 'in-warranty') return false; break
        case 'expired':     if (c.warranty !== 'expired') return false; break
        case 'all':         break
      }
      if (term) {
        const haystack = `${c.roadCode} ${c.projectName} ${c.installPoint} ${c.contractNo} ${c.bureau} ${c.ip}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [activeFilter, search])

  return (
    <div className='flex flex-col gap-5'>
      {/* ── Map + overlay panels ── */}
      <section className='relative -mx-10 overflow-x-hidden xl:overflow-hidden xl:h-180'>

        {/* Map — fills full height on desktop */}
        <div
          className='relative w-full xl:absolute xl:inset-0'
          style={{ minHeight: 340 }}
        >
          <MapSectionCctv />
        </div>

        {/* Mobile / tablet: stacks below map */}
        <div className='flex flex-col gap-4 pt-4 px-10 xl:hidden'>
          <CameraListCctv cameras={SAMPLE_CCTV_CAMERAS} />
          <StatsSectionCctv
            total={CCTV_STATS.total}
            totalActive={CCTV_STATS.totalActive}
            inWarranty={CCTV_STATS.inWarranty}
            inWarrantyActive={CCTV_STATS.inWarrantyActive}
            expired={CCTV_STATS.expired}
            expiredActive={CCTV_STATS.expiredActive}
          />
        </div>

        {/* Desktop xl+: left overlay — camera preview list */}
        <aside className='hidden xl:flex flex-col absolute z-10 pl-10 pointer-events-none top-5 left-0 w-72'>
          <div className='pointer-events-auto'>
            <CameraListCctv cameras={SAMPLE_CCTV_CAMERAS} />
          </div>
        </aside>

        {/* Desktop xl+: right overlay — search + stats */}
        <aside className='hidden xl:flex flex-col gap-4 absolute z-10 items-end pr-10 pointer-events-auto top-5 right-0 w-80'>

          {/* Search button */}
          <button
            type='button'
            onClick={() => router.push('/admin/cctv/search')}
            className='w-full rounded-full font-medium cursor-pointer'
            style={{
              background: '#FCD116',
              border: 'none',
              color: '#212121',
              fontSize: 16,
              padding: '14px 24px',
            }}
          >
            ค้นหากล้อง CCTV รายสายทาง
          </button>

          {/* Stats cards */}
          <StatsSectionCctv
            total={CCTV_STATS.total}
            totalActive={CCTV_STATS.totalActive}
            inWarranty={CCTV_STATS.inWarranty}
            inWarrantyActive={CCTV_STATS.inWarrantyActive}
            expired={CCTV_STATS.expired}
            expiredActive={CCTV_STATS.expiredActive}
          />
        </aside>
      </section>

      {/* ── Filter bar ── */}
      <section>
        <SearchBar
          filters={CCTV_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchPlaceholder='ค้นหาหน่วยงาน สายทาง หรือชื่อโครงการ...'
          search={search}
          onSearchChange={setSearch}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>

      {/* ── Table / Card grid ── */}
      <section>
        {viewMode === 'TABLE' ? (
          <CamerasTableCctv cameras={filtered} />
        ) : (
          <CardGridCctv cameras={filtered} />
        )}
      </section>
    </div>
  )
}

export default React.memo(OverallSection)
