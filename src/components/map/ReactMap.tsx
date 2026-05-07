"use client"
import { useEffect, useMemo, useState } from 'react'
import { useMap } from './hooks/useMap'
import {
  PROVINCES,
  type Province,
} from '@/features/admin/dashboard/data/provinces'
import {
  SYSTEM_TYPES,
  type SystemType,
} from '@/features/admin/dashboard/data/systems'
import { generateDevices } from '@/features/admin/dashboard/data/mockDevices'
import BaseMap from './BaseMap'
import ThailandMaskLayer from './markers/ThailandMaskLayer'
import DeviceClusterMarker from './markers/DeviceClusterMarker'
import StchSummaryMarker from './markers/StchSummaryMarker'
import SystemFilterPills from './overlays/SystemFilterPills'
import BreadcrumbBanner from './overlays/BreadcrumbBanner'

const COUNTRY_VIEW = {
  center: [101.5, 14.0] as [number, number],
  zoom: 5.2,
}
const PROVINCE_ZOOM_THRESHOLD = 6.5

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
  const { map } = useMap()
  const [visibleTypes, setVisibleTypes] = useState<Set<SystemType>>(
    () => new Set(SYSTEM_TYPES)
  )
  const province = useNearestProvince(PROVINCE_ZOOM_THRESHOLD)

  // Generate mock devices once + compute STCH counts
  const { devices, stchCounts } = useMemo(() => {
    const list = generateDevices()
    const counts: Record<number, number> = {}
    list.forEach((d) => {
      counts[d.stch] = (counts[d.stch] || 0) + 1
    })
    return { devices: list, stchCounts: counts }
  }, [])

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
      <DeviceClusterMarker
        devices={devices}
        visibleTypes={visibleTypes}
        minZoom={PROVINCE_ZOOM_THRESHOLD}
      />
      <StchSummaryMarker counts={stchCounts} hideAtZoom={PROVINCE_ZOOM_THRESHOLD} />

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
