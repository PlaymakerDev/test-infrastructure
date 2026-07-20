"use client"
import BaseMap from '@/components/map/BaseMap'
import { useMap } from '@/components/map/hooks/useMap'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import { SYSTEM_BRIGHT } from '@/features/admin/dashboard/data/systems'
import { getVMSOverviewAPI } from '@/services/routes/VMSService'
import { useScopeAll } from '@/hooks/useScopeAll'
import { Location } from '@/types/vms/overview-api'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'
import { Button, ConfigProvider } from 'antd'
import { theme } from '@/configs/antd/themeConfig'
import { ModalVMSScreenProps, useOverallContext } from '../../../context'

const FALLBACK_CENTER: [number, number] = [98.97, 18.8]

type VmsFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Record<string, unknown>>

/** A usable [lng, lat] — drops null / malformed / [0,0]. One bad point makes
 *  Mapbox reject the WHOLE GeoJSON source → no markers at all. Hit for real
 *  on dept 0 + scope=all (6/296 vms locations had a null GeometryPoint). */
const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  !(g[0] === 0 && g[1] === 0)

const toGeoJSON = (locations: Location[]): VmsFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: locations.filter((loc) => isValidCoord(loc.GeometryPoint)).map((loc) => {
      return ({
        type: 'Feature',
        properties: {
          id: loc.solution.id,
          solution_name: loc.solution.solution_name,
          code_name: loc.road.code_name,
          is_online: loc.vms.status.is_online,
          is_warranty: loc.warranty.is_warranty,
          status_name: loc.vms.status.name,
          last_connected: loc.vms.last_connected,
          hls_url: loc.vms.hls_url,
          anydesk: loc.vms.anydesk,
          camera_id: loc.vms.camera?.id ?? null,
          camera_hls_url: loc.vms.camera?.hls_url ?? null,
          desktop_screen: loc.vms.desktop_screen ?? null,
        },
        geometry: { type: 'Point', coordinates: loc.GeometryPoint },
      })
    }),
  }
}

interface VMSPopupProps {
  feature: GeoJSON.Feature
  isOnline: boolean
  dispatch: ReturnType<typeof useAppDispatch>
  onNavigate: (path: string) => void
  setOpenVMSScreen: React.Dispatch<React.SetStateAction<ModalVMSScreenProps>>
}

const VMSPopup: React.FC<VMSPopupProps> = ({ feature, isOnline, onNavigate, setOpenVMSScreen }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div className='min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)' style={{ borderColor: SYSTEM_BRIGHT.VMS }}>
      <section>
        <HLSLivePlayer
          cameraId={String(p.id)}
          hlsUrl={String(p.desktop_screen)}
          enableViewportPause
          figureClassName="h-40 min-h-0 max-h-none w-full mb-2 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setOpenVMSScreen({ open: true, data: { solution_id: Number(p.id), desktop_screen: String(p.desktop_screen) } })}
        />
      </section>
      <section className='mt-1.5'>
        <h5>{String(p.solution_name)}</h5>
        <p className='fs-12 tracking-wide text-gray-400'>สายทาง : {String(p.code_name)}</p>
        <p className={`fs-12 font-semibold mt-0.5 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
        </p>
        <p className="fs-12 text-slate-500 mt-0.5">เชื่อมต่อล่าสุด : {String(p.last_connected)}</p>
      </section>
      <section className='mt-1.5'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
            onClick={() => onNavigate(`/admin/vms/detail/${p.id}?is_warranty=${p.is_warranty}&is_online=${p.is_online}`)}
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
  locations: Location[]
  centroid: number[]
  isReady: boolean
}

const VmsMarkerLayer: React.FC<MarkerLayerGroupProps> = ({ locations, centroid, isReady }) => {
  const { map, isLoaded } = useMap()
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { setOpenVMSScreen } = useOverallContext()

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
      type='VMS'
      id="vms"
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
          setOpenVMSScreen={setOpenVMSScreen}
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

const MapSection: React.FC<Props> = (props) => {
  const { deptId } = props
  // Reactive ?scope=all — subscribes this memo'd component to the URL so the
  // query key re-derives when scope toggles.
  const scope = useScopeAll() ? 'all' : 'own'

  const { data, isLoading, isSuccess } = useQuery({
    // dept + scope in the key — previously neither, so switching departments
    // or entry point (sidebar ↔ เมนูกลาง) reused the other's cached markers.
    queryKey: ['vms_overview', String(deptId ?? ''), scope],
    queryFn: () => getVMSOverviewAPI(Number(deptId)!),
    enabled: !!deptId,
    placeholderData: keepPreviousData
  })

  const centroidValid = data?.data.centroid[0] !== 0 || data?.data.centroid[1] !== 0
  const initialCenter = centroidValid
    ? (data?.data.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className="relative w-full h-full">
      <BaseMap
        initialCenter={initialCenter}
        edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
      >
        <VmsMarkerLayer
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

export default React.memo<Props>(MapSection)
