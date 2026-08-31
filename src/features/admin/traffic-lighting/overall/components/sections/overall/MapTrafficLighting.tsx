"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ConfigProvider } from 'antd'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import DeviceMarkerLayer from '@/components/map/markers/DeviceMarkerLayer'
import RegionSummaryLayer, { REGION_DEVICE_MIN_ZOOM } from '@/components/map/markers/RegionSummaryLayer'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { theme } from '@/configs/antd/themeConfig'
import { useLightingOverview } from '@/hooks/queries/lighting'
import type { LightingOverviewListItem } from '@/types/lighting'
import {
  buildLightingDetailUrl,
  resolveLightingImei,
} from '@/features/admin/traffic-lighting/shared/lightingDetailNavigation'

interface Props {
  deptId: number
  roadId?: number | null
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
        project_id: loc.project?.id,
        road_id: loc.road?.id,
        budget_year: loc.project?.budget_year,
        contract_no: loc.project?.contract_no ?? '-',
        is_online: loc.lighting?.is_online ?? false,
        is_warranty: loc.is_warranty ?? false,
        equipment_count: loc.lighting?.equipment?.count ?? null,
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
  const equipmentCount = typeof p.equipment_count === 'number'
    ? p.equipment_count.toLocaleString()
    : '-'
  return (
    <div
      className={`min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)] ${isOnline ? 'border-cyan-400' : 'border-red-500'
        }`}
    >
      <p className={`fs-12 font-bold tracking-wide ${isOnline ? 'text-cyan-400' : 'text-red-400'}`}>
        Street Light · {String(p.code_name)}
      </p>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.solution_name)}
      </p>
      <p className={`fs-12 font-semibold mt-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
        ● {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
      </p>
      <p className='fs-12 text-slate-500 mt-0.5'>
        {equipLabel}: {equipmentCount} จุด
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
              const imei = resolveLightingImei(id, typeof p.imei === 'string' ? p.imei : undefined)
              onNavigate(buildLightingDetailUrl({
                routeId: id,
                imei,
                type: equipType,
                deptId,
              }))
            }}
          >
            <p className='fs-12 m-0'>ดูเพิ่มเติม</p>
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
        minZoom={REGION_DEVICE_MIN_ZOOM}
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

const MapTrafficLighting: React.FC<Props> = ({ deptId, roadId }) => {
  // Same query key shape as OverallContext's own useLightingOverview call
  // (deptId + roadId) — keeping them identical lets TanStack Query dedupe
  // the two call sites into a single request instead of firing it twice.
  const { data, isLoading, isSuccess, isError, refetch } = useLightingOverview(deptId, roadId)

  const centroidValid =
    !!data?.centroid && (data.centroid[0] !== 0 || data.centroid[1] !== 0)
  const initialCenter: [number, number] = centroidValid
    ? (data.centroid as [number, number])
    : FALLBACK_CENTER

  return (
    <div className='relative w-full h-full bg-[#050d1a]'>
      {/* edgeFade matches MapTrafficVolume — the vignette keeps markers near the
        * frame from colliding with the two overlay rails. */}
      <BaseMap initialCenter={initialCenter} initialZoom={5.2} edgeFade={{ all: 20 }}>
        {/* <ThailandMaskLayer maskColor='#0E0D0D' maskOpacity={0.8} /> */}
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        <RegionSummaryLayer type='Lighting' />
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
            <span className='text-yellow-400 fs-12'>กำลังโหลด...</span>
          </div>
        </div>
      )}
      {isError && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/60 z-10 rounded-lg'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <span className='text-red-300 fs-12'>ไม่สามารถโหลดข้อมูลแผนที่ได้</span>
            <Button size='small' onClick={() => void refetch()}>ลองใหม่</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(MapTrafficLighting)
