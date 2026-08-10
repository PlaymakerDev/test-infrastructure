"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LngLatBoundsLike, MapMouseEvent } from 'mapbox-gl'
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
import { useDepartments } from '@/hooks/queries/manage'
import { useDashboardPosition } from '@/hooks/queries/dashboard'
import { useLPRPoints } from '@/hooks/queries/lpr'
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
import DeptSummaryMarker, { type DeptSummary } from './markers/DeptSummaryMarker'
import RoadSummaryMarker, { type RoadSummary } from './markers/RoadSummaryMarker'
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
// Aggregation ladder (2026-07-24): สทช. bubbles below 6.5 → ขทช./แขวง
// bubbles 6.5–9 → สายทาง (road) bubbles 9–11.5 → raw device markers above.
const ROAD_ZOOM_THRESHOLD = 9
const DEVICE_ZOOM_THRESHOLD = 11.5
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
  /** Fired when any device marker (singleton or overlap stack) is clicked. */
  onMarkerClick?: () => void
  /** `?road_id=` from the landing URL — the sidebar's สายทาง tab attaches it to
   *  every solution link, Dashboard included. The dashboard has no road-scoped
   *  endpoint, so scoping to a road means the MAP zooms into that road's
   *  devices on entry (see the road-landing effect). One-shot. */
  focusRoadId?: string | null
}

