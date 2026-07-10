"use client"
import BaseMap from '@/components/map/BaseMap'
import { useMap } from '@/components/map/hooks/useMap'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import { SYSTEM_BRIGHT } from '@/features/admin/dashboard/data/systems'
import { getVMSOverviewAPI } from '@/services/routes/VMSService'
import { Location } from '@/types/vms/overview-api'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'
import { Button, ConfigProvider } from 'antd'
import { theme } from '@/configs/antd/themeConfig'

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
        is_warranty: loc.warranty.is_warranty,
        status_name: loc.vms.status.name,
        last_connected: loc.vms.last_connected,
        hls_url: loc.vms.hls_url,
        anydesk: loc.vms.anydesk,
        camera_id: loc.vms.camera?.id ?? null,
        camera_hls_url: loc.vms.camera?.hls_url ?? null,
      },
      geometry: { type: 'Point', coordinates: loc.GeometryPoint },
    })),
  }
}

interface VMSPopupProps {
  feature: GeoJSON.Feature
  isOnline: boolean
  dispatch: ReturnType<typeof useAppDispatch>
  onNavigate: (path: string) => void
}

const VMSPopup: React.FC<VMSPopupProps> = ({ feature, isOnline, dispatch, onNavigate }) => {
  const p = feature.properties as Record<string, unknown>
  return (
    <div className='min-w-50 rounded-lg border px-3 py-2.5 bg-(--dark-black)' style={{ borderColor: SYSTEM_BRIGHT.VMS }}>
      <section>
        <HLSLivePlayer
          cameraId={String(p.camera_id ?? p.id)}
          hlsUrl={String(p.camera_hls_url ?? p.hls_url)}
          enableViewportPause
          figureClassName="h-40 min-h-0 max-h-none w-full mb-2 rounded-lg overflow-hidden cursor-pointer"
          onClick={() => dispatch(setCCTVModalOpen({ open: true, camera_id: String(p.camera_id) }))}
        />
      </section>
      <section className='mt-1.5'>
        <h5>{String(p.solution_name)}</h5>
        <p className='fs-11 tracking-wide text-gray-400'>สายทาง : {String(p.code_name)}</p>
        <p className={`fs-11 font-semibold mt-0.5 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          ● {String(p.status_name)}
        </p>
        <p className="fs-11 text-slate-500 mt-0.5">เชื่อมต่อล่าสุด : {String(p.last_connected)}</p>
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
            <p className='fs-11'>ดูเพิ่มเติม</p>
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

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['vms_overview'],
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
