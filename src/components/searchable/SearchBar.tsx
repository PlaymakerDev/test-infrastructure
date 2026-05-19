"use client"
import { AppstoreOutlined, BarsOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Input, Segmented } from 'antd'
import React, { useState } from 'react'
import { TbPrinter } from 'react-icons/tb'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViewMode = 'TABLE' | 'GRID'

/**
 * Built-in filter keys for the default (weight) preset. Callers can pass their own
 * `filters` array with any string keys to override.
 */
export type FilterType = 'all' | 'normal' | 'overweight'

export type FilterStats = Record<string, number | undefined>

export interface FilterConfig {
  key: string
  label: string
  /** Lookup key in `stats` object (defaults to `key` if omitted) */
  statKey?: string
  /** Active state color (background + badge accent) */
  colorPrimary: string
  /** Text color when active (on the colored background) */
  colorTextLightSolid: string
  /** Tailwind classes for the badge in active state */
  badgeActiveClass: string
  /** Tailwind classes for the badge in idle state */
  badgeIdleClass: string
}

// ── Default config (back-compat with existing weight-based pages) ─────────────

const DEFAULT_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#66AEFF',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#1B3F8B] text-white',
    badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]',
  },
  {
    key: 'normal',
    label: 'น้ำหนักปกติ',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'overweight',
    label: 'น้ำหนักเกิน',
    colorPrimary: '#ef4444',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

const DEFAULT_STATS: FilterStats = { all: 10, normal: 8, overweight: 2 }

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Override the filter buttons. Defaults to the 3 weight filters (all/normal/overweight). */
  filters?: FilterConfig[]
  /** Counts shown in each filter's badge — key must match `FilterConfig.statKey` (or `key`). */
  stats?: FilterStats
  /** Initial active filter key (uncontrolled). */
  defaultFilter?: string
  /** Controlled active filter — pass with `onFilterChange` to control externally. */
  activeFilter?: string
  onFilterChange?: (filter: string) => void

  defaultViewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onExport?: () => void

  /**
   * Render a search input on the right when set. Pass `searchPlaceholder` to enable.
   * Use controlled `search` + `onSearchChange` for two-way binding.
   */
  searchPlaceholder?: string
  search?: string
  onSearchChange?: (text: string) => void
  /** Width of the search input (default 320px) */
  searchWidth?: number
}

// ── Component ─────────────────────────────────────────────────────────────────

const SearchBar: React.FC<Props> = ({
  filters = DEFAULT_FILTERS,
  stats = DEFAULT_STATS,
  defaultFilter,
  activeFilter: controlledFilter,
  onFilterChange,
  defaultViewMode = 'TABLE',
  onViewModeChange,
  onExport,
  searchPlaceholder,
  search: controlledSearch,
  onSearchChange,
  searchWidth = 320,
}) => {
  const initialFilter = defaultFilter ?? filters[0]?.key ?? ''
  const [uncontrolledFilter, setUncontrolledFilter] = useState<string>(initialFilter)
  const activeFilter = controlledFilter ?? uncontrolledFilter

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)

  const [uncontrolledSearch, setUncontrolledSearch] = useState('')
  const search = controlledSearch ?? uncontrolledSearch

  const handleFilter = (key: string) => {
    if (controlledFilter === undefined) setUncontrolledFilter(key)
    onFilterChange?.(key)
  }

  const handleViewMode = (value: string | number) => {
    const mode = value as ViewMode
    setViewMode(mode)
    onViewModeChange?.(mode)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (controlledSearch === undefined) setUncontrolledSearch(v)
    onSearchChange?.(v)
  }

  const showSearch = searchPlaceholder !== undefined

  return (
    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>

      {/* ── Filter buttons ── */}
      <div className='flex items-center gap-2 overflow-x-auto pb-0.5 lg:pb-0 lg:flex-wrap'>
        {filters.map((f) => {
          const isActive = activeFilter === f.key
          const count = stats[f.statKey ?? f.key]
          return (
            <ConfigProvider
              key={f.key}
              theme={{ token: { colorPrimary: f.colorPrimary, colorTextLightSolid: f.colorTextLightSolid } }}
            >
              <Button
                type='primary'
                ghost={!isActive}
                shape='default'
                size='large'
                onClick={() => handleFilter(f.key)}
              >
                <span className='flex items-center gap-2'>
                  <span>{f.label}</span>
                  {count !== undefined && (
                    <span className={[
                      'text-xs rounded min-w-6 h-6 px-1.5',
                      'flex items-center justify-center leading-none',
                      isActive ? f.badgeActiveClass : f.badgeIdleClass,
                    ].join(' ')}>
                      {count}
                    </span>
                  )}
                </span>
              </Button>
            </ConfigProvider>
          )
        })}
      </div>

      {/* ── Right controls ── */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto lg:shrink-0'>
        {showSearch && (
          <Input
            placeholder={searchPlaceholder}
            suffix={<SearchOutlined style={{ color: '#FCD116', fontSize: 18 }} />}
            value={search}
            onChange={handleSearch}
            size='large'
            style={{
              width: searchWidth,
              height: 36,
              background: '#191919',
              borderRadius: 10,
            }}
          />
        )}

        <Segmented
          value={viewMode}
          onChange={handleViewMode}
          options={[
            { value: 'TABLE', icon: <BarsOutlined /> },
            { value: 'GRID', icon: <AppstoreOutlined /> },
          ]}
          size='large'
        />
        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          {/* Fixed min-width so the export button looks identical across pages
              regardless of whether the search input is enabled or not. */}
          <Button
            type='primary'
            size='large'
            shape='round'
            icon={<TbPrinter />}
            onClick={onExport}
            className='w-full! sm:w-auto!'
            style={{ minWidth: 180 }}
          >
            <span>นำออกเอกสาร</span>
          </Button>
        </ConfigProvider>
      </div>

    </div>
  )
}

export default React.memo<Props>(SearchBar)
