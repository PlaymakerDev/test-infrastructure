"use client"
import React, { useState } from 'react'
import { TbChevronDown, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbLayoutSidebarRightCollapse, TbLayoutSidebarRightExpand } from 'react-icons/tb'
import { Button, Collapse } from 'antd'
import { useRouter } from 'next/navigation'
import type { ExpressionSpecification } from 'mapbox-gl'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import MarkerLayer, { type MarkerColor } from '@/components/map/primitives/MarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import { SearchCard } from '@/components/search-card'
import DrawerMapSearchCard from './DrawerMapSearchCard'
import { ROUTE_ITEMS, type RouteItem, type MapMarkerItem, routeKey, detailLabel, detailKey } from '../../../data/routeItems'

export interface StatCard {
  borderColor: string
  icon: string
  label: string
  labelColor: string
  value: string
  unit?: string
  sub: string
}

export interface StatisticsMapPanelProps {
  markerColor?: string
  markerAltColor?: string
  markerTextColor?: string
  markerShadowColor?: string
  detailUrl?: string
  onMarkerClick?: (item: RouteItem) => void
  searchText?: string
  onSearchChange?: (value: string) => void
  statsCards?: StatCard[]
  hideIndexBadge?: boolean
  hideCount?: boolean
  markerColorFn?: (item: RouteItem, index: number) => string
  markerLabelFn?: (item: RouteItem, index: number) => string | number
  badgeColorFn?: (item: RouteItem, index: number) => string
  /** Numeric count backing the DEFAULT marker color/label threshold (green
   *  unless > 263, then red + "263+") AND the modern-marker cluster-bubble
   *  sum. Defaults to `item.sub3.length` (right for the mock data, where
   *  sub3 holds one entry per road/pole and its length is a meaningful
   *  count) — override when `sub3` represents something else, e.g. live
   *  incident data where sub3 is one entry per แขวง (org unit, 1-6) and the
   *  actually-meaningful count is the total install points in `item.count`. */
  markerCountFn?: (item: RouteItem, index: number) => number
  /** Data source for both the ค้นหาสายทาง search list and the map markers.
   *  Defaults to the static ROUTE_ITEMS mock — pass real API-backed data to
   *  wire a tab up to the backend without touching the other (still-mock) tabs. */
  routeItems?: RouteItem[]
  /** Opt-in: render markers via the shared ThailandMaskLayer + clustered
   *  MarkerLayer + FitBoundsEffect stack (same as the dashboard/CCTV maps)
   *  instead of the legacy plain HTMLMarker-per-item loop. Default false
   *  keeps Alert/Status (still mock) on the old rendering untouched. */
  useModernMarkers?: boolean
  /** Real per-point map markers (e.g. one per solution, each with its own
   *  geometry_point) — decoupled from `routeItems`, which groups by the
   *  coarser search-list unit (e.g. bureau) and may not have a single
   *  representative coordinate. When provided (requires `useModernMarkers`),
   *  markers are built from THIS list instead of `routeItems`; the search
   *  list itself still renders from `routeItems` as usual. */
  markerItems?: MapMarkerItem[]
  /** Fill color for markerItems-path points/clusters below the 263 overflow
   *  threshold. Only applies when `markerItems` is supplied (the modern
   *  per-point marker path) — the legacy HTMLMarker loop uses `markerColor`
   *  instead. Defaults to the original hardcoded green. */
  markerItemColor?: string
  /** Fill color for markerItems-path points/clusters ABOVE the 263 overflow
   *  threshold. Defaults to the original hardcoded red. */
  markerItemOverflowColor?: string
}

