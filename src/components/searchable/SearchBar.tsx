"use client"
import { AppstoreOutlined, BarsOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Input, Segmented } from 'antd'
import React, { useState } from 'react'
import { TbPrinter } from 'react-icons/tb'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ViewMode = 'TABLE' | 'GRID'

/**
 * Built-in filter keys for the default (status) preset. Callers can pass their own
 * `filters` array with any string keys to override.
 */
export type FilterType = 'all' | 'normal' | 'overweight' | 'example_active' | 'example_inactive'

export type FilterStats = Record<string, number | string | undefined>

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
  /** MODE **/
  mode?: 'default' | 'form' | 'title'
}

// ── Default config (back-compat with existing weight-based pages) ─────────────

const DEFAULT_FILTERS: FilterConfig[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    colorPrimary: '#FCD116',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-[#8a7000] text-white',
    badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]',
  },
  {
    key: 'example_active',
    label: 'ออนไลน์',
    colorPrimary: '#2dd4bf',
    colorTextLightSolid: '#0A0A0A',
    badgeActiveClass: 'bg-teal-800 text-white',
    badgeIdleClass: 'bg-teal-500/20 text-teal-400',
  },
  {
    key: 'example_inactive',
    label: 'ออฟไลน์',
    colorPrimary: '#ef4444',
    colorTextLightSolid: '#ffffff',
    badgeActiveClass: 'bg-red-800 text-white',
    badgeIdleClass: 'bg-red-500/20 text-red-400',
  },
]

const DEFAULT_STATS: FilterStats = { all: 8, example_active: 7, example_inactive: 1 }

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Controls overall layout. 'form' = filters+search+export (default), 'default' = filters+viewMode only, 'title' = title+viewMode+export */
  mode?: 'form' | 'default' | 'title'
  /** Displayed as heading in 'title' mode */
  title?: string
  /** Override the filter buttons. Defaults to the 3 status filters (all/example_active/example_inactive). */
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
  /** Hide the table/grid Segmented toggle entirely — for tables with no grid
   *  view to switch to (e.g. a flat event log). Defaults to shown. */
  showViewToggle?: boolean
  onExport?: () => void
  showExportButton?: boolean

  /* FORM SEARCH */
  formSearch?: React.ReactNode

  /* HAS SWITCH */
  hasSwitch?: boolean
  /** Extra classes appended to the filter-button row wrapper (the default is
   *  a single horizontal scroll line on mobile). Pass e.g. `'flex-wrap'` to
   *  make the filters wrap onto multiple lines on small screens instead. */
  filterClassName?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

const SearchBar: React.FC<Props> = ({
  mode = 'form',
  title,
  filters = DEFAULT_FILTERS,
  stats = DEFAULT_STATS,
  defaultFilter,
  activeFilter: controlledFilter,
  onFilterChange,
  defaultViewMode = 'TABLE',
  onViewModeChange,
  showViewToggle = true,
  onExport,
  showExportButton = true,
  formSearch,
  hasSwitch = true,
  filterClassName,
}) => {
  const initialFilter = defaultFilter ?? filters[0]?.key ?? ''
  const [uncontrolledFilter, setUncontrolledFilter] = useState<string>(initialFilter)
  const activeFilter = controlledFilter ?? uncontrolledFilter

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)

  const handleFilter = (key: string) => {
    if (controlledFilter === undefined) setUncontrolledFilter(key)
    onFilterChange?.(key)
  }

  const handleViewMode = (value: string | number) => {
    const v = value as ViewMode
    setViewMode(v)
    onViewModeChange?.(v)
  }

  return (
    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3'>

      {/* ── Left: filter buttons (form/default) or title (title mode) ── */}
      {/* Default filter row is a mobile horizontal scroll; `filterClassName` REPLACES it entirely. */}
      {mode === 'title' ? (
        <h3 className='text-(--yellow) mb-0 truncate'>{title}</h3>
      ) : (
        <div className={filterClassName ?? 'flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 lg:pb-0 lg:flex-wrap'}>
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
                  <span className='flex items-center gap-2 fs-12'>
                    <span>{f.label}</span>
                    {count !== undefined && (
                      <span className={[
                        'fs-12 rounded min-w-6 h-6 px-1.5',
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
      )}

      {/* ── Right controls ── */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto lg:shrink-0'>
        {mode === 'form' && formSearch}
        {hasSwitch && showViewToggle && (
          <Segmented
            value={viewMode}
            onChange={handleViewMode}
            options={[
              { value: 'TABLE', icon: <BarsOutlined /> },
              { value: 'GRID', icon: <AppstoreOutlined /> },
            ]}
            size='large'
            block
          />
        )}
        {mode !== 'default' && showExportButton && (
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              type='primary'
              size='large'
              shape='round'
              icon={<TbPrinter />}
              onClick={onExport}
              className='w-full! sm:w-auto! sm:min-w-45!'
            >
              <p className='fs-12'>นำออกเอกสาร</p>
            </Button>
          </ConfigProvider>
        )}
      </div>

    </div>
  )
}

export default React.memo<Props>(SearchBar)
