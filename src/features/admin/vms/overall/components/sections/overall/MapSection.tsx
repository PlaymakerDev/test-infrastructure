"use client"
import BaseMap from '@/components/map/BaseMap'
import { useMap } from '@/components/map/hooks/useMap'
import MarkerLayer from '@/components/map/primitives/MarkerLayer'
import { useAppSelector } from '@/stores/hooks'
import { Location } from '@/types/vms/overview-api'
import React, { useEffect, useMemo } from 'react'

const FALLBACK_CENTER: [number, number] = [98.97, 18.8]

type VmsFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>

const toGeoJSON = (locations: Location[]): VmsFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      properties: {
        id: loc.solution.id,
        solution_name: loc.solution.solution_name,
        code_name: loc.road.code_name,
        is_online: loc.vms.status.is_online,
        status_name: loc.vms.status.name,
        last_connected: loc.vms.last_connected,
      },
      geometry: { type: 'Point', coordinates: loc.GeometryPoint },
    })),
  }
}

const VMSPopup: React.FC<{ feature: GeoJSON.Feature; isOnline: boolean }> = ({ feature, isOnline }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div className={`min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)] ${isOnline ? 'border-cyan-400' : 'border-red-500'}`}>
      <p className={`fs-11 font-bold tracking-wide ${isOnline ? 'text-cyan-400' : 'text-red-400'}`}>
        VMS · {String(p.code_name)}
      </p>
      <p className="fs-14 font-semibold text-white leading-snug mt-0.5">
        {String(p.solution_name)}
      </p>
      <p className={`fs-11 font-semibold mt-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
        ● {String(p.status_name)}
      </p>
      {!!p.last_connected && (
        <p className="fs-11 text-slate-500 mt-0.5">
          เชื่อมต่อล่าสุด: {String(p.last_connected)}
        </p>
      )}
    </div>
  )
}

// ─── Marker layer — runs inside MapContext ────────────────────────────────────

interface MarkerLayerGroupProps {
  locations: Location[]
  centroid: number[]
  isReady: boolean
}

const VmsMarkerLayer: React.FC<MarkerLayerGroupProps> = ({ locations, centroid, isReady }) => {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || !isReady) return
    if (centroid[0] === 0 && centroid[1] === 0) return
    map.flyTo({ center: centroid as [number, number], zoom: 10, duration: 1200 })
  }, [map, isLoaded, isReady, centroid])

  const onlineData = useMemo(
    () => toGeoJSON(locations.filter((l) => l.vms.status.is_online)),
    [locations],
  )
  const offlineData = useMemo(
    () => toGeoJSON(locations.filter((l) => !l.vms.status.is_online)),
    [locations],
  )

  if (!isReady) return null

  return (
    <>
      <MarkerLayer
        id="vms-online"
        data={onlineData}
        cluster
        color="#22d3ee"
        size={14}
        popup={(f) => <VMSPopup feature={f} isOnline={true} />}
        popupOptions={{ offset: 10, closeButton: false }}
      />
      <MarkerLayer
        id="vms-offline"
        data={offlineData}
        cluster
        color="#ef4444"
        size={14}
        popup={(f) => <VMSPopup feature={f} isOnline={false} />}
        popupOptions={{ offset: 10, closeButton: false }}
      />
    </>
  )
}

// ─── MapSection ───────────────────────────────────────────────────────────────

interface Props { }

const MapSection: React.FC<Props> = () => {
  const { vms_overview, task_schedules } = useAppSelector(state => state.vms_overview)
  const { loading, status } = task_schedules.vms_overview
  const isReady = status === 'SUCCESS'

  const centroidValid = vms_overview.centroid[0] !== 0 || vms_overview.centroid[1] !== 0
  const initialCenter = centroidValid
    ? (vms_overview.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className="relative w-full h-full">
      <BaseMap
        initialCenter={initialCenter}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <VmsMarkerLayer
          locations={vms_overview.locations}
          centroid={vms_overview.centroid}
          isReady={isReady}
        />
      </BaseMap>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-400 text-xs">กำลังโหลด...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MapSection)