const renderCount = (count: string) => {
  const [left, right] = count.split('/')
  const l = parseInt(left, 10)
  const r = parseInt(right, 10)
  if (l === r) return <span style={{ fontSize: 12, fontWeight: 500, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{count}</span>
  if (l === 0) return <span style={{ fontSize: 12, fontWeight: 500, color: '#E94C4C', width: 28, textAlign: 'right' }}>{count}</span>
  return (
    <span style={{ fontSize: 12, fontWeight: 500, width: 28, textAlign: 'right' }}>
      <span style={{ color: '#05F2DB' }}>{left}</span>
      <span style={{ color: '#FCD116' }}>/{right}</span>
    </span>
  )
}

const StatisticsMapPanel: React.FC<StatisticsMapPanelProps> = ({
  markerColor = '#B2FF00',
  markerAltColor,
  markerTextColor = '#000000',
  markerShadowColor = 'rgba(178, 255, 0, 0.5)',
  detailUrl = '/admin/statistics/detail/status',
  onMarkerClick,
  searchText = '',
  onSearchChange,
  statsCards,
  hideIndexBadge = false,
  hideCount = false,
  markerColorFn,
  markerLabelFn,
  badgeColorFn,
  markerCountFn,
  routeItems = ROUTE_ITEMS,
  useModernMarkers = false,
  markerItems,
  markerItemColor = '#B2FF00',
  markerItemOverflowColor = '#E94C4C',
}) => {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(true)
  const [cardsOpen, setCardsOpen] = useState(true)

  const getCount = (item: RouteItem, index: number) => markerCountFn ? markerCountFn(item, index) : item.sub3.length

  const filteredRoutes = React.useMemo(() => {
    if (!searchText) return routeItems
    const keyword = searchText.toLowerCase()
    return routeItems.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.sub3.some((sub) => sub.label.toLowerCase().includes(keyword) || sub.detail.some((d) => detailLabel(d).toLowerCase().includes(keyword)))
    )
  }, [searchText, routeItems])

  // ── Modern marker stack (ThailandMaskLayer + clustered MarkerLayer +
  // FitBoundsEffect) — only items with a real coordinate can be plotted.
  const routableRoutes = React.useMemo(
    () => filteredRoutes.filter((item): item is RouteItem & { lngLat: [number, number] } => item.lngLat !== null),
    [filteredRoutes]
  )

  const itemByNavKey = React.useMemo(() => {
    const map = new Map<string, RouteItem>()
    for (const item of routableRoutes) map.set(routeKey(item), item)
    return map
  }, [routableRoutes])

  // Same color/label rule the legacy per-item HTMLMarker loop used: green
  // unless the item overflows the 263 threshold (then red + "263+"), or the
  // caller's own markerColorFn/markerLabelFn override when provided.
  // `countValue` (raw number) is also carried so cluster bubbles can SUM it
  // via MarkerLayer's `clusterSumProperty` — showing a meaningful total
  // instead of Mapbox's default "how many markers got merged here".
  //
  // When `markerItems` is supplied, markers come from that flat per-point
  // list instead — each item already has its own real coordinate + count,
  // so no per-item color/label override hooks apply (navigates directly via
  // its own routeKey/detailKey instead of looking up a RouteItem).
  // When every markerItem carries an `offline` flag (e.g. one IoT device per
  // point), color is driven by online/offline status instead of the count
  // overflow threshold — see MapMarkerItem.offline.
  const hasOfflineInfo = React.useMemo(
    () => (markerItems?.length ?? 0) > 0 && markerItems!.every((m) => m.offline !== undefined),
    [markerItems]
  )

  const clusterGeoData = React.useMemo(() => {
    if (markerItems) {
      return {
        type: 'FeatureCollection' as const,
        features: markerItems.map((m) => {
          const isOverflow = m.count > 263
          const color = m.offline !== undefined
            ? (m.offline ? markerItemOverflowColor : markerItemColor)
            : (isOverflow ? markerItemOverflowColor : markerItemColor)
          return {
            type: 'Feature' as const,
            properties: {
              navRoute: m.routeKey,
              navDetail: m.detailKey,
              color,
              ...(m.offline !== undefined && { offlineFlag: m.offline ? 1 : 0 }),
              countLabel: String(m.count),
              countValue: m.count,
            },
            geometry: { type: 'Point' as const, coordinates: m.lngLat },
          }
        }),
      }
    }
    return {
      type: 'FeatureCollection' as const,
      features: routableRoutes.map((item, index) => {
        const count = getCount(item, index)
        const isOverflow = count > 263
        const color = markerColorFn ? markerColorFn(item, index) : (isOverflow ? '#E94C4C' : '#B2FF00')
        const countLabel = markerLabelFn ? String(markerLabelFn(item, index)) : (isOverflow ? '263+' : String(count))
        return {
          type: 'Feature' as const,
          properties: { navKey: routeKey(item), color, countLabel, countValue: count },
          geometry: { type: 'Point' as const, coordinates: item.lngLat },
        }
      }),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerItems, routableRoutes, markerColorFn, markerLabelFn, markerCountFn, markerItemColor, markerItemOverflowColor])

  const fitCoords = React.useMemo(
    () => markerItems ? markerItems.map((m) => m.lngLat) : routableRoutes.map((item) => item.lngLat),
    [markerItems, routableRoutes]
  )

  // Cluster bubbles don't carry arbitrary per-feature properties, so a plain
  // `color` lookup would always fall back to a flat default. When items carry
  // online/offline status, `colorSum` (summed via clusterColorSumProperty)
  // lets a cluster bubble turn red if it contains ANY offline device;
  // otherwise fall back to the per-feature `color` (or markerItemColor for a
  // cluster with no properties at all).
  const clusterColor: MarkerColor = hasOfflineInfo
    ? ['case', ['>', ['coalesce', ['get', 'colorSum'], ['get', 'offlineFlag'], 0], 0], markerItemOverflowColor, markerItemColor] as ExpressionSpecification
    : ['coalesce', ['get', 'color'], markerItemColor] as ExpressionSpecification

  const handleMarkerClick = (item: RouteItem) => {
    if (onMarkerClick) {
      onMarkerClick(item)
    } else {
      router.push(`${detailUrl}?route=${encodeURIComponent(routeKey(item))}`)
    }
  }

  const searchCardCollapse = (
    <Collapse
                ghost
                expandIcon={({ isActive }) => (
                  <TbChevronDown size={20} style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                )}
                style={{ marginTop: 16 }}
                items={filteredRoutes.map((item, index) => ({
                  key: item.name,
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {!hideIndexBadge && (() => {
                          const noti = item.notiTotal ?? 0
                          const badgeColor = badgeColorFn
                            ? badgeColorFn(item, index)
                            : noti === 0 ? '#979797' : '#FCD116'
                          return (
                            <span style={{ fontSize: 12, fontWeight: 500, color: badgeColor, width: 50, height: 22, borderRadius: 88, border: `1px solid ${badgeColor}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor }} />
                              {noti}
                            </span>
                          )
                        })()}
                        {!hideCount && renderCount(item.count)}
                      </div>
                    </div>
                  ),
                  style: { marginBottom: 4 },
                  classNames: { header: 'rounded-lg bg-[#363636]' },
                  styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
                  children: (
                    <Collapse
                      ghost
                      expandIcon={({ isActive }) => (
                        <span style={{ marginLeft: 24 }}>
                          <TbChevronDown size={20} style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </span>
                      )}
                      style={{ marginTop: 4 }}
                      items={[{
                        key: `${item.name}-sub`,
                        label: (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              {!hideIndexBadge && (() => {
                                const noti = item.notiTotal ?? 0
                                const bc = badgeColorFn
                                  ? badgeColorFn(item, index)
                                  : noti === 0 ? '#979797' : '#FCD116'
                                return (
                                  <span style={{ fontSize: 12, fontWeight: 500, color: bc, width: 50, height: 22, borderRadius: 88, border: `1px solid ${bc}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: bc }} />
                                    {noti}
                                  </span>
                                )
                              })()}
                              {!hideCount && renderCount(item.count ?? `${item.sub3.filter(s => s.connected).length}/${item.sub3.length}`)}
                            </div>
                          </div>
                        ),
                        style: { marginBottom: 4 },
                        classNames: { header: 'rounded-lg bg-[#4B4B4B]' },
                        styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, body: { padding: 0 } },
                        children: (
                          <Collapse
                            ghost
                            expandIcon={({ isActive }) => (
                              <span style={{ marginLeft: 56 }}>
                                <TbChevronDown size={20} style={{ color: '#FCD116', transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                              </span>
                            )}
                            style={{ marginTop: 4 }}
                            items={item.sub3.filter((sub) => sub.connected).map((sub) => ({
                              key: `${item.name}-${sub.label}`,
                              label: (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{sub.label}</span>
                                  <span style={{ fontSize: 12, fontWeight: 500, color: '#FCD116', flexShrink: 0, marginLeft: 8 }}>{sub.detail.length}</span>
                                </div>
                              ),
                              style: { marginBottom: 4 },
                              classNames: { header: 'rounded-lg' },
                              styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16, backgroundColor: '#212121' }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
                              children: (
                                <div style={{ marginTop: 4 }}>
                                  {sub.detail.map((d) => {
                                    const isOnline = typeof d === 'string' ? sub.connected : (d.connected ?? sub.connected)
                                    return (
                                    <div
                                      key={detailKey(d)}
                                      onClick={() => router.push(`${detailUrl}?route=${encodeURIComponent(routeKey(item))}&detail=${encodeURIComponent(detailKey(d))}`)}
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: '#000000', borderRadius: 8, paddingBlock: 12, paddingInline: 16, marginBottom: 4, cursor: 'pointer' }}
                                    >
                                      <span style={{ fontSize: 12, fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>{detailLabel(d)}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <img src={isOnline ? '/images/statistics/iconconnect.png' : '/images/statistics/iconnoconnect.png'} alt={isOnline ? 'connected' : 'disconnected'} width={20} height={20} />
                                      </div>
                                    </div>
                                    )
                                  })}
                                </div>
                              ),
                            }))}
                          />
                        ),
                      }]}
                    />
                  ),
                }))}
              />
  )

  return (
    <>
      {/* ══ MOBILE: drawer search card — outside flex to escape map stacking context ══ */}
      <DrawerMapSearchCard>
        <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => onSearchChange?.(value)}>
          {searchCardCollapse}
        </SearchCard>
      </DrawerMapSearchCard>

      <div className="mt-8 overflow-hidden flex" style={{ height: 'calc(100vh - 200px)' }}>

        {/* ══ LEFT: collapsible SearchCard panel — xl+ only ══ */}
        <div className='relative shrink-0 max-xl:hidden self-stretch'>
          <div className={[
            'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) h-full',
            searchOpen ? 'w-[370px] rounded-lg' : 'w-0',
          ].join(' ')}>
            <div className='w-[370px] h-full overflow-y-auto'>
              <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => onSearchChange?.(value)} className="h-full">
                {searchCardCollapse}
              </SearchCard>
            </div>
          </div>
          <Button
            type='primary' shape='circle'
            title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
            icon={searchOpen ? <TbLayoutSidebarLeftCollapse className='fs-18' /> : <TbLayoutSidebarLeftExpand className='fs-18' />}
            onClick={() => setSearchOpen((prev) => !prev)}
            className='absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg'
          />
        </div>

        {/* ══ MAIN: map + stats cards ══ */}
        <div className='flex-1 min-w-0 relative overflow-hidden rounded-[20px]'>
          <BaseMap initialCenter={[102.0, 14.0]} initialZoom={4.8}>
            {useModernMarkers ? (
              <>
                <ThailandMaskLayer />
                <FitBoundsEffect coords={fitCoords} padding={48} maxZoom={12} />
                <MarkerLayer
                  id="statistics-route"
                  data={clusterGeoData}
                  cluster
                  color={clusterColor}
                  size={25}
                  unclusteredCountProperty="countLabel"
                  clusterSumProperty="countValue"
                  clusterColorSumProperty={hasOfflineInfo ? 'offlineFlag' : undefined}
                  textAnchor="center"
                  textOffset={[0, 0]}
                  textSize={13}
                  textColor={markerTextColor}
                  onClick={(_e, feature) => {
                    const navRoute = feature.properties?.navRoute as string | undefined
                    if (navRoute !== undefined) {
                      const navDetail = feature.properties?.navDetail as string | undefined
                      const query = navDetail ? `route=${encodeURIComponent(navRoute)}&detail=${encodeURIComponent(navDetail)}` : `route=${encodeURIComponent(navRoute)}`
                      router.push(`${detailUrl}?${query}`)
                      return
                    }
                    const navKey = feature.properties?.navKey as string | undefined
                    const item = navKey ? itemByNavKey.get(navKey) : undefined
                    if (item) handleMarkerClick(item)
                  }}
                />
              </>
            ) : (
              filteredRoutes.map((item, index) => {
                if (!item.lngLat) return null
                const count = getCount(item, index)
                const isOverflow = count > 263
                const bgColor = markerColorFn
                  ? markerColorFn(item, index)
                  : isOverflow ? '#E94C4C' : '#B2FF00'
                const shadow = bgColor === '#E94C4C' ? 'rgba(233,76,76,0.5)' : bgColor === '#FCD116' ? 'rgba(252,209,22,0.5)' : 'rgba(178,255,0,0.5)'
                return (
                  <HTMLMarker key={item.name} lngLat={item.lngLat}>
                    <div
                      onClick={() => handleMarkerClick(item)}
                      style={{
                        width: 50, height: 50, borderRadius: '50%',
                        backgroundColor: bgColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#000000',
                        boxShadow: `0 0 12px ${shadow}`,
                        cursor: 'pointer',
                      }}
                    >
                      {markerLabelFn ? markerLabelFn(item, index) : isOverflow ? '263+' : count}
                    </div>
                  </HTMLMarker>
                )
              })
            )}
          </BaseMap>
          {statsCards && statsCards.length > 0 && (
            <>
              <Button
                type='primary' shape='circle'
                title={cardsOpen ? 'ซ่อนการ์ดสถิติ' : 'แสดงการ์ดสถิติ'}
                icon={cardsOpen ? <TbLayoutSidebarRightCollapse className='fs-18' /> : <TbLayoutSidebarRightExpand className='fs-18' />}
                onClick={() => setCardsOpen((prev) => !prev)}
                className={`absolute! top-3 z-20 w-10! h-10! shadow-lg transition-[right] duration-300 ease-in-out ${cardsOpen ? 'right-[208px] sm:right-[258px] lg:right-[318px]' : 'right-3'}`}
              />
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pb-3 overflow-hidden transition-[width] duration-300 ease-in-out" style={{ width: cardsOpen ? undefined : 0 }}>
                <div className="flex flex-col gap-2 pb-3">
                  {statsCards.map((card, i) => (
                    <div key={i} className="w-[200px] sm:w-[250px] lg:w-[310px] h-[120px] sm:h-[145px] lg:h-[175px] rounded-[12px] border-2 border-solid bg-[#333333]/80 backdrop-blur-[10px] p-2.5 sm:p-3 lg:p-3.5 flex flex-col justify-between shrink-0" style={{ borderColor: card.borderColor }}>
                      <div className="flex flex-col gap-0.5 sm:gap-1 overflow-visible">
                        <img src={card.icon} alt="" className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 shrink-0" />
                        <p
                          lang="th"
                          className="text-[10px] sm:text-[11px] lg:text-sm font-bold m-0 pt-0.5 leading-[1.65] overflow-visible"
                          style={{ color: card.labelColor }}
                        >
                          {card.label}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-0.5 sm:gap-1">
                        <span className="text-base sm:text-lg lg:text-[28px] font-bold text-white leading-none">{card.value}</span>
                        {card.unit && <span className="text-[8px] sm:text-[9px] lg:text-xs text-white">{card.unit}</span>}
                      </div>
                      <p className="text-[8px] sm:text-[9px] lg:text-xs text-[#979797] m-0 truncate">{card.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default StatisticsMapPanel
