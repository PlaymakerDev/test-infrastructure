"use client"
import React, { useMemo, useState } from 'react'
import { SummaryTableBridgeLighting, TableBridgeLighting } from '../../../components'
import SearchBar, { type FilterConfig, type FilterStats, type ViewMode } from '@/components/searchable/SearchBar'
import FormSearchBridgeLighting from './FormSearchBridgeLighting'
import { BRIDGE_PROJECTS } from '@/features/admin/bridge-lighting/overall/data/bridgeProjects'

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

interface Props { }

const DataDisplaySection: React.FC<Props> = () => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')

  const stats: FilterStats = useMemo(() => ({
    all: BRIDGE_PROJECTS.length,
    online: BRIDGE_PROJECTS.filter((p) => p.connection === 'online').length,
    offline: BRIDGE_PROJECTS.filter((p) => p.connection === 'offline').length,
    inWarranty: BRIDGE_PROJECTS.filter((p) => p.warranty === 'in-warranty').length,
    expired: BRIDGE_PROJECTS.filter((p) => p.warranty === 'expired').length,
  }), [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return BRIDGE_PROJECTS.filter((p) => {
      switch (activeFilter) {
        case 'online': if (p.connection !== 'online') return false; break
        case 'offline': if (p.connection !== 'offline') return false; break
        case 'in-warranty': if (p.warranty !== 'in-warranty') return false; break
        case 'expired': if (p.warranty !== 'expired') return false; break
      }
      if (term) {
        const haystack = `${p.roadCode} ${p.projectName} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [activeFilter, search])

  const renderContent = useMemo(() => {
    switch (viewMode) {
      case 'TABLE':
        return <SummaryTableBridgeLighting projects={filtered} />
      case 'GRID':
        return <TableBridgeLighting projects={filtered} />
      default:
        return null
    }
  }, [viewMode, filtered])

  return (
    <div>
      <section>
        <SearchBar
          filters={BRIDGE_FILTERS}
          stats={stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          formSearch={<FormSearchBridgeLighting onSearchChange={setSearch} />}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>
    </div>
  )
}

export default React.memo<Props>(DataDisplaySection)
