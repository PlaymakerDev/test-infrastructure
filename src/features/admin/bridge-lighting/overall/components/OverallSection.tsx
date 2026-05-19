"use client"
import React, { useMemo, useState } from 'react'
import SearchBar, {
  type FilterConfig,
  type FilterStats,
  type ViewMode,
} from '@/components/searchable/SearchBar'
import LatestBridgeCard from './sections/overall/LatestBridgeCard'
import StatsSection from './sections/overall/StatsSection'
import LocationMapSection from './sections/overall/LocationMapSection'
import MadrixControlPanel from './sections/overall/MadrixControlPanel'
import BridgeProjectsTable from './sections/overall/BridgeProjectsTable'
import BridgeProjectsSummaryTable from './sections/overall/BridgeProjectsSummaryTable'
import { BRIDGE_PROJECTS } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

// ── Filter config — 5 categories for bridge lighting ──────────────────────────
// Passed to the central `<SearchBar>` so the UI matches WIM/CCTV/Mobile pages
// but with bridge-specific labels + colors.
const BRIDGE_FILTERS: FilterConfig[] = [
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

interface Props {}

const OverallSection: React.FC<Props> = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  // ── Stats (counts by filter category) ──
  const stats: FilterStats = useMemo(() => ({
    all: BRIDGE_PROJECTS.length,
    online: BRIDGE_PROJECTS.filter((p) => p.connection === 'online').length,
    offline: BRIDGE_PROJECTS.filter((p) => p.connection === 'offline').length,
    inWarranty: BRIDGE_PROJECTS.filter((p) => p.warranty === 'in-warranty').length,
    expired: BRIDGE_PROJECTS.filter((p) => p.warranty === 'expired').length,
  }), [])

  // ── Apply filter + search ──
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return BRIDGE_PROJECTS.filter((p) => {
      switch (activeFilter) {
        case 'online':      if (p.connection !== 'online') return false; break
        case 'offline':     if (p.connection !== 'offline') return false; break
        case 'in-warranty': if (p.warranty !== 'in-warranty') return false; break
        case 'expired':     if (p.warranty !== 'expired') return false; break
        case 'all':         break
      }
      if (term) {
        const haystack = `${p.roadCode} ${p.projectName} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [activeFilter, search])

  // ── "Latest bridge" card data ─────────────────────────────────────────
  // No proper timestamps in mock data, so we pick the first online bridge
  // as the featured one. When `lastUpdate` becomes parseable, sort by it
  // descending and take [0].
  const latestBridge =
    BRIDGE_PROJECTS.find((p) => p.connection === 'online') ?? BRIDGE_PROJECTS[0]

  // ── Aggregate device totals (devices, not projects) ───────────────────
  // The Figma stat cards are labeled "ไฟประดับสะพานในระบบทั้งหมด" with unit
  // "จุดติดตั้ง" — those are devices/install points, not projects. So sum
  // `totalDevices` etc., not `BRIDGE_PROJECTS.length`.
  const totalDevices = BRIDGE_PROJECTS.reduce((sum, p) => sum + p.totalDevices, 0)
  const totalOnlineDevices = BRIDGE_PROJECTS.reduce((sum, p) => sum + p.onlineCount, 0)
  const inWarrantyDevices = BRIDGE_PROJECTS
    .filter((p) => p.warranty === 'in-warranty')
    .reduce((sum, p) => sum + p.totalDevices, 0)
  const inWarrantyOnlineDevices = BRIDGE_PROJECTS
    .filter((p) => p.warranty === 'in-warranty')
    .reduce((sum, p) => sum + p.onlineCount, 0)
  const expiredDevices = BRIDGE_PROJECTS
    .filter((p) => p.warranty === 'expired')
    .reduce((sum, p) => sum + p.totalDevices, 0)
  const expiredOnlineDevices = BRIDGE_PROJECTS
    .filter((p) => p.warranty === 'expired')
    .reduce((sum, p) => sum + p.onlineCount, 0)

  return (
    <div className='flex flex-col gap-5'>
      {/* ── Map + overlay cards.
        *
        * Layout strategy (mirrors detail page):
        * • Mobile / tablet (< xl): map is a fixed-height block, cards stack
        *   below it in normal flow. No overlay positioning.
        * • Desktop (xl+): map is absolute full-bleed background, cards are
        *   absolute overlays at left + right edges. */}
      <section className='relative -mx-10 overflow-x-hidden xl:overflow-hidden xl:h-180'>
        {/* Map — normal flow on mobile (sized div), absolute bg on xl+.
          *
          * IMPORTANT: this wrapper MUST be `position: relative` so that the
          * `BaseMap` inside (which uses `position: absolute; inset: 0`) is
          * contained here rather than escaping up to the section element.
          * Without `relative`, the map covers the entire section background
          * and the cards stacked below appear to float on top of the map. */}
        <div
          className='relative w-full xl:absolute xl:inset-0'
          style={{ minHeight: 340 }}
        >
          <LocationMapSection />
        </div>

        {/* ── Mobile / tablet (< xl): content stacks below the map.
          * Hidden on xl+ where overlays take over. */}
        <div className='flex flex-col gap-4 pt-4 px-10 xl:hidden'>
          <LatestBridgeCard bridge={latestBridge} />
          <div className='w-full h-70 sm:h-90'>
            <MadrixControlPanel />
          </div>
          <StatsSection
            total={totalDevices}
            totalActive={totalOnlineDevices}
            inWarranty={inWarrantyDevices}
            inWarrantyActive={inWarrantyOnlineDevices}
            expired={expiredDevices}
            expiredActive={expiredOnlineDevices}
          />
        </div>

        {/* ── Desktop xl+: overlay cards on top of the absolute map background. */}
        <aside className='hidden xl:flex flex-col gap-4 absolute z-10 pl-10 pointer-events-none top-5 left-0'>
          <div className='pointer-events-auto w-107.5'>
            <LatestBridgeCard bridge={latestBridge} />
          </div>
          <div className='pointer-events-auto w-170 h-98.75'>
            <MadrixControlPanel />
          </div>
        </aside>

        <aside className='hidden xl:flex flex-col gap-4 absolute z-10 items-end pr-10 pointer-events-auto top-5 right-0 w-80'>
          <StatsSection
            total={totalDevices}
            totalActive={totalOnlineDevices}
            inWarranty={inWarrantyDevices}
            inWarrantyActive={inWarrantyOnlineDevices}
            expired={expiredDevices}
            expiredActive={expiredOnlineDevices}
          />
        </aside>
      </section>

      {/* ── Filter bar (central SearchBar with bridge config) ── */}
      <section>
        <SearchBar
          filters={BRIDGE_FILTERS}
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

      {/* ── Projects table — view toggle switches between detail (status pills)
        * and summary (count columns) layouts. Both are tables, not card grids. */}
      <section>
        {viewMode === 'TABLE' ? (
          <BridgeProjectsTable projects={filtered} />
        ) : (
          <BridgeProjectsSummaryTable projects={filtered} />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(OverallSection)
