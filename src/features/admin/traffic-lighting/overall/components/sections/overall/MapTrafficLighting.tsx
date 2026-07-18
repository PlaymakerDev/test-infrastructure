"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { theme } from '@/configs/antd/themeConfig'
import { useLightingOverview } from '@/hooks/queries/lighting'
import type { LightingOverviewListItem } from '@/types/lighting'

interface Props {
  deptId: number
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

type LightingFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  Record<string, unknown>
>

const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  (g[0] !== 0 || g[1] !== 0)

const toGeoJSON = (locations: LightingOverviewListItem[]): LightingFeatureCollection => {
  // Deduplicate by solution.id — the API returns one row per device (imei),
  // so the same solution appears multiple times at the same coordinate.
  // Keep one feature per unique solution to avoid inflated counts / stacked markers.
  const seen = new Set<number>()
  const features: GeoJSON.Feature<GeoJSON.Point, Record<string, unknown>>[] = []
  for (const loc of locations) {
    if (!isValidCoord(loc.GeometryPoint) || loc.solution?.id == null) continue
    const solId = loc.solution.id
    if (seen.has(solId)) continue
    seen.add(solId)
    features.push({
      type: 'Feature',
      properties: {
        id: loc.imei || String(solId),
        solution_id: solId,
        solution_name: loc.solution?.solution_name ?? '-',
        code_name: loc.road?.code_name ?? '-',
        project_name: loc.project?.project_name ?? loc.solution?.solution_name ?? '-',
        contract_no: loc.project?.contract_no ?? '-',
        is_online: loc.lighting?.is_online ?? false,
        is_warranty: loc.is_warranty ?? false,
        equipment_count: loc.lighting?.equipment?.count ?? 0,
        equipment_type: loc.lighting?.equipment?.type ?? '',
        imei: loc.imei ?? '',
        coord_lng: loc.GeometryPoint[0],
        coord_lat: loc.GeometryPoint[1],
      },
      geometry: { type: 'Point', coordinates: loc.GeometryPoint },
    })
  }
  return { type: 'FeatureCollection', features }
}

const LightingPopup: React.FC<{
  feature: GeoJSON.Feature
  isOnline: boolean
  deptId: number
  onNavigate: (path: string) => void
}> = ({ feature, isOnline, deptId, onNavigate }) => {
  const p = feature.properties as Record<string, unknown>
  const equipType = String(p.equipment_type ?? '')
  const equipLabel = equipType === 'lamp' ? 'โคมไฟ' : equipType === 'phase' ? 'ตู้ควบคุม' : 'อุปกรณ์'
  return (
    <div
      className={`min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)] ${
        isOnline ? 'border-cyan-400' : 'border-red-500'
      }`}
    >
      <p className={`fs-11 font-bold tracking-wide ${isOnline ? 'text-cyan-400' : 'text-red-400'}`}>
        Traffic Lighting · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p className={`fs-11 font-semibold mt-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
        ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
      </p>
      <p className='fs-11 text-slate-500 mt-0.5'>
        {equipLabel}: {Number(p.equipment_count ?? 0).toLocaleString()} จุด
        {p.imei ? ` · IMEI ${String(p.imei)}` : ''}
      </p>
      <section className='mt-2'>
        <ConfigProvider theme={{ ...theme.theme }}>
          <Button
            htmlType='button'
            type='primary'
            size='small'
            shape='round'
            block
            onClick={() => {
              const id = String(p.id)
              sessionStorage.setItem('lighting_detail_type', equipType)
              sessionStorage.setItem('lighting_detail_imei', String(p.imei || id))
              sessionStorage.setItem('lighting_detail_row', JSON.stringify({
                roadCode: String(p.code_name),
                projectName: String(p.project_name),
                installPoint: String(p.solution_name),
                bureau: '-',
                coord: [Number(p.coord_lng), Number(p.coord_lat)],
                warranty: p.is_warranty ? 'in-warranty' : 'expired',
                connection: isOnline ? 'online' : 'offline',
              }))
              const base = equipType === 'lamp'
                ? `/admin/traffic-lighting/detail/lamp/${id}`
                : `/admin/traffic-lighting/detail/${id}`
              const deptQuery = deptId ? `?dept_id=${deptId}` : ''
              onNavigate(`${base}${deptQuery}`)
            }}
          >
            <p className='fs-11 m-0'>ดูเพิ่มเติม</p>
          </Button>
        </ConfigProvider>
      </section>
    </div>
  )
}

interface MarkerLayerGroupProps {
  locations: LightingOverviewListItem[]
  deptId: number
  isReady: boolean
}

const LightingMarkerLayer: React.FC<MarkerLayerGroupProps> = ({ locations, deptId, isReady }) => {
  const router = useRouter()
  const allData = useMemo(() => toGeoJSON(locations), [locations])
  const coords = useMemo<[number, number][]>(
    () => locations.map((l) => l.GeometryPoint).filter(isValidCoord),
    [locations],
  )

  if (!isReady) return null

  return (
    <>
      <FitBoundsEffect coords={coords} padding={56} maxZoom={13} />
      <DeviceMarkerLayer
        type='Lighting'
        id='traffic-lighting'
        data={allData}
        cluster
        size={14}
        popup={(f) => (
          <LightingPopup
            feature={f}
            isOnline={Boolean((f.properties as Record<string, unknown>)?.is_online)}
            deptId={deptId}
            onNavigate={router.push}
          />
        )}
        popupOptions={{ offset: 10, closeButton: false }}
      />
    </>
  )
}

const MapTrafficLighting: React.FC<Props> = ({ deptId }) => {
  const { data, isLoading, isSuccess } = useLightingOverview(deptId)

  const centroidValid =
    !!data?.centroid && (data.centroid[0] !== 0 || data.centroid[1] !== 0)
  const initialCenter: [number, number] = centroidValid
    ? (data.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full bg-[#050d1a]'>
      <BaseMap initialCenter={initialCenter} initialZoom={5.2}>
        <ThailandMaskLayer maskColor='#0E0D0D' maskOpacity={0.8} />
        <LightingMarkerLayer
          locations={data?.locations ?? []}
          deptId={deptId}
          isReady={isSuccess}
        />
      </BaseMap>

      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg'>
          <div className='flex flex-col items-center gap-2'>
            <div className='w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin' />
            <span className='text-yellow-400 text-xs'>กำลังโหลด...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(MapTrafficLighting)
