"use client"
import BaseMap from '@/components/map/BaseMap'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { SYSTEM_BRIGHT } from '@/features/admin/dashboard/data/systems'
import { useScopeAll } from '@/hooks/useScopeAll'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import { BridgeLightingLocation } from '@/types/bridge-lighting/overall-api'
import { useAppDispatch } from '@/stores/hooks'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { Button, ConfigProvider } from 'antd'
import { theme } from '@/configs/antd/themeConfig'
import { getBridgeLightingOverviewAPI } from '@/services/routes/BridgeLightingService'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'

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
  deptId: string
  scopeSuffix: string
}

const VMSPopup: React.FC<VMSPopupProps> = ({ feature, isOnline, onNavigate, deptId, scopeSuffix }) => {
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
            onClick={() =>
              // Detail page reads dept_id + scope from the URL to fetch its
              // location/wid/pm-chart/shelly hooks. Dropping either produced
              // a blank page — the hooks bail early on empty dept_id.
              onNavigate(
                `/admin/bridge-lighting/detail/${p.id}?dept_id=${encodeURIComponent(deptId)}&is_online=${p.is_online}${scopeSuffix}`,
              )
            }
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
  isReady: boolean
  deptId: string
  scopeSuffix: string
}

const BridgeLightingMarkerLayer: React.FC<MarkerLayerGroupProps> = ({ locations, isReady, deptId, scopeSuffix }) => {
  const dispatch = useAppDispatch()
  const router = useRouter()

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
          deptId={deptId}
          scopeSuffix={scopeSuffix}
        />
      )}
      popupOptions={{ offset: 10, closeButton: false }}
    />
  )
}

// ─── MapSection ───────────────────────────────────────────────────────────────

interface Props {
  deptId?: string | string[] | number
  roadId?: string | string[] | number
}

const MapBridgeLighting: React.FC<Props> = (props) => {
  const { deptId, roadId } = props
  // Reactive ?scope=all — subscribes this memo'd component to the URL so the
  // query key re-derives when scope toggles.
  const scope = useScopeAll() ? 'all' : 'own'

  const { data, isLoading, isSuccess } = useQuery({
    // dept + scope in the key — previously neither, so switching departments
    // or entry point (sidebar ↔ เมนูกลาง) reused the other's cached markers.
    queryKey: ['bridge_lighting_overview', String(deptId ?? ''), String(roadId ?? ''), scope],
    // Backend requires ?scope=all for the ส่วนกลาง view (dept_id=0) —
    // otherwise returns zero locations. Must match StatusBridgeLighting's
    // queryFn payload since the two consumers share this cache slot.
    queryFn: () => getBridgeLightingOverviewAPI(Number(deptId)!, roadId ? { road_id: Number(roadId), scope } : { scope }),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  // Fit to the REAL location bounds instead of trusting the backend centroid.
  // Prior version flew to `centroid` at fixed zoom 10 — but centroid is a
  // simple average, so a single outlier point (e.g. Phitsanulok while every
  // real bridge-lighting site is central Bangkok) pulled the view into empty
  // ocean. Mirrors the CCTV overall map, which uses FitBoundsEffect for the
  // same reason.
  const coords = useMemo<[number, number][]>(
    () =>
      (data?.data.locations ?? [])
        .filter((loc) => isValidCoord(loc.geometry_point))
        .map((loc) => loc.geometry_point as [number, number]),
    [data?.data.locations],
  )
  const scopeSuffix = scopeQuerySuffix()

  return (
    <div className="relative w-full h-full">
      <BaseMap
        initialCenter={FALLBACK_CENTER}
        initialZoom={5.4}
        edgeFade={{ all: 10 }}
      >
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <FitBoundsEffect coords={coords} padding={60} maxZoom={12} />
        <BridgeLightingMarkerLayer
          locations={data?.data.locations || []}
          isReady={isSuccess}
          deptId={String(deptId ?? '')}
          scopeSuffix={scopeSuffix}
        />
      </BaseMap>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-400 fs-12">กำลังโหลด...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo<Props>(MapBridgeLighting)
