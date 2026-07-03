"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMap } from './hooks/useMap'
import {
  PROVINCES,
  type Province,
} from '@/features/admin/dashboard/data/provinces'
import {
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'
import type { Device } from '@/features/admin/dashboard/data/mockDevices'
import { useDashboardPosition } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import type { DashboardPositionLocation } from '@/types/dashboard/api'
import BaseMap from './BaseMap'
import ThailandMaskLayer from './markers/ThailandMaskLayer'
import DeviceClusterMarker from './markers/DeviceClusterMarker'
import OverlapStackMarker from './markers/OverlapStackMarker'
import StchSummaryMarker, { type StchSummary } from './markers/StchSummaryMarker'
import SystemFilterPills from './overlays/SystemFilterPills'
import BreadcrumbBanner from './overlays/BreadcrumbBanner'

const COUNTRY_VIEW = {
  center: [101.5, 14.0] as [number, number],
  zoom: 5.2,
}
const PROVINCE_ZOOM_THRESHOLD = 6.5

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

const DashboardMapContent: React.FC = () => {
  const { map, isLoaded } = useMap()
  const deptId = useDeptId()
  const [visibleTypes, setVisibleTypes] = useState<Set<SystemType>>(
    () => new Set(SYSTEM_TYPES)
  )
  const province = useNearestProvince(PROVINCE_ZOOM_THRESHOLD)

  // All devices for the current dept (dept_id=0 → ทช.ส่วนกลาง returns the
  // nationwide pool, ~2,500 rows; dept_id=N returns that dept only).
  const { data: position } = useDashboardPosition(deptId)

  // When the dashboard scopes to a single dept (?dept_id=N, N ≠ 0), zoom the
  // map to that dept's centroid so the user lands on their devices instead of
  // a country-wide view that hides them behind STCH summary markers. dept 0 =
  // ทช.ส่วนกลาง (nationwide) keeps the country-level view.
  //
  // The fly is one-shot per dept change — once we've flown to dept N, we don't
  // re-fly on later position re-fetches (user may have panned/zoomed away).
  const flownForDeptRef = useRef<string | null>(null)
  useEffect(() => {
    if (!map || !isLoaded) return
    if (deptId === '0') return
    if (flownForDeptRef.current === deptId) return
    const c = position?.centroid
    if (!Array.isArray(c) || c.length !== 2 || (c[0] === 0 && c[1] === 0)) return
    flownForDeptRef.current = deptId
    map.flyTo({
      center: c as [number, number],
      // Above PROVINCE_ZOOM_THRESHOLD so device markers (not STCH summary) show.
      zoom: 9.5,
      pitch: 30,
      duration: 1400,
    })
  }, [map, isLoaded, deptId, position?.centroid])

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
    // HQ from units.ts (some stch values aren't in the mock at all).
    const stchAcc: Record<number, { count: number; sumLng: number; sumLat: number }> = {}
    for (const loc of position?.locations ?? []) {
      const dev = apiLocationToDevice(loc)
      if (!dev) continue
      const key = `${dev.coord[0].toFixed(6)},${dev.coord[1].toFixed(6)}`
      const arr = byCoord.get(key)
      if (arr) arr.push(dev)
      else byCoord.set(key, [dev])
      const a = stchAcc[dev.stch] ?? (stchAcc[dev.stch] = { count: 0, sumLng: 0, sumLat: 0 })
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
  }, [position])

  const resetView = () => {
    map?.flyTo({
      center: COUNTRY_VIEW.center,
      zoom: COUNTRY_VIEW.zoom,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    })
  }

  return (
    <>
      <ThailandMaskLayer highlightedProvinceCode={province?.code ?? null} />
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
      />
      <BreadcrumbBanner province={province} onReset={resetView} />
    </>
  )
}

const ReactMap: React.FC = () => {
  return (
    <BaseMap initialCenter={COUNTRY_VIEW.center} initialZoom={COUNTRY_VIEW.zoom}>
      <DashboardMapContent />
    </BaseMap>
  )
}

export default ReactMap
