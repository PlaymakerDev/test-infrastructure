"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { AutoComplete, ConfigProvider, Empty, Input } from 'antd'
import { TbSearch } from 'react-icons/tb'
import { useMap } from '../hooks/useMap'
import { useRoadsList } from '@/hooks/queries/manage'
import type { DashboardPositionLocation } from '@/types/dashboard/api'

/** Local debouncer — we don't need a shared hook for just this overlay, and a
 *  timer + useState keeps the module self-contained. */
const useDebouncedValue = <T,>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

interface Props {
  /** Locations already fetched by `/manage/solution/{deptId}/position` — used
   *  to resolve a road_code → representative coord so we can flyTo without a
   *  second network hop. Roads without any device on-screen fly to the road's
   *  first location we find via a fresh `/manage/roads?search` fetch. */
  positions: DashboardPositionLocation[]
  /** How far to zoom in when a road is picked. */
  targetZoom?: number
}

/** Top-left search overlay on the dashboard map. Users type a road code
 *  (e.g. "ชม.3035"), a matching road is picked from the autocomplete, and the
 *  map flies to its first known device location. Server search is debounced to
 *  keep `/manage/roads?search=` request-cheap. */
const MapSearchBox: React.FC<Props> = ({ positions, targetZoom = 13.5 }) => {
  const { map } = useMap()
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebouncedValue(term, 220)

  // Phone (< sm 640px): the 320px input ate most of the row next to the
  // alert badge (2026-07-20) — collapse to a 44px search button that slides
  // open on tap. Desktop keeps the always-open input.
  const [isMobile, setIsMobile] = useState(false)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])
  const collapsed = isMobile && !expanded

  // Only hit the server once the user has typed 2+ chars — one-letter queries
  // return effectively everything and waste bandwidth.
  const enabled = debouncedTerm.trim().length >= 2
  const roads = useRoadsList({
    page: 1,
    limit: 20,
    search: enabled ? debouncedTerm.trim() : undefined,
  })

  // Coord lookup by road_id — built from the position payload already loaded
  // for the country/บทช. view. First occurrence per road wins.
  const coordByRoadId = useMemo(() => {
    const m = new Map<number, [number, number]>()
    for (const loc of positions) {
      const c = loc.geometry_point
      if (!Array.isArray(c) || c.length !== 2) continue
      if (!m.has(loc.road.id)) m.set(loc.road.id, [c[0], c[1]])
    }
    return m
  }, [positions])

  // Only surface roads that have at least one device on-screen — searching
  // finds nationwide matches, but a road without any solution can't be flown
  // to and has no data to inspect, so it's noise in the dropdown.
  const options = useMemo(() => {
    if (!enabled) return []
    return (roads.data?.res_data ?? [])
      .filter((r) => coordByRoadId.has(r.id))
      .map((r) => ({
        value: String(r.id),
        label: (
          <div className='min-w-0'>
            <div className='truncate text-white'>{r.road_code}</div>
            <div className='truncate text-white/50 text-[11px]'>{r.road_name}</div>
          </div>
        ),
      }))
  }, [enabled, roads.data, coordByRoadId])

  const flyToRoad = (roadId: number) => {
    const coord = coordByRoadId.get(roadId)
    if (!coord || !map) return
    map.flyTo({ center: coord, zoom: targetZoom, pitch: 30, duration: 1300 })
  }

  return (
    // Dark AutoComplete theme override — mirrors the app's other overlays so
    // the panel doesn't flash white on this dark UI. Everything else falls
    // back to the ambient tokens.
    <ConfigProvider
      theme={{
        components: {
          Select: {
            optionSelectedBg: 'rgba(252,209,22,0.12)',
            optionActiveBg: 'rgba(255,255,255,0.06)',
          },
        },
      }}
    >
      <div
        className='pointer-events-auto'
        style={{
          position: 'absolute',
          top: 60,
          left: 16,
          zIndex: 20,
          // Mobile: 44px button ↔ expanded input. Expanded width stops short
          // of the alert badge pinned top-right (~100px + gap) instead of
          // running underneath it (2026-07-20).
          width: collapsed ? 44 : isMobile ? 'calc(100vw - 140px)' : 320,
          transition: 'width 0.25s ease-out',
        }}
      >
        {collapsed ? (
          <button
            type='button'
            aria-label='ค้นหาสายทาง'
            onClick={() => setExpanded(true)}
            className='flex items-center justify-center cursor-pointer'
            style={{
              width: 44,
              height: 40,
              borderRadius: 10,
              background: 'rgba(5,13,26,0.85)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <TbSearch size={18} className='text-white/70' />
          </button>
        ) : (
        <AutoComplete
          value={term}
          onChange={setTerm}
          options={options}
          notFoundContent={
            enabled ? (
              roads.isFetching ? (
                <div className='text-white/60 py-2 text-center'>กำลังค้นหา…</div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span className='text-white/60'>ไม่พบสายทาง</span>}
                />
              )
            ) : (
              <div className='text-white/50 py-2 text-center text-[12px]'>
                พิมพ์อย่างน้อย 2 ตัวอักษร เช่น ชม.3035
              </div>
            )
          }
          onSelect={(val) => {
            const id = Number(val)
            if (!Number.isFinite(id)) return
            flyToRoad(id)
            const road = roads.data?.res_data.find((r) => r.id === id)
            if (road) setTerm(road.road_code)
          }}
          style={{ width: '100%' }}
          popupClassName='map-road-search-popup'
        >
          <Input
            allowClear
            size='large'
            autoFocus={isMobile}
            prefix={<TbSearch size={16} className='text-white/60' />}
            placeholder='ค้นหาสายทาง (เช่น ชม.3035)'
            // Collapse back to the button when leaving an EMPTY field — a
            // typed term keeps the box open so the searched code stays visible.
            onBlur={() => {
              if (isMobile && term.trim() === '') setExpanded(false)
            }}
            style={{
              background: 'rgba(5,13,26,0.85)',
              borderColor: 'rgba(255,255,255,0.12)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
            }}
          />
        </AutoComplete>
        )}
      </div>
    </ConfigProvider>
  )
}

export default React.memo(MapSearchBox)