const DashboardMapContent: React.FC<DashboardMapContentProps> = ({
  originalDeptId,
  originalScopeAll = false,
  onDeptIdChange,
  onProvinceActivate,
  onMarkerClick,
  focusRoadId,
}) => {
  const { map, isLoaded } = useMap()
  // Current CARD scope (comes back through DeptIdOverrideContext — the
  // parent screen feeds our own onDeptIdChange broadcasts into it). Used
  // only to compare before re-broadcasting; the markers do NOT use it.
  const deptId = useDeptId()
  // "Road focus" — set when the user clicks a สายทาง bubble. While focused,
  // the road bubbles hide and the raw device markers render from the road
  // band (z ≥ 9) instead of z ≥ 11.5, so fitBounds can land WHEREVER the
  // whole road fits and every device on it stays in view (the previous
  // fixed clamp to the marker band cut long roads off — reported
  // 2026-07-24). Cleared when the user zooms back out past the ขทช. tier.
  const [roadFocus, setRoadFocus] = useState(false)
  useEffect(() => {
    if (!map || !isLoaded) return
    const onZoom = () => {
      if (map.getZoom() < ROAD_ZOOM_THRESHOLD) setRoadFocus(false)
    }
    map.on('zoom', onZoom)
    return () => {
      map.off('zoom', onZoom)
    }
  }, [map, isLoaded])
  const [visibleTypes, setVisibleTypes] = useState<Set<SystemType>>(
    () => new Set(SYSTEM_TYPES)
  )
  const province = useNearestProvince(PROVINCE_ZOOM_THRESHOLD)
  // province.code → dept_id (RBAC-scoped: only provinces the user has access to).
  const provinceDeptMap = useProvinceDeptMap()
  // Reverse of the above: dept_id → the province's CENTER coord. Anchors each
  // ขทช. summary bubble at the middle of its province (2026-08-05 request —
  // device means often sit at a province's edge or, with bad coords, in the
  // sea). ขทช. ↔ จังหวัด is 1:1, so first-wins is safe; กทม. maps dept 0.
  const deptProvinceCoord = useMemo(() => {
    const m = new Map<number, [number, number]>()
    for (const p of PROVINCES) {
      const id = provinceDeptMap.get(p.code)
      if (id != null && !m.has(id)) m.set(id, p.coord)
    }
    return m
  }, [provinceDeptMap])

  // MAP MARKERS use the login-time scope (`originalDeptId`), NOT the live
  // focused `deptId`. Zooming into a province must KEEP every road's pin on the
  // map — the whole device pool stays plotted regardless of which boundary is
  // in focus (product requirement: "ต้องยังคงเห็นหมุดของสายทางอื่นอยู่"). Only
  // the CARDS rescope to the focused dept via `deptId`. Fetching markers by
  // `deptId` instead would make the backend return only the focused province's
  // devices, so every other road's pin would vanish on zoom-in — do NOT do that.
  const { data: position, isFetched: positionFetched } = useDashboardPosition(originalDeptId)
  // LPR install points — /position has no LPR solution type, so the pins come
  // from the feature's own GET /lpr/points (same source as the LPR tile in
  // RatioChart and the lpr/overall page; solid, one fetch, 60s refetch).
  const { data: lprPoints } = useLPRPoints()
  // Dept list — used to map the landed dept's row id → its สทช. group so the
  // fly-to can fall back to the bureau polygon when the position endpoint
  // returns no device coords (see the fly-to effect below).
  const { data: departments } = useDepartments()
  // department id → short name (ขทช.xxx) — labels for the middle summary tier.
  const deptNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of departments ?? []) m.set(d.id, d.department_short_name)
    return m
  }, [departments])
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
  // (the fly-to effect itself lives below the roadSummaries memo — it reads
  // that map to know whether a ?road_id= landing will take over the fly)

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
  const { singletons, overlapGroups, stchSummaries, deptSummaries, roadSummaries } = useMemo(() => {
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
    // `t*` fields accumulate TRUSTED coords only (same rule as deptAcc below)
    // — placeholder coords like the [1,1] Counting7 batch under สทช.6 (found
    // 2026-08-03) otherwise drag the bureau bubble clean out of its region.
    const stchAcc: Record<number, {
      count: number; sumLng: number; sumLat: number
      tCount: number; tSumLng: number; tSumLat: number
    }> = {}
    // Per-ขทช. accumulator — keyed on road.department_id (dev.unitId).
    // Drives the middle DeptSummaryMarker tier (สทช. → ขทช. → สายทาง →
    // device markers). `t*` fields accumulate TRUSTED coords only (device
    // sits inside its own สทช.'s polygon) — a หลุดจังหวัด coordinate (e.g.
    // ขทช.พัทลุง devices stored at lat 20.29 = Laos, found 2026-07-24)
    // otherwise drags the bubble into the sea. Untrusted devices still count
    // and still render as markers; they just don't steer the bubble.
    const deptAcc: Record<number, {
      count: number; sumLng: number; sumLat: number
      tCount: number; tSumLng: number; tSumLat: number
    }> = {}
    // Per-สายทาง accumulator (keyed on road id) — third tier. Tracks the
    // device bbox too so clicking a road bubble can fit the whole stretch;
    // bbox likewise prefers trusted coords.
    const roadAcc: Record<number, {
      count: number; sumLng: number; sumLat: number; label: string
      minLng: number; minLat: number; maxLng: number; maxLat: number
      tCount: number; tSumLng: number; tSumLat: number
      tMinLng: number; tMinLat: number; tMaxLng: number; tMaxLat: number
    }> = {}
    // Coord sanity check — inside the bureau polygon the device CLAIMS via
    // road.stch. No polygon to check against (บทช./unknown stch, geojson not
    // loaded yet) → trust as-is.
    const isTrustedCoord = (dev: Device): boolean => {
      if (!bureauFeatures) return true
      const bf = bureauFeatures.find((b) => b.stch === dev.stch)
      if (!bf) return true
      const [minX, minY, maxX, maxY] = bf.bbox
      const [lng, lat] = dev.coord
      if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false
      return booleanPointInPolygon(dev.coord, bf.feature)
    }
    // LPR pins ride alongside the /position devices. Scoping mirrors the
    // RatioChart LPR tile (FE filter by department_id — /lpr/points is not
    // dept-scoped by BE). `lpr-` id prefix: an LPR point can be the SAME
    // solution as an existing /position marker (LPR rides on cameras), so a
    // bare solution_id could collide in marker keys; the popup's detail link
    // uses `detailId` (bare id) instead. stch=0 → the point-in-polygon
    // reclassification below files it under the right สทช. bucket.
    const lprDevices: Device[] = (lprPoints ?? [])
      .filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat) && !(p.lng === 0 && p.lat === 0))
      .filter((p) => !originalDeptId || originalDeptId === '0' || p.department_id === Number(originalDeptId))
      .map((p) => ({
        id: `lpr-${p.solution_id}`,
        detailId: String(p.solution_id),
        type: 'LPR' as SystemType,
        unitId: p.department_id ?? 0,
        stch: 0,
        coord: [p.lng, p.lat] as [number, number],
        roadId: p.road_id ?? 0,
        road: p.road_code ?? '',
        landmark: '',
        solutionName: p.solution_name,
      }))
    const positionDevices = (position?.locations ?? [])
      .map(apiLocationToDevice)
      .filter((d): d is Device => d !== null)
    for (const dev of [...positionDevices, ...lprDevices]) {
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

      const ok = isTrustedCoord(dev)

      const a = stchAcc[bucketStch] ?? (stchAcc[bucketStch] = {
        count: 0, sumLng: 0, sumLat: 0, tCount: 0, tSumLng: 0, tSumLat: 0,
      })
      a.count++
      a.sumLng += dev.coord[0]
      a.sumLat += dev.coord[1]
      if (ok) {
        a.tCount++
        a.tSumLng += dev.coord[0]
        a.tSumLat += dev.coord[1]
      }

      const d = deptAcc[dev.unitId] ?? (deptAcc[dev.unitId] = {
        count: 0, sumLng: 0, sumLat: 0, tCount: 0, tSumLng: 0, tSumLat: 0,
      })
      d.count++
      d.sumLng += dev.coord[0]
      d.sumLat += dev.coord[1]
      if (ok) {
        d.tCount++
        d.tSumLng += dev.coord[0]
        d.tSumLat += dev.coord[1]
      }

      const rid = dev.roadId ?? 0
      const r = roadAcc[rid] ?? (roadAcc[rid] = {
        count: 0, sumLng: 0, sumLat: 0,
        label: dev.road || `สายทาง #${rid}`,
        minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity,
        tCount: 0, tSumLng: 0, tSumLat: 0,
        tMinLng: Infinity, tMinLat: Infinity, tMaxLng: -Infinity, tMaxLat: -Infinity,
      })
      r.count++
      r.sumLng += dev.coord[0]
      r.sumLat += dev.coord[1]
      r.minLng = Math.min(r.minLng, dev.coord[0])
      r.minLat = Math.min(r.minLat, dev.coord[1])
      r.maxLng = Math.max(r.maxLng, dev.coord[0])
      r.maxLat = Math.max(r.maxLat, dev.coord[1])
      if (ok) {
        r.tCount++
        r.tSumLng += dev.coord[0]
        r.tSumLat += dev.coord[1]
        r.tMinLng = Math.min(r.tMinLng, dev.coord[0])
        r.tMinLat = Math.min(r.tMinLat, dev.coord[1])
        r.tMaxLng = Math.max(r.tMaxLng, dev.coord[0])
        r.tMaxLat = Math.max(r.tMaxLat, dev.coord[1])
      }
    }
    const singles: Device[] = []
    const groups: Device[][] = []
    for (const g of byCoord.values()) {
      if (g.length === 1) singles.push(g[0])
      else groups.push(g)
    }
    // Display anchor vs click target are SPLIT (2026-08-05): the bubble
    // renders at the region/province CENTER (stable, on land, never dragged
    // by device coords), while clicking still flies to the trusted device
    // mean so the user lands on the actual markers. Device mean keeps its
    // trusted-first rule (plain mean only when the whole bucket is
    // untrusted).
    const meanOf = (a: { count: number; sumLng: number; sumLat: number; tCount: number; tSumLng: number; tSumLat: number }): [number, number] =>
      a.tCount > 0
        ? [a.tSumLng / a.tCount, a.tSumLat / a.tCount]
        : [a.sumLng / a.count, a.sumLat / a.count]

    const summaries: Record<number, StchSummary> = {}
    for (const [stch, a] of Object.entries(stchAcc)) {
      const mean = meanOf(a)
      // Bureau polygon mid-point; ทช.ส่วนกลาง (bucket 0) has no polygon →
      // fall back to the device mean.
      const regionCenter = bureauFeatures?.find((b) => b.stch === Number(stch))?.centroid
      summaries[Number(stch)] = {
        count: a.count,
        centroid: regionCenter ?? mean,
        flyTo: mean,
      }
    }
    const deptSums: Record<number, DeptSummary> = {}
    for (const [id, a] of Object.entries(deptAcc)) {
      const mean = meanOf(a)
      // Province center for this ขทช.; depts with no mapped province (ids
      // missing from /departments, e.g. 100/101) fall back to the mean.
      const provCenter = deptProvinceCoord.get(Number(id))
      deptSums[Number(id)] = {
        count: a.count,
        centroid: provCenter ?? mean,
        flyTo: mean,
      }
    }
    const roadSums: Record<number, RoadSummary> = {}
    for (const [id, a] of Object.entries(roadAcc)) {
      roadSums[Number(id)] = {
        count: a.count,
        centroid: a.tCount > 0
          ? [a.tSumLng / a.tCount, a.tSumLat / a.tCount]
          : [a.sumLng / a.count, a.sumLat / a.count],
        label: a.label,
        bounds: a.tCount > 0
          ? [a.tMinLng, a.tMinLat, a.tMaxLng, a.tMaxLat]
          : [a.minLng, a.minLat, a.maxLng, a.maxLat],
      }
    }
    return { singletons: singles, overlapGroups: groups, stchSummaries: summaries, deptSummaries: deptSums, roadSummaries: roadSums }
  }, [position, lprPoints, originalDeptId, bureauFeatures, deptProvinceCoord])

  useEffect(() => {
    if (!map || !isLoaded) return
    if (originalDeptId === '0' && originalScopeAll) return
    if (flownForDeptRef.current === originalDeptId) return
    // A ?road_id= landing zooms into that ONE road instead (effect below).
    // Fall through to the dept centroid only once the payload has settled
    // without any device on that road — otherwise the two flies fight.
    if (focusRoadId && (!positionFetched || roadSummaries[Number(focusRoadId)])) return

    // Resolve WHERE this dept's data is, then fly straight in — mirroring what
    // clicking a สทช. summary marker does (flyTo province zoom), so a non-0
    // login lands drilled INTO its markers instead of the country overview.
    const pts = (position?.locations ?? [])
      .map((l) => l.geometry_point)
      .filter((p): p is [number, number] =>
        Array.isArray(p) && p.length === 2 && (p[0] !== 0 || p[1] !== 0)
      )
    const c = position?.centroid
    const validCentroid =
      Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0)
        ? (c as [number, number])
        : null

    // Centre priority: mean of the actual device coords (exactly where the
    // pins are) → BE-provided centroid → สำนัก polygon centroid (fallback for
    // scope=all on a สทช. the BE returns empty for; the สทช. row carries its
    // group=stch in /manage/departments, matched to the static bureau geojson).
    let center: [number, number] | null = null
    if (pts.length > 0) {
      let sx = 0, sy = 0
      for (const [x, y] of pts) { sx += x; sy += y }
      center = [sx / pts.length, sy / pts.length]
    } else if (validCentroid) {
      center = validCentroid
    } else if (positionFetched) {
      // Only fall back once the position query has settled (empty), so a slow
      // response can still win with the real device centroid above.
      const groupRaw = departments?.find((d) => d.id === Number(originalDeptId))?.department_group
      const stch = groupRaw != null ? Number(groupRaw) : NaN
      const bureau = Number.isFinite(stch) ? bureauFeatures?.find((b) => b.stch === stch) : undefined
      center = bureau?.centroid ?? null
    }

    if (!center) return
    markFlown(originalDeptId)
    // zoom 9.5 sits above PROVINCE_ZOOM_THRESHOLD (6.5) so the device markers
    // render (and the country summary bubbles hide) — same as a summary click.
    map.flyTo({ center, zoom: 9.5, pitch: 35, duration: 1500 })
  }, [map, isLoaded, originalDeptId, originalScopeAll, position?.centroid, position?.locations, positionFetched, departments, bureauFeatures, markFlown, focusRoadId, roadSummaries])

  // ── สายทาง landing (`?road_id=`) — the sidebar's สายทาง tab links EVERY
  // solution with `?dept_id=…&road_id=…&scope=all`; other features filter their
  // table by that road, but the dashboard's endpoints are dept-scoped only, so
  // road scope means "zoom the map into that road". Fits the road's device
  // bbox exactly like clicking its สายทาง bubble (RoadSummaryMarker), then
  // enters road focus so the raw device markers — not the bubble — render at
  // the fitted zoom. One-shot per road id; the user can pan away freely after.
  const flownRoadRef = useRef<string | null>(null)
  useEffect(() => {
    if (!map || !isLoaded) return
    if (!focusRoadId || flownRoadRef.current === focusRoadId) return
    // Waits for the position payload — roadSummaries is empty until it lands.
    const summary = roadSummaries[Number(focusRoadId)]
    if (!summary) return
    flownRoadRef.current = focusRoadId
    // Claim the dept fly-to so it can't re-trigger on a later position refetch.
    markFlown(originalDeptId)
    const bounds: LngLatBoundsLike = [
      [summary.bounds[0], summary.bounds[1]],
      [summary.bounds[2], summary.bounds[3]],
    ]
    const cam = map.cameraForBounds(bounds, { padding: 110, maxZoom: 14.5 })
    map.flyTo({
      center: (cam?.center as [number, number] | undefined) ?? summary.centroid,
      zoom: Math.max(typeof cam?.zoom === 'number' ? cam.zoom : 12.5, ROAD_ZOOM_THRESHOLD + 0.2),
      pitch: 40,
      duration: 1500,
    })
    // Set road focus only when the flight ENDS: the camera starts at country
    // zoom (5.2) and the zoom watcher above clears roadFocus on anything
    // below ROAD_ZOOM_THRESHOLD, so setting it up-front would be wiped
    // mid-flight.
    map.once('moveend', () => setRoadFocus(true))
  }, [map, isLoaded, focusRoadId, roadSummaries, originalDeptId, markFlown])

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
      // Province hover owns the 6.5–10 band ONLY. Below 6.5 the BUREAU hover
      // owns the map — both layers are hit-testable there, so without this
      // floor a single point popped BOTH tooltips stacked on top of each
      // other (reported 2026-08-05). Above 10 the picker chrome is gone.
      const z = map.getZoom()
      if (z >= HOVER_MAX_ZOOM || z < PROVINCE_ZOOM_THRESHOLD) { clearHover(); return }
      // Cursor is over an HTML overlay (marker/badge/popup) — not the map.
      if (e.originalEvent && e.originalEvent.target !== map.getCanvas()) { clearHover(); return }
      // Cursor is over a canvas-drawn device pin — the pin's own จุดติดตั้ง
      // tooltip owns that spot; showing the province box too stacked two
      // tooltips on top of each other (reported 2026-07-27).
      const overDevicePin = map
        .queryRenderedFeatures(e.point)
        .some((f) => f.layer?.id?.startsWith('markerlayer-') && f.layer.id.includes('device-'))
      if (overDevicePin) { clearHover(); return }
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

    // Panning-with-zoom or fly-to may cross either band boundary while the
    // cursor is still hovering the layer — mousemove won't fire until the
    // user actually moves, so a stale tooltip/highlight would linger. Listen
    // to zoom directly and clear as we leave the 6.5–10 band.
    const onZoom = () => {
      const z = map.getZoom()
      if (z >= HOVER_MAX_ZOOM || z < PROVINCE_ZOOM_THRESHOLD) clearHover()
    }
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
      // Bureau hover owns the country band only (< 6.5); past that the
      // จังหวัด hover takes over. The hitbox layer already carries
      // maxzoom 6.5, but delegated mousemove can still slip through right at
      // the boundary — belt-and-braces with the zoom guard below.
      if (map.getZoom() >= PROVINCE_ZOOM_THRESHOLD) { clearHover(); return }
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

    // Zooming with the cursor parked (click-to-zoom, scroll, fly-to) crosses
    // the 6.5 boundary without a mousemove — the tooltip + yellow highlight
    // then stuck on screen OVER the ขทช. bubbles (reported 2026-08-05).
    // Mirror the province handler: clear on zoom + on any mouse travel over
    // HTML overlays (markers swallow mousemove, so the layer's mouseleave
    // never fires when sliding onto one).
    const onZoom = () => { if (map.getZoom() >= PROVINCE_ZOOM_THRESHOLD) clearHover() }
    const onDomMove = (ev: Event) => {
      if ((ev as globalThis.MouseEvent).target !== map.getCanvas()) clearHover()
    }
    container.addEventListener('mousemove', onDomMove)
    map.on('zoom', onZoom)
    map.on('mousemove', BUREAU_CLICK_LAYER_ID, onMove)
    map.on('mouseleave', BUREAU_CLICK_LAYER_ID, clearHover)
    map.on('click', BUREAU_CLICK_LAYER_ID, onClick)
    return () => {
      map.off('mousemove', BUREAU_CLICK_LAYER_ID, onMove)
      map.off('mouseleave', BUREAU_CLICK_LAYER_ID, clearHover)
      map.off('click', BUREAU_CLICK_LAYER_ID, onClick)
      map.off('zoom', onZoom)
      container.removeEventListener('mousemove', onDomMove)
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
      {/* Unique-coord devices → normal Mapbox cluster (icon per system type).
        * Device markers start at DEVICE_ZOOM_THRESHOLD — the 6.5–9 band
        * belongs to the ขทช. summary tier below. */}
      <DeviceClusterMarker
        devices={singletons}
        visibleTypes={visibleTypes}
        minZoom={roadFocus ? ROAD_ZOOM_THRESHOLD : DEVICE_ZOOM_THRESHOLD}
        onClick={() => onMarkerClick?.()}
        onClusterClick={() => onMarkerClick?.()}
      />
      {/* Coords shared by ≥ 2 devices → count badge + spider fan-out so each
        * device stays individually clickable without faking its location. */}
      {overlapGroups.map((group) => (
        <OverlapStackMarker
          key={`${group[0].coord[0]},${group[0].coord[1]}`}
          group={group}
          center={group[0].coord}
          visibleTypes={visibleTypes}
          minZoom={roadFocus ? ROAD_ZOOM_THRESHOLD : DEVICE_ZOOM_THRESHOLD}
          onMarkerClick={onMarkerClick}
        />
      ))}
      {/* Country tier — สทช. bubbles. zoomOnClick 8 lands inside the ขทช.
        * band (6.5–9) so drilling reads สทช. → ขทช. → markers. */}
      <StchSummaryMarker
        summaries={stchSummaries}
        hideAtZoom={PROVINCE_ZOOM_THRESHOLD}
        zoomOnClick={8}
        onMarkerClick={onMarkerClick}
      />
      {/* Middle tier — ขทช./แขวง bubbles (6.5 ≤ z < 9). Clicking flies into
        * the สายทาง band + rescopes the dashboard cards to that แขวง. */}
      <DeptSummaryMarker
        summaries={deptSummaries}
        labels={deptNameById}
        minZoom={PROVINCE_ZOOM_THRESHOLD}
        hideAtZoom={ROAD_ZOOM_THRESHOLD}
        onSelect={(deptId) => {
          onMarkerClick?.()
          const next = String(deptId)
          markFlown(next)
          if (next !== deptIdRef.current) onDeptIdChangeRef.current(next)
        }}
      />
      {/* Third tier — สายทาง bubbles (9 ≤ z < 11.5). Clicking fits the road's
        * device bbox, hides this tier, and lets the raw markers render at the
        * fitted zoom (road-focus mode) so the WHOLE road stays in view. */}
      <RoadSummaryMarker
        summaries={roadSummaries}
        minZoom={ROAD_ZOOM_THRESHOLD}
        hideAtZoom={DEVICE_ZOOM_THRESHOLD}
        suppressed={roadFocus}
        onSelect={() => {
          onMarkerClick?.()
          setRoadFocus(true)
        }}
      />

      {/* Vertical rhythm under the navbar: search box 60–~100 → pills 112 →
        * breadcrumb 164. Pills previously started at 92, overlapping the
        * search row, with the breadcrumb hugging them at 144 (2026-07-20). */}
      <SystemFilterPills
        value={visibleTypes}
        onChange={setVisibleTypes}
        visible={!!province}
        top={112}
      />
      <BreadcrumbBanner province={province} onReset={resetView} top={164} />
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
  /** Fired when any device marker (singleton or overlap stack) is clicked. */
  onMarkerClick?: () => void
  /** `?road_id=` from the landing URL — zooms the map into that road's devices
   *  on entry (สายทาง-scoped landing from the sidebar). */
  focusRoadId?: string | null
}

const ReactMap: React.FC<ReactMapProps> = ({
  originalDeptId,
  originalScopeAll,
  onDeptIdChange,
  onProvinceActivate,
  onMarkerClick,
  focusRoadId,
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
        onMarkerClick={onMarkerClick}
        focusRoadId={focusRoadId}
      />
    </BaseMap>
  )
}

export default ReactMap
