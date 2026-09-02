"use client"
import React, { useMemo, useState } from 'react'
import BaseMap from '@/components/map/BaseMap'
import ThailandMaskLayer from '@/components/map/markers/ThailandMaskLayer'
import OverlapMarkers from '@/components/map/markers/OverlapMarkers'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import { useLightingOverview } from '@/hooks/queries/lighting'
import { useDeptId } from '@/hooks/useDeptId'
import { message, Tooltip } from 'antd'
import { TbClipboardCheck, TbClipboardCopy } from 'react-icons/tb'

export const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

const isValidCoord = (g: unknown): g is [number, number] =>
  Array.isArray(g) && g.length === 2 &&
  typeof g[0] === 'number' && typeof g[1] === 'number' &&
  (g[0] !== 0 || g[1] !== 0)

export interface MapLightingDetailProps {
  /** [lng, lat] — may be [0,0] when central/list omits GeometryPoint */
  coord: [number, number]
  /** Used to resolve coordinates from overview when `coord` is invalid */
  imei?: string
  isOnline?: boolean
  roadCode?: string
  installPoint?: string
  projectName?: string
}

const COPIED_RESET_MS = 2000

const DetailMapPopup: React.FC<{ feature: GeoJSON.Feature }> = ({ feature }) => {
  const p = feature.properties as Record<string, unknown>
  const [copied, setCopied] = useState(false)
  const connection = p.is_online === true
    ? 'online'
    : p.is_online === false
      ? 'offline'
      : 'unknown'
  const isOnline = connection === 'online'
  const statusColor = connection === 'unknown' ? '#979797' : isOnline ? '#66AEFF' : '#E94C4C'
  const statusLabel = connection === 'unknown' ? 'ไม่ทราบสถานะ' : isOnline ? 'ออนไลน์' : 'ออฟไลน์'

  const getLatLng = (coord: unknown) => isValidCoord(coord) ? [coord[1], coord[0]] : ['-', '-']

  const handleCopy = () => {
    navigator.clipboard.writeText(getLatLng(p.coord).join(', '))
    message.success('คัดลอกพิกัดแล้ว')
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  return (
    <div
      className='min-w-50 rounded-lg border px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
      style={{ borderColor: statusColor }}
    >
      <p className='fs-12 font-bold tracking-wide' style={{ color: statusColor }}>
        Street Light · {String(p.code_name ?? '-')}
      </p>
      <Tooltip title="กดเพื่อคัดลอกพิกัด">
        <div className='flex items-center gap-2 cursor-pointer' onClick={handleCopy}>
          <p className='fs-12 text-white/50 leading-snug mt-0.5'>
            {getLatLng(p.coord).join(', ')}
          </p>
          {copied
            ? <TbClipboardCheck className='text-green-500 fs-12' />
            : <TbClipboardCopy className='text-white/50 fs-12' />}
        </div>
      </Tooltip>
      <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
        {String(p.install_point ?? p.project_name ?? '-')}
      </p>
      <p className='fs-12 font-semibold mt-1.5' style={{ color: statusColor }}>
        ● {statusLabel}
      </p>
    </div>
  )
}

export function useResolvedCoord(coord: [number, number], imei?: string): [number, number] | null {
  const deptId = useDeptId()
  const { data } = useLightingOverview(deptId)

  if (isValidCoord(coord)) return coord
  const key = imei?.trim()
  if (!key || !data?.locations?.length) return null
  const loc = data.locations.find((l) => {
    if (l.imei && String(l.imei) === key) return true
    if (l.solution?.id != null && String(l.solution.id) === key) return true
    return false
  })
  return loc && isValidCoord(loc.GeometryPoint) ? loc.GeometryPoint! : null
}

/** Detail-page map — Thailand mask + the shared white detail-page pin. */
const MapLightingDetail: React.FC<MapLightingDetailProps> = ({
  coord,
  imei,
  isOnline,
  roadCode = '-',
  installPoint = '-',
  projectName = '-',
}) => {
  const resolvedCoord = useResolvedCoord(coord, imei)
  const initialCenter = resolvedCoord ?? FALLBACK_CENTER

  const coords = useMemo<[number, number][]>(
    () => (resolvedCoord ? [resolvedCoord] : []),
    [resolvedCoord],
  )

  const markerFeature = useMemo<GeoJSON.Feature<GeoJSON.Point> | null>(() => (
    resolvedCoord
      ? {
        type: 'Feature',
        properties: {
          is_online: isOnline,
          code_name: roadCode,
          install_point: installPoint,
          project_name: projectName,
          coord: resolvedCoord,
        },
        geometry: { type: 'Point', coordinates: resolvedCoord },
      }
      : null
  ), [installPoint, isOnline, projectName, resolvedCoord, roadCode])

  return (
    <div className='relative w-full h-full min-h-[inherit]'>
      <BaseMap
        initialCenter={initialCenter}
        initialZoom={14}
        initialPitch={55}
        initialBearing={-10}
        edgeFade={{ all: 20 }}
      >
        <ThailandMaskLayer maskColor='#212121' maskOpacity={1} />
        {resolvedCoord && markerFeature && (
          <>
            <FitBoundsEffect coords={coords} padding={56} maxZoom={16} pitch={55} />
            <OverlapMarkers
              variant='white'
              items={[{
                id: `traffic-lighting-detail-${imei ?? 'pin'}`,
                coord: resolvedCoord,
                title: installPoint,
                popup: <DetailMapPopup feature={markerFeature} />,
                popupOptions: { offset: 18, closeButton: false },
              }]}
            />
          </>
        )}
      </BaseMap>
    </div>
  )
}

export default React.memo(MapLightingDetail)
