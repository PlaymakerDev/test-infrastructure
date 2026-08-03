"use client"
import React from 'react'
import { TbChevronDown } from 'react-icons/tb'
import { Collapse, Empty, Spin } from 'antd'
import { useRouter } from 'next/navigation'
import type { ExpressionSpecification } from 'mapbox-gl'
import BaseMap from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import MarkerLayer, { type MarkerColor, markerLayerSourceId } from '@/components/map/primitives/MarkerLayer'
import { showReactPopup } from '@/components/map/primitives/popupHelper'
import type { GeoJSONSource } from 'mapbox-gl'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import { SearchCard } from '@/components/search-card'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import DrawerMapSearchCard from './DrawerMapSearchCard'
import { type RouteItem, type RouteSubDepartment, type MapMarkerItem, routeKey, detailLabel, detailKey } from '../../../data/routeItems'

// basePath ('/atlas' in prod, '' in dev) — raw <img src> is NOT prefixed
// automatically like next/link, so prepend it manually (same as the sidebar
// logo). Production previously hot-patched this file with a hardcoded
// '/atlas/images/…'; this replaces that patch in an env-safe way.
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? ''

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
  /** Number shown inside the search-list bureau badge. Defaults to
   *  `item.sub3.length` (sub-department count) — override when the badge
   *  should reflect something else, e.g. `item.notiTotal` (incident count). */
  badgeValueFn?: (item: RouteItem, index: number) => number
  /** Sub-level (แขวง) badge value — mirrors `badgeValueFn` one level down.
   *  Defaults to `sub.detail.length` (the แขวง's own child count, mirroring the
   *  bureau default of `item.sub3.length`). */
  subBadgeValueFn?: (sub: RouteSubDepartment, index: number) => number
  /** Sub-level (แขวง) badge color — mirrors `badgeColorFn` one level down.
   *  Defaults to the same 0-gray / >263-red / else-green rule as the bureau. */
  subBadgeColorFn?: (sub: RouteSubDepartment, index: number) => string
  /** Numeric count backing the DEFAULT marker color/label threshold (green
   *  unless > 263, then red + "263+") AND the modern-marker cluster-bubble
   *  sum. Defaults to `item.sub3.length` when sub3 holds one entry per
   *  countable unit — override when `sub3` represents something else, e.g.
   *  live incident data where sub3 is one entry per แขวง (org unit, 1-6) and the
   *  actually-meaningful count is the total install points in `item.count`. */
  markerCountFn?: (item: RouteItem, index: number) => number
  /** Data source for both the ค้นหาสายทาง search list and the map markers. */
  routeItems?: RouteItem[]
  /** Opt-in: render markers via the shared ThailandMaskLayer + clustered
   *  MarkerLayer + FitBoundsEffect stack (same as the dashboard/CCTV maps)
   *  instead of the legacy plain HTMLMarker-per-item loop. */
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
  /** Count above which a marker/cluster is considered "overflow" — switches
   *  to `markerItemOverflowColor` (or the legacy path's hardcoded red) and
   *  shows `${threshold}+` instead of the exact count. Default 263. */
  markerOverflowThreshold?: number
  /** Opt-in: called when a markerItems-path point is clicked — either a
   *  single unclustered point (array of 1), or a "stuck" cluster whose
   *  merged points all share the exact same coordinate (e.g. several devices
   *  installed at one physical location, so zooming in can never visually
   *  separate them). Return JSX to show it in a popup anchored above the
   *  point instead of navigating straight to `detailUrl`; return
   *  null/undefined to fall through to the default (instant navigation for a
   *  single point, zoom-to-expand for a genuine multi-coordinate cluster).
   *  Omit entirely to keep every existing caller's behavior unchanged. */
  onMarkerGroupClick?: (items: MapMarkerItem[]) => React.ReactNode
  loading?: boolean
  error?: boolean
}

// Module-level constant — MarkerLayer includes `textOffset` in the
// dependency array of its rebuild-everything effect, so an inline `[0, 0]`
// literal here would recreate a new array reference on every render and
// trigger the same needless teardown/rebuild as an unmemoized `color`.
const MARKER_TEXT_OFFSET: [number, number] = [0, 0]
const EMPTY_ROUTE_ITEMS: RouteItem[] = []

