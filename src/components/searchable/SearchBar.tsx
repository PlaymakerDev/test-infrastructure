"use client"
import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Segmented } from 'antd'
import React, { useState } from 'react'
import { TbPrinter } from 'react-icons/tb'

export type FilterType = 'all' | 'normal' | 'overweight'
export type ViewMode = 'TABLE' | 'GRID'

export interface FilterStats {
  all?: number
  normal?: number
  overweight?: number
}

interface Props {
  stats?: FilterStats
  defaultFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
  defaultViewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onExport?: () => void
}

interface FilterConfig {
  key: FilterType
  label: string
  statKey: keyof FilterStats
  colorPrimary: string
  colorTextLightSolid: string
  badgeActiveClass: string
  badgeIdleClass: string
}

const FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    statKey: 'all',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'normal',
    label: 'น้ำหนักปกติ',
    statKey: 'normal',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'overweight',
    label: 'น้ำหนักเกิน',
    statKey: 'overweight',
    colorPrimary: '#ef4444',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

const SearchBar: React.FC<Props> = ({
  stats = { all: 10, normal: 8, overweight: 2 },
  defaultFilter = 'all',
  onFilterChange,
  defaultViewMode = 'TABLE',
  onViewModeChange,
  onExport,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter)
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)

  const handleFilter = (key: FilterType) => {
    setActiveFilter(key)
    onFilterChange?.(key)
  }

  const handleViewMode = (value: string | number) => {
    const mode = value as ViewMode
    setViewMode(mode)
    onViewModeChange?.(mode)
  }

  return (
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>

      {/* ── Filter buttons ── */}
      <div className='flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0 sm:flex-wrap'>
        {FILTERS.map(({ key, label, statKey, colorPrimary, colorTextLightSolid, badgeActiveClass, badgeIdleClass }) => {
          const isActive = activeFilter === key
          const count = stats[statKey]
          return (
            <ConfigProvider
              key={key}
              theme={{ token: { colorPrimary, colorTextLightSolid } }}
            >
              <Button
                type='primary'
                ghost={!isActive}
                shape='default'
                size='large'
                onClick={() => handleFilter(key)}
              >
                <span className='flex items-center gap-2'>
                  <p>{label}</p>
                  {count !== undefined && (
                    <span className={[
                      'text-xs rounded min-w-6 h-6 px-1.5',
                      'flex items-center justify-center leading-none',
                      isActive ? badgeActiveClass : badgeIdleClass,
                    ].join(' ')}>
                      <p>{count}</p>
                    </span>
                  )}
                </span>
              </Button>
            </ConfigProvider>
          )
        })}
      </div>

      {/* ── Right controls ── */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto sm:shrink-0'>
        <Segmented
          block
          value={viewMode}
          onChange={handleViewMode}
          options={[
            { value: 'TABLE', icon: <BarsOutlined /> },
            { value: 'GRID', icon: <AppstoreOutlined /> },
          ]}
          size='large'
        />
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button
            block
            type='primary'
            size='large'
            shape='round'
            icon={<TbPrinter />}
            onClick={onExport}
          >
            <p>นำออกเอกสาร</p>
          </Button>
        </ConfigProvider>
      </div>

    </div>
  )
}

export default React.memo<Props>(SearchBar)
