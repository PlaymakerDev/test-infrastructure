"use client"
import BaseMap from '@/components/map/BaseMap'
import { useMap } from '@/components/map/hooks/useMap'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import { SYSTEM_BRIGHT } from '@/features/admin/dashboard/data/systems'
import { useScopeAll } from '@/hooks/useScopeAll'
import { BridgeLightingLocation } from '@/types/bridge-lighting/overall-api'
import { useAppDispatch } from '@/stores/hooks'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'
import { Button, ConfigProvider } from 'antd'
import { theme } from '@/configs/antd/themeConfig'
import { getBridgeLightingOverviewAPI } from '@/services/routes/BridgeLightingService'

const FALLBACK_CENTER: [number, number] = [98.97, 18.8]

type VmsFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>

/** A usable [lng, lat] — drops null / malformed / [0,0]. One bad point makes
 *  Mapbox reject the WHOLE GeoJSON source → no markers at all. Hit for real
 *  on dept 0 + scope=all (6/296 vms locations had a null GeometryPoint). */
const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  !(g[0] === 0 && g[1] === 0)

const toGeoJSON = (locations: BridgeLightingLocation[]): VmsFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: locations.filter((loc) => isValidCoord(loc.geometry_point)).map((loc) => {
      return ({
        type: 'Feature',
        properties: {
          id: loc.solution.id,
          solution_name: loc.solution.solution_name,
          code_name: loc.road.code_name,
          is_online: loc.is_online,
        },
        geometry: { type: 'Point', coordinates: loc.geometry_point },
      })
    }),
  }
}

interface VMSPopupProps {
  feature: GeoJSON.Feature
  isOnline: boolean
  dispatch: ReturnType<typeof useAppDispatch>
  onNavigate: (path: string) => void
}

const VMSPopup: React.FC<VMSPopupProps> = ({ feature, isOnline, onNavigate }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div className='min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)' style={{ borderColor: SYSTEM_BRIGHT.BridgeLighting }}>
      <section>
        <h4>{String(p.solution_name)}</h4>
      </section>
      <section className='mt-1.5'>
        <p className='fs-12 tracking-wide text-gray-400'>สายทาง : {String(p.code_name)}</p>
        <p className={`fs-12 font-semibold mt-0.5 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
        </p>
      </section>
      <section className='mt-1.5'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
            onClick={() => onNavigate(`/admin/bridge-lighting/detail/${p.id}?is_online=${p.is_online}`)}
          >
            <p className='fs-12'>ดูเพิ่มเติม</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

// ─── Marker layer — runs inside MapContext ────────────────────────────────────

interface MarkerLayerGroupProps {
  locations: BridgeLightingLocation[]
  centroid: number[]
  isReady: boolean
}

const BridgeLightingMarkerLayer: React.FC<MarkerLayerGroupProps> = ({ locations, centroid, isReady }) => {
  const { map, isLoaded } = useMap()
  const dispatch = useAppDispatch()
  const router = useRouter()

  useEffect(() => {
    if (!map || !isLoaded || !isReady) return
    if (centroid[0] === 0 && centroid[1] === 0) return
    map.flyTo({ center: centroid as [number, number], zoom: 10, duration: 1200 })
  }, [map, isLoaded, isReady, centroid])

  // Single VMS-typed marker layer — same icon/menu-color style as the other
  // overall maps (yellow-pin glyph via DeviceMarkerLayer). Online/offline is no
  // longer a marker color; the popup shows it (border stays the VMS accent, the
  // ● status text stays green/red).
  const allData = useMemo(() => toGeoJSON(locations), [locations])

  if (!isReady) return null

  return (
    <DeviceMarkerLayer
      type='BridgeLighting'
      id="bridge_lighting"
      data={allData}
      cluster
      size={18}
      strokeColor='#ffffff'
      popup={(f) => (
        <VMSPopup
          feature={f}
          isOnline={Boolean((f.properties as Record<string, unknown>)?.is_online)}
          dispatch={dispatch}
          onNavigate={router.push}
        />
      )}
      popupOptions={{ offset: 10, closeButton: false }}
    />
  )
}

// ─── MapSection ───────────────────────────────────────────────────────────────

interface Props {
  deptId?: string | string[] | number
}

const MapBridgeLighting: React.FC<Props> = (props) => {
  const { deptId } = props
  // Reactive ?scope=all — subscribes this memo'd component to the URL so the
  // query key re-derives when scope toggles.
  const scope = useScopeAll() ? 'all' : 'own'

  const { data, isLoading, isSuccess } = useQuery({
    // dept + scope in the key — previously neither, so switching departments
    // or entry point (sidebar ↔ เมนูกลาง) reused the other's cached markers.
    queryKey: ['bridge_lighting_overview', String(deptId ?? ''), scope],
    queryFn: () => getBridgeLightingOverviewAPI(Number(deptId)!, {}),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  // Guard the centroid access — the API returns `centroid: null` when the
  // scope has zero locations (real case: dept_id=0 + scope=all with no
  // bridge-lighting solutions granted to the caller). Without this guard,
  // `centroid[0]` threw "Cannot read properties of null (reading '0')" the
  // moment the page mounted, killing the whole overview render.
  const centroid = data?.data.centroid
  const centroidValid =
    Array.isArray(centroid) &&
    centroid.length === 2 &&
    typeof centroid[0] === 'number' &&
    typeof centroid[1] === 'number' &&
    !(centroid[0] === 0 && centroid[1] === 0)
  const initialCenter = centroidValid ? (centroid as [number, number]) : FALLBACK_CENTER

  return (
    <div className="relative w-full h-full">
      <BaseMap
        initialCenter={initialCenter}
        edgeFade={{ all: 10 }}
      >
        <BridgeLightingMarkerLayer
          locations={data?.data.locations || []}
          centroid={data?.data.centroid || [0, 0]}
          isReady={isSuccess}
        />
      </BaseMap>

      {isLoading && (
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

export default React.memo<Props>(MapBridgeLighting)