const renderCount = (count: string) => {
  const [left, right] = count.split('/')
  const l = parseInt(left, 10)
  const r = parseInt(right, 10)
  if (l === r) return <span style={{ fontSize: "var(--fs-12)", fontWeight: 500, color: '#FFFFFF', width: 28, textAlign: 'right' }}>{count}</span>
  if (l === 0) return <span style={{ fontSize: "var(--fs-12)", fontWeight: 500, color: '#E94C4C', width: 28, textAlign: 'right' }}>{count}</span>
  return (
    <span style={{ fontSize: "var(--fs-12)", fontWeight: 500, width: 28, textAlign: 'right' }}>
      <span style={{ color: '#05F2DB' }}>{left}</span>
      <span style={{ color: '#FCD116' }}>/{right}</span>
    </span>
  )
}

// The rounded pill (dot + value) shown on the right of each bureau AND แขวง
// row. `maxChars` sizes every pill to one uniform width so short ("2") and long
// ("12867") values share the same footprint. Shared by both levels so they
// stay visually identical.
const renderBadge = (value: number | string, color: string, maxChars: number) => (
  <span
    style={{
      fontSize: "var(--fs-12)",
      fontWeight: 500,
      fontVariantNumeric: 'tabular-nums',
      color,
      minWidth: `calc(${maxChars}ch + 30px)`,
      height: 22,
      borderRadius: 88,
      border: `1px solid ${color}`,
      boxSizing: 'border-box',
      paddingInline: 8,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}
  >
    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
    {value}
  </span>
)

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
  badgeValueFn,
  subBadgeValueFn,
  subBadgeColorFn,
  markerCountFn,
  routeItems = EMPTY_ROUTE_ITEMS,
  useModernMarkers = false,
  markerItems,
  markerItemColor = '#B2FF00',
  markerItemOverflowColor = '#E94C4C',
  markerOverflowThreshold = 263,
  onMarkerGroupClick,
  loading = false,
  error = false,
}) => {
  const router = useRouter()

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
          const isOverflow = m.count > markerOverflowThreshold
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
              countLabel: isOverflow ? `${markerOverflowThreshold}+` : String(m.count),
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
        const isOverflow = count > markerOverflowThreshold
        const color = markerColorFn ? markerColorFn(item, index) : (isOverflow ? '#E94C4C' : '#B2FF00')
        const countLabel = markerLabelFn ? String(markerLabelFn(item, index)) : (isOverflow ? `${markerOverflowThreshold}+` : String(count))
        return {
          type: 'Feature' as const,
          properties: { navKey: routeKey(item), color, countLabel, countValue: count },
          geometry: { type: 'Point' as const, coordinates: item.lngLat },
        }
      }),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerItems, routableRoutes, markerColorFn, markerLabelFn, markerCountFn, markerItemColor, markerItemOverflowColor, markerOverflowThreshold])

  const fitCoords = React.useMemo(
    () => markerItems ? markerItems.map((m) => m.lngLat) : routableRoutes.map((item) => item.lngLat),
    [markerItems, routableRoutes]
  )

  // Groups markerItems sharing the EXACT same coordinate (e.g. several
  // devices installed at one physical location) — used by onMarkerGroupClick
  // to detect a "stuck" cluster that can never zoom-separate, as opposed to a
  // normal cluster of genuinely nearby-but-distinct points.
  const markerGroupsByCoord = React.useMemo(() => {
    if (!markerItems) return null
    const m = new Map<string, MapMarkerItem[]>()
    for (const it of markerItems) {
      const key = `${it.lngLat[0].toFixed(6)},${it.lngLat[1].toFixed(6)}`
      const arr = m.get(key)
      if (arr) arr.push(it)
      else m.set(key, [it])
    }
    return m
  }, [markerItems])

  // Cluster bubbles don't carry arbitrary per-feature properties, so a plain
  // `color` lookup would always fall back to a flat default. When items carry
  // online/offline status, `colorSum` (summed via clusterColorSumProperty)
  // lets a cluster bubble turn red if it contains ANY offline device.
  // Otherwise, a cluster's aggregated `sum` (via clusterSumProperty) is
  // checked against markerOverflowThreshold — e.g. a cluster summing to 155
  // installs turns overflow-red just like a single point would — falling
  // back to the per-feature `color` (unclustered points; already threshold-
  // colored in clusterGeoData above) or markerItemColor for a cluster with
  // no properties at all.
  // Memoized — MarkerLayer includes `color` in the dependency array of the
  // effect that tears down and rebuilds its Mapbox source + all 3 layers
  // (see MarkerLayer.tsx). A fresh array literal on every render (e.g. when
  // this panel toggles open/closed and re-renders for an unrelated reason)
  // was making Mapbox remove and re-add every marker on each toggle —
  // visible as the numbered circles flickering.
  const clusterColor: MarkerColor = React.useMemo(() => (
    hasOfflineInfo
      ? ['case', ['>', ['coalesce', ['get', 'colorSum'], ['get', 'offlineFlag'], 0], 0], markerItemOverflowColor, markerItemColor] as ExpressionSpecification
      : ['case', ['>', ['coalesce', ['get', 'sum'], 0], markerOverflowThreshold], markerItemOverflowColor, ['coalesce', ['get', 'color'], markerItemColor]] as ExpressionSpecification
  ), [hasOfflineInfo, markerItemOverflowColor, markerItemColor, markerOverflowThreshold])

  const handleMarkerClick = (item: RouteItem) => {
    if (onMarkerClick) {
      onMarkerClick(item)
    } else {
      router.push(`${detailUrl}?route=${encodeURIComponent(routeKey(item))}`)
    }
  }

  // Widest badge value in the current (filtered) list — every badge is sized
  // to this so short values ("2") and long ones ("12867") share one uniform
  // pill width instead of a fixed width clipping long values.
  const maxBadgeChars = React.useMemo(() => {
    if (hideIndexBadge) return 0
    const lengths = filteredRoutes.map((item, index) =>
      String(badgeValueFn ? badgeValueFn(item, index) : item.sub3.length).length,
    )
    return lengths.length ? Math.max(...lengths) : 1
  }, [filteredRoutes, badgeValueFn, hideIndexBadge])

  // Same uniform-width treatment for the แขวง (sub) badges — measured across
  // every sub row in the current (filtered) list so all sub pills share one
  // width, independent of the bureau pill width above.
  const maxSubBadgeChars = React.useMemo(() => {
    if (hideIndexBadge) return 0
    const lengths = filteredRoutes.flatMap((item) =>
      item.sub3.map((sub, i) => String(subBadgeValueFn ? subBadgeValueFn(sub, i) : sub.detail.length).length),
    )
    return lengths.length ? Math.max(...lengths) : 1
  }, [filteredRoutes, subBadgeValueFn, hideIndexBadge])

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
            <span style={{ fontSize: "var(--fs-12)", fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{item.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {!hideIndexBadge && (() => {
                const badgeColor = badgeColorFn
                  ? badgeColorFn(item, index)
                  : item.sub3.length === 0 ? '#979797' : item.sub3.length > 263 ? '#E94C4C' : '#B2FF00'
                const badgeValue = badgeValueFn ? badgeValueFn(item, index) : item.sub3.length
                return renderBadge(badgeValue, badgeColor, maxBadgeChars)
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
            items={item.sub3.map((sub, subIndex) => ({
              key: `${item.name}-${sub.label}`,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: "var(--fs-12)", fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0 }}>{sub.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                    {!hideIndexBadge && (() => {
                      const subBadgeColor = subBadgeColorFn
                        ? subBadgeColorFn(sub, subIndex)
                        : sub.detail.length === 0 ? '#979797' : sub.detail.length > 263 ? '#E94C4C' : '#B2FF00'
                      const subBadgeValue = subBadgeValueFn ? subBadgeValueFn(sub, subIndex) : sub.detail.length
                      return renderBadge(subBadgeValue, subBadgeColor, maxSubBadgeChars)
                    })()}
                    {!hideCount && sub.count && renderCount(sub.count)}
                  </div>
                </div>
              ),
              style: { marginBottom: 4 },
              classNames: { header: 'rounded-lg bg-[#4B4B4B]' },
              styles: { header: { borderRadius: 8, paddingBlock: 12, paddingInline: 16 }, content: { padding: '8px 0 0 0' }, body: { padding: 0 } },
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
                        <span style={{ fontSize: "var(--fs-12)", fontWeight: 400, color: '#FCD116', flex: 1, minWidth: 0, paddingLeft: 36 }}>{detailLabel(d)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <img src={isOnline ? `${BASE_PATH}/images/statistics/iconconnect.png` : `${BASE_PATH}/images/statistics/iconnoconnect.png`} alt={isOnline ? 'connected' : 'disconnected'} width={20} height={20} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ),
            }))}
          />
        ),
      }))}
    />
  )

  const searchCardContent = loading ? (
    <div className="flex min-h-40 items-center justify-center"><Spin /></div>
  ) : error ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่สามารถโหลดข้อมูลสายทาง" />
  ) : filteredRoutes.length === 0 ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบข้อมูลสายทาง" />
  ) : searchCardCollapse

  const hasNoMapData = !loading && !error && routeItems.length === 0 && (markerItems?.length ?? 0) === 0
  const mapState = loading ? <Spin /> : error ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่สามารถโหลดข้อมูลแผนที่" />
  ) : hasNoMapData ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบข้อมูลแผนที่" />
  ) : null

  return (
    <>
      {/* ══ MOBILE: drawer search card — outside flex to escape map stacking context ══ */}
      <DrawerMapSearchCard>
        <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => onSearchChange?.(value)}>
          {searchCardContent}
        </SearchCard>
      </DrawerMapSearchCard>

      {/* Map Focus Mode (same global toggle as the dashboard map) hides both
          side panels below via MapOverlayPanel — no per-page show/hide
          button needed; the map itself is full-bleed and never resizes. */}
      <div className="mt-8 relative overflow-hidden rounded-2xl" style={{ height: 'calc(100vh - 200px)' }}>

        {/* ══ MAIN: map, always full-size ══ */}
        <div className='absolute inset-0 transform-gpu'>
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
                  strokeWidth={0}
                  clusterStrokeWidth={0}
                  unclusteredCountProperty="countLabel"
                  clusterSumProperty="countValue"
                  countCapThreshold={markerOverflowThreshold}
                  clusterColorSumProperty={hasOfflineInfo ? 'offlineFlag' : undefined}
                  textAnchor="center"
                  textOffset={MARKER_TEXT_OFFSET}
                  textSize={13}
                  textColor={markerTextColor}
                  onClick={(e, feature) => {
                    const navRoute = feature.properties?.navRoute as string | undefined
                    if (navRoute !== undefined) {
                      const navDetail = feature.properties?.navDetail as string | undefined
                      if (onMarkerGroupClick && feature.geometry.type === 'Point') {
                        const coords = feature.geometry.coordinates as [number, number]
                        const item = markerItems?.find((m) => m.routeKey === navRoute && m.detailKey === navDetail)
                        const content = item ? onMarkerGroupClick([item]) : null
                        if (content) {
                          import('mapbox-gl').then(({ default: mb }) => {
                            showReactPopup({ map: e.target, mb, lngLat: coords, content, options: { offset: 18, closeButton: true, maxWidth: 'none' } })
                          })
                          return
                        }
                      }
                      const query = navDetail ? `route=${encodeURIComponent(navRoute)}&detail=${encodeURIComponent(navDetail)}` : `route=${encodeURIComponent(navRoute)}`
                      router.push(`${detailUrl}?${query}`)
                      return
                    }
                    const navKey = feature.properties?.navKey as string | undefined
                    const item = navKey ? itemByNavKey.get(navKey) : undefined
                    if (item) handleMarkerClick(item)
                  }}
                  onClusterClick={onMarkerGroupClick ? (e, clusterFeature) => {
                    if (clusterFeature.geometry.type !== 'Point') return
                    const coords = clusterFeature.geometry.coordinates as [number, number]
                    const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`
                    const group = markerGroupsByCoord?.get(key)
                    const content = group && group.length > 1 ? onMarkerGroupClick(group) : null
                    if (content) {
                      import('mapbox-gl').then(({ default: mb }) => {
                        showReactPopup({ map: e.target, mb, lngLat: coords, content, options: { offset: 18, closeButton: true } })
                      })
                      return
                    }
                    // Not a "stuck" same-coordinate cluster — fall back to the
                    // default zoom-to-expand behavior (providing onClusterClick
                    // replaces MarkerLayer's own default entirely).
                    const clusterId = clusterFeature.properties?.cluster_id
                    if (typeof clusterId !== 'number') return
                    const map = e.target
                    const src = map.getSource(markerLayerSourceId('statistics-route')) as GeoJSONSource
                    src.getClusterExpansionZoom(clusterId, (err, zoom) => {
                      if (err || zoom == null) return
                      map.flyTo({ center: coords, zoom: zoom + 0.3, duration: 800 })
                    })
                  } : undefined}
                />
              </>
            ) : (
              filteredRoutes.map((item, index) => {
                if (!item.lngLat) return null
                const count = getCount(item, index)
                const isOverflow = count > markerOverflowThreshold
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
                        fontSize: "var(--fs-12)", fontWeight: 700, color: '#000000',
                        boxShadow: `0 0 12px ${shadow}`,
                        cursor: 'pointer',
                      }}
                    >
                      {markerLabelFn ? markerLabelFn(item, index) : isOverflow ? `${markerOverflowThreshold}+` : count}
                    </div>
                  </HTMLMarker>
                )
              })
            )}
          </BaseMap>
        </div>

        {mapState && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45 pointer-events-none">
            <div className="rounded-xl bg-black/80 px-6 py-4 pointer-events-auto">{mapState}</div>
          </div>
        )}

        {/* ══ LEFT: SearchCard overlay — xl+ only, hidden by Map Focus Mode ══ */}
        <MapOverlayPanel
          position="left"
          className="absolute inset-y-0 left-0 z-20 w-[370px] max-xl:hidden bg-(--dark-black) rounded-r-lg shadow-2xl overflow-hidden"
        >
          <div className='w-[370px] h-full overflow-y-auto'>
            <SearchCard placeholder="ค้นหาสายทาง..." onChange={(value) => onSearchChange?.(value)} className="h-full">
              {searchCardContent}
            </SearchCard>
          </div>
        </MapOverlayPanel>

        {/* ══ RIGHT: stat cards overlay — hidden by Map Focus Mode ══ */}
        {statsCards && statsCards.length > 0 && (
          <MapOverlayPanel
            position="right"
            className="absolute top-3 right-3 z-10 flex flex-col gap-2 pb-3 w-[220px] sm:w-[290px] lg:w-[360px]"
          >
            {statsCards.map((card, i) => (
              <div key={i} className="min-h-[120px] sm:min-h-[145px] lg:min-h-[175px] rounded-[12px] border-2 border-solid bg-[#333333]/80 backdrop-blur-[10px] p-2.5 sm:p-3 lg:p-3.5 flex flex-col justify-between shrink-0" style={{ borderColor: card.borderColor }}>
                <div className="flex flex-col gap-0.5 sm:gap-1 overflow-visible">
                  <img src={card.icon} alt="" className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 shrink-0" />
                  <p
                    lang="th"
                    className="text-[10px] sm:fs-12 lg:fs-12 font-bold m-0 pt-0.5 leading-[1.65] overflow-visible"
                    style={{ color: card.labelColor }}
                  >
                    {card.label}
                  </p>
                </div>
                <div className="flex items-baseline gap-0.5 sm:gap-1">
                  <span className="text-base sm:text-lg lg:text-[28px] font-bold text-white leading-none">{card.value}</span>
                  {card.unit && <span className="text-[8px] sm:text-[9px] lg:fs-12 text-white">{card.unit}</span>}
                </div>
                <p className="text-[8px] sm:text-[9px] lg:fs-12 text-[#979797] m-0 line-clamp-2">{card.sub}</p>
              </div>
            ))}
          </MapOverlayPanel>
        )}
      </div>
    </>
  )
}

export default StatisticsMapPanel
