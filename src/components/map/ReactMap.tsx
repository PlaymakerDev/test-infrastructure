"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapMouseEvent } from 'mapbox-gl'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { useMap } from './hooks/useMap'
import {
  PROVINCE_BY_CODE,
  PROVINCES,
  type Province,
} from '@/features/admin/dashboard/data/provinces'
import {
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'
import type { Device } from '@/features/admin/dashboard/data/mockDevices'
import { useProvinceDeptMap } from '@/features/admin/dashboard/data/useProvinceDeptMap'
import { useDashboardPosition } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import type { DashboardPositionLocation } from '@/types/dashboard/api'
import BaseMap from './BaseMap'
import ThailandMaskLayer, {
  PROVINCE_CLICK_LAYER_ID,
  PROVINCE_HOVER_FILL_ID,
  PROVINCE_HOVER_LINE_ID,
} from './markers/ThailandMaskLayer'
import DeviceClusterMarker from './markers/DeviceClusterMarker'
import OverlapStackMarker from './markers/OverlapStackMarker'
import StchSummaryMarker, { type StchSummary } from './markers/StchSummaryMarker'
import BureauMaskLayer, {
  BUREAU_CLICK_LAYER_ID,
  BUREAU_HOVER_FILL_ID,
  BUREAU_HOVER_LINE_ID,
} from './markers/BureauMaskLayer'
import { useBureauFeatures } from './hooks/useBureauFeatures'
import { BUREAU_STCH_SET } from '@/features/admin/dashboard/data/bureaus'
import SystemFilterPills from './overlays/SystemFilterPills'
import BreadcrumbBanner from './overlays/BreadcrumbBanner'
import MapSearchBox from './overlays/MapSearchBox'

const COUNTRY_VIEW = {
  center: [101.5, 14.0] as [number, number],
  zoom: 5.2,
}
const PROVINCE_ZOOM_THRESHOLD = 6.5
// Above this zoom, drop the province/bureau hover chrome (yellow outlines,
// parent-สำนัก glow, tooltip, pointer cursor). It's a country/province-picker
// affordance; once the user has drilled in enough to see roads/markers, the
// hover paints huge multi-province swaths of yellow that just obscure the map.
const HOVER_MAX_ZOOM = 10

// BE returns "Crosswalk" while the FE enum is "CrossWalk" (capital W). Other
// types match 1:1. Anything not in this map is rejected so the marker layer
// never plots an unknown type.
const TYPE_FROM_API: Record<string, SystemType> = {
  CCTV: 'CCTV',
  VMS: 'VMS',
  WIM: 'WIM',
  Lighting: 'Lighting',
  BridgeLighting: 'BridgeLighting',
  Tunnel: 'Tunnel',
  Counting: 'Counting',
  Crosswalk: 'CrossWalk',
  Analytic: 'Analytic',
  Traffic: 'Traffic',
  // LPR solutions are not in /manage/solution position yet (probed 2026-07-14,
  // 9 types only) — mapped ahead so markers appear the moment BE ships them.
  LPR: 'LPR',
}

const apiLocationToDevice = (loc: DashboardPositionLocation): Device | null => {
  const t = TYPE_FROM_API[loc.solution.solution_type_name]
  if (!t) return null
  const coord = loc.geometry_point
  if (!Array.isArray(coord) || coord.length !== 2) return null
  return {
    id: String(loc.solution.solution_id),
    type: t,
    unitId: loc.road.department_id ?? 0,
    stch: loc.road.stch ?? 0,
    coord: coord as [number, number],
    roadId: loc.road.id,
    road: loc.road.road_code,
    landmark: loc.road.road_name,
    solutionName: loc.solution.solution_name,
    // Optional online flag — becomes `undefined` while BE hasn't shipped the
    // joined field (currently rolling out). See DashboardPositionLocation doc.
    isOnline: typeof loc.is_online === 'boolean' ? loc.is_online : undefined,
  }
}

function nearestProvince(lng: number, lat: number): Province {
  let best = PROVINCES[0]
  let bestDist = Infinity
  for (const p of PROVINCES) {
    const dx = p.coord[0] - lng
    const dy = p.coord[1] - lat
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

/**
 * Tracks the province nearest to viewport center — updates on `moveend`.
 * Returns null when zoomed out below the province threshold.
 */
function useNearestProvince(threshold: number): Province | null {
  const { map, isLoaded } = useMap()
  const [province, setProvince] = useState<Province | null>(null)

  useEffect(() => {
    if (!map || !isLoaded) return
    const update = () => {
      if (map.getZoom() < threshold) {
        setProvince(null)
      } else {
        const c = map.getCenter()
        setProvince(nearestProvince(c.lng, c.lat))
      }
    }
    update()
    map.on('moveend', update)
    return () => {
      map.off('moveend', update)
    }
  }, [map, isLoaded, threshold])

  return province
}

interface DashboardMapContentProps {
  /** The dept the user landed with — reset button reverts to this. */
  originalDeptId: string
  /** True when the landing URL carried `scope=all`. Distinguishes the
   *  nationwide view (`dept_id=0&scope=all` — keep the country view, no
   *  auto-fly) from plain `dept_id=0` (sidebar ทช.ส่วนกลาง — a normal
   *  single-dept landing that flies to its own devices like any แขวง). */
  originalScopeAll?: boolean
  /** Called whenever the user's map interaction should rescope the cards
   *  (click a province, pan into one, or zoom out). Parent wires this into
   *  the `DeptIdOverrideContext.Provider` value so every card that reads
   *  `useDeptId()` refetches. URL is intentionally NOT touched — updating
   *  it via `router.replace` remounts the whole map and flickers. */
  onDeptIdChange: (id: string) => void
  /** Fires when the province context becomes ACTIVE — the nearest-province
   *  watcher resolves non-null after any drill-in (click a province, click a
   *  marker, pan/zoom in past the threshold). The dashboard screen uses this
   *  to end its landing "map-only" intro. May fire again on later province
   *  switches — the consumer is expected to be one-shot. */
  onProvinceActivate?: () => void
}

const DashboardMapContent: React.FC<DashboardMapContentProps> = ({
  originalDeptId,
  originalScopeAll = false,
  onDeptIdChange,
  onProvinceActivate,
}) => {
  const { map, isLoaded } = useMap()
  // Current CARD scope (comes back through DeptIdOverrideContext — the
  // parent screen feeds our own onDeptIdChange broadcasts into it). Used
  // only to compare before re-broadcasting; the markers do NOT use it.
  const deptId = useDeptId()
  const [visibleTypes, setVisibleTypes] = useState<Set<SystemType>>(
    () => new Set(SYSTEM_TYPES)
  )
  const province = useNearestProvince(PROVINCE_ZOOM_THRESHOLD)
  // province.code → dept_id (RBAC-scoped: only provinces the user has access to).
  const provinceDeptMap = useProvinceDeptMap()

  // MAP MARKERS use the login-time scope (`originalDeptId`), NOT the live
  // focused `deptId`. Zooming into a province must KEEP every road's pin on the
  // map — the whole device pool stays plotted regardless of which boundary is
  // in focus (product requirement: "ต้องยังคงเห็นหมุดของสายทางอื่นอยู่"). Only
  // the CARDS rescope to the focused dept via `deptId`. Fetching markers by
  // `deptId` instead would make the backend return only the focused province's
  // devices, so every other road's pin would vanish on zoom-in — do NOT do that.
  const { data: position } = useDashboardPosition(originalDeptId)
  // 18 bureau polygons — used for point-in-polygon reclassification of any
  // solution whose road.stch didn't land in 1..18 (บทช. under stch=0, plus
  // stch=20 กรมทางหลวง and stch=21 ด่านชั่งน้ำหนัก). Falls back to `null`
  // until the geojson loads — during that window we behave exactly like
  // before (stch straight from the API).
  const bureauFeatures = useBureauFeatures()

  // When the dashboard scopes to a single dept, zoom the map to that dept's
  // centroid so the user lands on their devices instead of a country-wide
  // view that hides them behind STCH summary markers. Only the NATIONWIDE
  // landing (dept 0 + scope=all) keeps the country-level view — plain
  // dept_id=0 is the sidebar's ทช.ส่วนกลาง entry and flies like any แขวง.
  // One-shot on mount.
  const flownForDeptRef = useRef<string | null>(null)
  const markFlown = useCallback((id: string) => {
    flownForDeptRef.current = id
  }, [])
  useEffect(() => {
    if (!map || !isLoaded) return
    if (originalDeptId === '0' && originalScopeAll) return
    if (flownForDeptRef.current === originalDeptId) return
    const c = position?.centroid
    if (!Array.isArray(c) || c.length !== 2 || (c[0] === 0 && c[1] === 0)) return
    markFlown(originalDeptId)

    // Fit to the bounding box of all devices in this dept's scope so the
    // user lands with EVERY device visible, no matter whether the dept is
    // a สำนัก (multi-จังหวัด, wide spread) or a แขวง (single จังหวัด,
    // tight spread). Falls back to a plain flyTo centroid @ 8.5 if there
    // aren't at least two points to compute a bbox from.
    const pts = (position?.locations ?? [])
      .map((l) => l.geometry_point)
      .filter((p): p is [number, number] =>
        Array.isArray(p) && p.length === 2 && (p[0] !== 0 || p[1] !== 0)
      )
    if (pts.length >= 2) {
      let minX = pts[0][0], minY = pts[0][1], maxX = pts[0][0], maxY = pts[0][1]
      for (const [x, y] of pts) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
      map.fitBounds([[minX, minY], [maxX, maxY]], {
        padding: { top: 90, right: 40, bottom: 100, left: 40 },
        // Cap at 10.5 so tight ขทช. clusters don't over-zoom past what
        // the device markers can meaningfully render. maxZoom < 6.5 would
        // also strand us below the province threshold (STCH summary
        // markers would still be showing) → guard the low end too.
        maxZoom: 10.5,
        pitch: 30,
        duration: 1400,
      })
    } else {
      map.flyTo({
        center: c as [number, number],
        zoom: 8.5,
        pitch: 30,
        duration: 1400,
      })
    }
  }, [map, isLoaded, originalDeptId, originalScopeAll, position?.centroid, position?.locations, markFlown])

  // Adapt API locations → Device + aggregate per-สทช. counts for the country-
  // level summary marker layer.
  //
  // Split devices into two buckets:
  //   • `singletons` — coords with exactly one device; rendered via the normal
  //     Mapbox cluster layer (preserves icon-by-system + Mapbox clustering at
  //     wider zooms).
  //   • `overlapGroups` — coords shared by ≥ 2 devices; rendered via
  //     OverlapStackMarker which collapses them to a count badge + spider
  //     fan-out on click. Keeps the API coord untouched (no jitter), so
  //     "where it is on the map" still matches reality.
  const { singletons, overlapGroups, stchSummaries } = useMemo(() => {
    const byCoord = new Map<string, Device[]>()
    // Per-stch accumulator — sum coords as we go, then divide at the end to
    // get the centroid. The marker lands on real devices instead of the mock
    // HQ from units.ts. Solutions whose raw stch is 0/20/21 (BKK บทช.,
    // กรมทางหลวง, ด่านชั่งน้ำหนัก) are reclassified with a point-in-polygon
    // check against the 18-bureau geojson: if the coord falls inside a
    // bureau polygon, it joins that bureau's bucket; otherwise it goes into
    // a single synthetic "ทช.ส่วนกลาง" bucket keyed as `0`. Result: the
    // country view shows exactly 18 (+1 central) markers instead of the
    // scattered 21-bucket set the BE returns raw.
    const stchAcc: Record<number, { count: number; sumLng: number; sumLat: number }> = {}
    for (const loc of position?.locations ?? []) {
      const dev = apiLocationToDevice(loc)
      if (!dev) continue
      const key = `${dev.coord[0].toFixed(6)},${dev.coord[1].toFixed(6)}`
      const arr = byCoord.get(key)
      if (arr) arr.push(dev)
      else byCoord.set(key, [dev])

      // Reclassify orphan stch (not one of 1..18) by spatial containment.
      // Skip the reclassification when the bureau geojson hasn't loaded
      // yet — falling back to the raw stch keeps prior behaviour.
      let bucketStch = dev.stch
      if (!BUREAU_STCH_SET.has(bucketStch) && bureauFeatures) {
        const hit = bureauFeatures.find((b) => {
          // Cheap bbox reject before the polygon test — 18 bboxes × N devices
          // dominates the loop, so this is where we save the most work.
          const [minX, minY, maxX, maxY] = b.bbox
          const [lng, lat] = dev.coord
          if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false
          return booleanPointInPolygon(dev.coord, b.feature)
        })
        // Central bucket keyed as 0 — 18 buckets 1..18 + this one → exactly
        // 19 aggregate markers on the country view (down from ~21 before).
        bucketStch = hit ? hit.stch : 0
      }

      const a = stchAcc[bucketStch] ?? (stchAcc[bucketStch] = { count: 0, sumLng: 0, sumLat: 0 })
      a.count++
      a.sumLng += dev.coord[0]
      a.sumLat += dev.coord[1]
    }
    const singles: Device[] = []
    const groups: Device[][] = []
    for (const g of byCoord.values()) {
      if (g.length === 1) singles.push(g[0])
      else groups.push(g)
    }
    const summaries: Record<number, StchSummary> = {}
    for (const [stch, a] of Object.entries(stchAcc)) {
      summaries[Number(stch)] = {
        count: a.count,
        centroid: [a.sumLng / a.count, a.sumLat / a.count],
      }
    }
    return { singletons: singles, overlapGroups: groups, stchSummaries: summaries }
  }, [position, bureauFeatures])

  // Refs keep the click handler's closure fresh without re-registering the
  // Mapbox listener on every render.
  const provinceDeptMapRef = useRef(provinceDeptMap)
  useEffect(() => { provinceDeptMapRef.current = provinceDeptMap }, [provinceDeptMap])
  const onDeptIdChangeRef = useRef(onDeptIdChange)
  useEffect(() => { onDeptIdChangeRef.current = onDeptIdChange }, [onDeptIdChange])
  const deptIdRef = useRef(deptId)
  useEffect(() => { deptIdRef.current = deptId }, [deptId])

  // Click a province polygon → immediate flyTo + broadcast the new dept
  // to every card via the parent-provided `onDeptIdChange`. NO URL update
  // (that would `router.replace`, which remounts BaseMap and flickers the
  // map back to COUNTRY_VIEW). Skips silently when the user has no RBAC
  // access to that province (`provinceDeptMap` omits those).
  useEffect(() => {
    if (!map || !isLoaded) return
    const onClick = (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      // Guard 1 — clicks coming through HTML overlays (spider-fan markers,
      // STCH summary badges, popup buttons like "ดูเพิ่มเติม") bubble up to
      // the map container and register as map clicks on this full-coverage
      // hitbox. Their DOM target is the overlay element, NOT the canvas —
      // skip them, otherwise clicking a fanned-out marker/popup makes the
      // map fly away mid-interaction and the popup becomes unclickable.
      if (e.originalEvent && e.originalEvent.target !== map.getCanvas()) return
      // Guard 2 — canvas clicks that land ON a device marker / cluster
      // (symbol+circle layers all named `markerlayer-*`). Those clicks
      // belong to the marker's own popup handler; a province fly here
      // would immediately close the popup it just opened.
      const markerLayerIds = (map.getStyle()?.layers ?? [])
        .map((l) => l.id)
        .filter((id) => id.startsWith('markerlayer-'))
      if (markerLayerIds.length > 0) {
        const hits = map.queryRenderedFeatures(e.point, { layers: markerLayerIds })
        if (hits.length > 0) return
      }
      const feature = e.features?.[0]
      const code = feature?.properties?.code as string | undefined
      if (!code) return
      const nextDeptId = provinceDeptMapRef.current.get(code)
      if (nextDeptId == null) return  // no RBAC access → no-op
      const p = PROVINCE_BY_CODE[code] as Province | undefined
      if (!p) return
      const nextStr = String(nextDeptId)
      // Hide the hover outline/tooltip — the map is about to fly, so the
      // affordance for "what you're about to click" is no longer relevant
      // (and would otherwise linger until the next mouse move).
      clearHover()
      // Suppress the auto-fly effect below — we're already flying here.
      markFlown(nextStr)
      map.flyTo({
        center: p.coord,
        zoom: 9.5,
        pitch: 30,
        duration: 1400,
      })
      if (nextStr !== deptIdRef.current) onDeptIdChangeRef.current(nextStr)
    }
    // ── Hover affordance — outline the province under the cursor + a small
    // tooltip with its name, so the user knows WHAT they're about to click
    // (province shapes are hard to identify at country zoom). Only provinces
    // the user can actually open (RBAC map) get the highlight + pointer.
    const container = map.getContainer()
    const tooltip = document.createElement('div')
    tooltip.style.cssText =
      'position:absolute;z-index:30;pointer-events:none;display:none;' +
      'padding:6px 10px;border-radius:8px;background:rgba(5,13,26,0.95);' +
      'border:1px solid rgba(252,209,22,0.6);box-shadow:0 2px 10px rgba(0,0,0,0.5);' +
      'font-size:12px;line-height:1.35;white-space:nowrap;color:#fff'
    container.appendChild(tooltip)
    let hoverCode: string | null = null

    const clearHover = () => {
      hoverCode = null
      map.getCanvas().style.cursor = ''
      tooltip.style.display = 'none'
      const noneFilter = ['==', ['get', 'code'], '__none__'] as Parameters<typeof map.setFilter>[1]
      if (map.getLayer(PROVINCE_HOVER_LINE_ID)) map.setFilter(PROVINCE_HOVER_LINE_ID, noneFilter)
      if (map.getLayer(PROVINCE_HOVER_FILL_ID)) map.setFilter(PROVINCE_HOVER_FILL_ID, noneFilter)
      // Also drop the parent-bureau highlight — same "clear everything" reset.
      const noneStch = ['==', ['get', 'stch'], -1] as Parameters<typeof map.setFilter>[1]
      if (map.getLayer(BUREAU_HOVER_LINE_ID)) map.setFilter(BUREAU_HOVER_LINE_ID, noneStch)
    }

    const onMove = (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      // Zoomed past the picker range — no more province/bureau highlight.
      if (map.getZoom() >= HOVER_MAX_ZOOM) { clearHover(); return }
      // Cursor is over an HTML overlay (marker/badge/popup) — not the map.
      if (e.originalEvent && e.originalEvent.target !== map.getCanvas()) { clearHover(); return }
      const code = e.features?.[0]?.properties?.code as string | undefined
      const province = code ? (PROVINCE_BY_CODE[code] as Province | undefined) : undefined
      const accessible = code != null && provinceDeptMapRef.current.has(code)
      if (!code || !province || !accessible) { clearHover(); return }
      map.getCanvas().style.cursor = 'pointer'
      if (hoverCode !== code) {
        hoverCode = code
        const filter = ['==', ['get', 'code'], code] as Parameters<typeof map.setFilter>[1]
        if (map.getLayer(PROVINCE_HOVER_LINE_ID)) map.setFilter(PROVINCE_HOVER_LINE_ID, filter)
        if (map.getLayer(PROVINCE_HOVER_FILL_ID)) map.setFilter(PROVINCE_HOVER_FILL_ID, filter)
        // Cross-highlight the PARENT สำนัก outline (yellow line spanning every
        // จังหวัด in the same สทช.) so the user sees the wider scope this
        // จังหวัด belongs to — the whole multi-province polygon glows in
        // hoverColor while the single จังหวัด lights up in the fill+line above.
        const bureauFilter = ['==', ['get', 'stch'], province.stch] as Parameters<typeof map.setFilter>[1]
        if (map.getLayer(BUREAU_HOVER_LINE_ID)) map.setFilter(BUREAU_HOVER_LINE_ID, bureauFilter)
        tooltip.innerHTML =
          `<div style="font-weight:600;color:#FCD116">จ.${province.name}</div>` +
          `<div style="font-size:11px;color:#66AEFF">สทช.${province.stch}</div>` +
          '<div style="font-size:10px;color:#9fb0c8">คลิกเพื่อดูข้อมูลจังหวัด</div>'
      }
      tooltip.style.display = 'block'
      tooltip.style.left = `${e.point.x + 14}px`
      tooltip.style.top = `${e.point.y + 14}px`
    }

    // HTML markers sit on top of the canvas and swallow mouse events, so the
    // layer's own mouseleave never fires when sliding onto one — this DOM
    // listener catches that and hides the stale tooltip/outline.
    const onDomMove = (ev: Event) => {
      if ((ev as globalThis.MouseEvent).target !== map.getCanvas()) clearHover()
    }
    container.addEventListener('mousemove', onDomMove)

    // Panning-with-zoom or fly-to may cross the HOVER_MAX_ZOOM boundary while
    // the cursor is still hovering the layer — mousemove won't fire until the
    // user actually moves, so a stale yellow highlight would linger. Listen
    // to zoom directly and clear as we cross the threshold.
    const onZoom = () => { if (map.getZoom() >= HOVER_MAX_ZOOM) clearHover() }
    map.on('click', PROVINCE_CLICK_LAYER_ID, onClick)
    map.on('mousemove', PROVINCE_CLICK_LAYER_ID, onMove)
    map.on('mouseleave', PROVINCE_CLICK_LAYER_ID, clearHover)
    map.on('zoom', onZoom)
    return () => {
      map.off('click', PROVINCE_CLICK_LAYER_ID, onClick)
      map.off('mousemove', PROVINCE_CLICK_LAYER_ID, onMove)
      map.off('mouseleave', PROVINCE_CLICK_LAYER_ID, clearHover)
      map.off('zoom', onZoom)
      container.removeEventListener('mousemove', onDomMove)
      tooltip.remove()
    }
  }, [map, isLoaded, markFlown])

  // Bureau layer hover + click — mirrors the province handler above, but
  // fires on `BUREAU_CLICK_LAYER_ID` (only exists while zoom < threshold).
  // Depends on `bureauFeatures` for tooltip metadata + centroid flyTo.
  useEffect(() => {
    if (!map || !isLoaded || !bureauFeatures) return
    const container = map.getContainer()
    const tooltip = document.createElement('div')
    tooltip.style.cssText =
      'position:absolute;z-index:30;pointer-events:none;display:none;' +
      'padding:6px 10px;border-radius:8px;background:rgba(5,13,26,0.95);' +
      'border:1px solid rgba(252,209,22,0.6);box-shadow:0 2px 10px rgba(0,0,0,0.5);' +
      'font-size:12px;line-height:1.35;white-space:nowrap;color:#fff'
    container.appendChild(tooltip)
    let hoverStch: number | null = null

    const clearHover = () => {
      hoverStch = null
      map.getCanvas().style.cursor = ''
      tooltip.style.display = 'none'
      const none = ['==', ['get', 'stch'], -1] as Parameters<typeof map.setFilter>[1]
      if (map.getLayer(BUREAU_HOVER_LINE_ID)) map.setFilter(BUREAU_HOVER_LINE_ID, none)
      if (map.getLayer(BUREAU_HOVER_FILL_ID)) map.setFilter(BUREAU_HOVER_FILL_ID, none)
    }

    const onMove = (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      if (e.originalEvent && e.originalEvent.target !== map.getCanvas()) { clearHover(); return }
      const stchRaw = e.features?.[0]?.properties?.stch
      const stch = typeof stchRaw === 'number' ? stchRaw : Number(stchRaw)
      if (!Number.isFinite(stch)) { clearHover(); return }
      const b = bureauFeatures.find((x) => x.stch === stch)
      if (!b) { clearHover(); return }
      map.getCanvas().style.cursor = 'pointer'
      if (hoverStch !== stch) {
        hoverStch = stch
        const filter = ['==', ['get', 'stch'], stch] as Parameters<typeof map.setFilter>[1]
        if (map.getLayer(BUREAU_HOVER_LINE_ID)) map.setFilter(BUREAU_HOVER_LINE_ID, filter)
        if (map.getLayer(BUREAU_HOVER_FILL_ID)) map.setFilter(BUREAU_HOVER_FILL_ID, filter)
        const summary = stchSummaries[stch]
        const count = summary?.count ?? 0
        tooltip.innerHTML =
          `<div style="font-weight:600;color:#FCD116">${b.name} (${b.baseProvince})</div>` +
          `<div style="font-size:11px;color:#e2e8f0">${count} จุดติดตั้ง</div>` +
          '<div style="font-size:10px;color:#9fb0c8">คลิกเพื่อดูข้อมูลสำนัก</div>'
      }
      tooltip.style.display = 'block'
      tooltip.style.left = `${e.point.x + 14}px`
      tooltip.style.top  = `${e.point.y + 14}px`
    }

    const onClick = (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
      // Same guards as the province click — skip clicks passing through HTML
      // overlays and clicks that land on marker layers.
      if (e.originalEvent && e.originalEvent.target !== map.getCanvas()) return
      const markerLayerIds = (map.getStyle()?.layers ?? [])
        .map((l) => l.id)
        .filter((id) => id.startsWith('markerlayer-'))
      if (markerLayerIds.length > 0) {
        const hits = map.queryRenderedFeatures(e.point, { layers: markerLayerIds })
        if (hits.length > 0) return
      }
      const stchRaw = e.features?.[0]?.properties?.stch
      const stch = typeof stchRaw === 'number' ? stchRaw : Number(stchRaw)
      const b = bureauFeatures.find((x) => x.stch === stch)
      if (!b) return
      clearHover()
      map.fitBounds(b.bbox, { padding: 60, duration: 1400, maxZoom: 9.5, pitch: 30 })
    }

    map.on('mousemove', BUREAU_CLICK_LAYER_ID, onMove)
    map.on('mouseleave', BUREAU_CLICK_LAYER_ID, clearHover)
    map.on('click', BUREAU_CLICK_LAYER_ID, onClick)
    return () => {
      map.off('mousemove', BUREAU_CLICK_LAYER_ID, onMove)
      map.off('mouseleave', BUREAU_CLICK_LAYER_ID, clearHover)
      map.off('click', BUREAU_CLICK_LAYER_ID, onClick)
      tooltip.remove()
    }
  }, [map, isLoaded, bureauFeatures, stchSummaries])

  const resetView = () => {
    if (!map) return
    // Revert dept scope to whatever the user landed with, so cards rescope
    // in sync with the "← ทั่วประเทศ" action. Suppress the auto-fly effect
    // (we're already flying to COUNTRY_VIEW here).
    markFlown(originalDeptId)
    map.flyTo({
      center: COUNTRY_VIEW.center,
      zoom: COUNTRY_VIEW.zoom,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    })
    if (deptId !== originalDeptId) onDeptIdChange(originalDeptId)
  }

  // ── Province watcher — broadcasts dept changes on EVERY map interaction
  // (pan/drag, marker-click flyTo, mousewheel zoom in). Driven by the
  // `province` state that `useNearestProvince` updates on each moveend.
  // Zooming out below the threshold makes province null → reverts to
  // `originalDeptId`. NO URL update — parent is expected to hold the
  // current dept in local state and feed it back via `DeptIdOverrideContext`.
  useEffect(() => {
    if (!map || !isLoaded) return
    if (!province) {
      if (deptId === originalDeptId) return
      markFlown(originalDeptId)
      onDeptIdChange(originalDeptId)
      return
    }
    const nextDeptId = provinceDeptMap.get(province.code)
    if (nextDeptId == null) return  // no RBAC access — keep the previous scope
    const nextStr = String(nextDeptId)
    if (nextStr === deptId) return
    markFlown(nextStr)
    onDeptIdChange(nextStr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [province, provinceDeptMap, map, isLoaded, originalDeptId, deptId])

  // Announce "province context is active" to the parent (see the prop doc).
  // Separate from the dept watcher above on purpose: this must fire even when
  // the province maps to the SAME dept the cards already show (e.g. clicking
  // กทม while landed on ส่วนกลาง dept 0) or to no dept at all (RBAC-omitted) —
  // the intro should still reveal the cards in those cases.
  const onProvinceActivateRef = useRef(onProvinceActivate)
  useEffect(() => { onProvinceActivateRef.current = onProvinceActivate }, [onProvinceActivate])
  useEffect(() => {
    if (province) onProvinceActivateRef.current?.()
  }, [province])

  return (
    <>
      <ThailandMaskLayer
        highlightedProvinceCode={province?.code ?? null}
        enableProvinceClick
      />
      {/* 18-สำนัก polygon overlay — visible ONLY at country zoom, hands off
        * to the province layer at PROVINCE_ZOOM_THRESHOLD. Hover + click are
        * wired below via the exported BUREAU_CLICK_LAYER_ID. */}
      <BureauMaskLayer hideAtZoom={PROVINCE_ZOOM_THRESHOLD} />
      {/* Unique-coord devices → normal Mapbox cluster (icon per system type). */}
      <DeviceClusterMarker
        devices={singletons}
        visibleTypes={visibleTypes}
        minZoom={PROVINCE_ZOOM_THRESHOLD}
      />
      {/* Coords shared by ≥ 2 devices → count badge + spider fan-out so each
        * device stays individually clickable without faking its location. */}
      {overlapGroups.map((group) => (
        <OverlapStackMarker
          key={`${group[0].coord[0]},${group[0].coord[1]}`}
          group={group}
          center={group[0].coord}
          visibleTypes={visibleTypes}
          minZoom={PROVINCE_ZOOM_THRESHOLD}
        />
      ))}
      <StchSummaryMarker summaries={stchSummaries} hideAtZoom={PROVINCE_ZOOM_THRESHOLD} />

      <SystemFilterPills
        value={visibleTypes}
        onChange={setVisibleTypes}
        visible={!!province}
        top={92}
      />
      <BreadcrumbBanner province={province} onReset={resetView} top={144} />
      {/* Road-code search — nationwide autocomplete against /manage/roads.
        * Uses the already-fetched position payload to fly to the road's first
        * known device without a second network hop. */}
      <MapSearchBox positions={position?.locations ?? []} />
    </>
  )
}

interface ReactMapProps {
  originalDeptId: string
  originalScopeAll?: boolean
  onDeptIdChange: (id: string) => void
  onProvinceActivate?: () => void
}

const ReactMap: React.FC<ReactMapProps> = ({
  originalDeptId,
  originalScopeAll,
  onDeptIdChange,
  onProvinceActivate,
}) => {
  return (
    <BaseMap
      initialCenter={COUNTRY_VIEW.center}
      initialZoom={COUNTRY_VIEW.zoom}
    >
      <DashboardMapContent
        originalDeptId={originalDeptId}
        originalScopeAll={originalScopeAll}
        onDeptIdChange={onDeptIdChange}
        onProvinceActivate={onProvinceActivate}
      />
    </BaseMap>
  )
}

export default ReactMap
