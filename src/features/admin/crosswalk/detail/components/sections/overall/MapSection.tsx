"use client"
import React, { useMemo } from 'react'
import { TbMapPin } from 'react-icons/tb'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import OverlapMarkers, { type OverlapMarkerItem } from '@/components/map/markers/OverlapMarkers'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import type { CrosswalkCameraItem } from '@/types/crosswalk/detail-api'
import type { CrosswalkLocation } from '@/types/crosswalk/overview-api'

interface Props {
  /** Optional vignette overlay forwarded to BaseMap. */
  edgeFade?: MapEdgeFadeProps
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

const isValidCoord = (
  c: [number, number] | undefined | null,
): c is [number, number] =>
  Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0)

/** Popup card — camera preview + name, shown when a marker is clicked. Mirrors
 *  the Incident Detection detail map's popup. */
const CameraPopup: React.FC<{ cam: CrosswalkCameraItem }> = ({ cam }) => (
  <div
    style={{
      width: 270,
      background: 'rgba(14,14,14,0.97)',
      border: '1px solid #2f6db0',
      borderRadius: 12,
      padding: 10,
      fontFamily: 'ui-sans-serif,system-ui',
    }}
  >
    <HLSLivePlayer
      cameraId={cam.id}
      hlsUrl={cam.hls_url}
      showLiveBadge
      enableViewportPause
      figureClassName='h-36 min-h-0 max-h-none w-full mb-2 rounded-lg overflow-hidden'
    />
    <p style={{ fontSize: 12, color: '#66AEFF', fontWeight: 600, lineHeight: 1.35, margin: '0 0 6px' }}>
      {cam.camera_name}
    </p>
  </div>
)

/** Popup shown for the solution-level fallback marker (when the /cameras
 *  endpoint has no coords for this solution). */
const SolutionFallbackPopup: React.FC<{ location: CrosswalkLocation }> = ({
  location,
}) => (
  <div
    className='rounded-lg border border-yellow-400 px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
    style={{ width: 260 }}
  >
    <p className='fs-11 font-bold tracking-wide text-yellow-400'>
      Crosswalk · {location.road.code_name}
    </p>
    <p className='fs-14 font-semibold text-white leading-snug mt-0.5'>
      {location.solution.solution_name}
    </p>
  </div>
)

/** Detail map — uses the shared overlap-aware marker layer (`OverlapMarkers`,
 *  same grouping as Incident Detection detail): cameras sharing a coordinate
 *  fan out (spider) into individually-clickable pins, each opening a popup with
 *  a live preview. All pins are white teardrops (`variant='white'`). Falls back
 *  to a single solution-level pin when the /cameras endpoint has no coords. */
const MapSection: React.FC<Props> = ({ edgeFade }) => {
  const deptId = useDeptId()
  const { id, location } = useDetailContext()
  const { data } = useCrosswalkCameras(deptId, { solution_id: id })

  const cameras = useMemo(
    () => (data?.cameras ?? []).filter((c) => isValidCoord(c.geometry_point)),
    [data],
  )

  const coords = useMemo<[number, number][]>(
    () => cameras.map((c) => c.geometry_point as [number, number]),
    [cameras],
  )

  const markerItems = useMemo<OverlapMarkerItem[]>(
    () =>
      cameras.map((cam) => ({
        id: cam.id,
        coord: cam.geometry_point as [number, number],
        title: cam.camera_name,
        popup: <CameraPopup cam={cam} />,
        popupOptions: { offset: 22, closeButton: true, maxWidth: '300px' },
      })),
    [cameras],
  )

  const fallbackCoord = location?.GeometryPoint
  const hasCoordCams = cameras.length > 0

  const initialCenter: [number, number] = hasCoordCams
    ? (isValidCoord(data?.centroid) ? data!.centroid! : coords[0])
    : (isValidCoord(fallbackCoord) ? fallbackCoord : FALLBACK_CENTER)
  const initialZoom = hasCoordCams ? 15 : isValidCoord(fallbackCoord) ? 16 : 5.5

  return (
    <BaseMap
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      initialPitch={55}
      initialBearing={-10}
      edgeFade={edgeFade}
    >
      {hasCoordCams ? (
        <>
          <FitBoundsEffect coords={coords} padding={60} maxZoom={16} pitch={55} />
          <OverlapMarkers items={markerItems} variant='white' />
        </>
      ) : (
        isValidCoord(fallbackCoord) && location && (
          <HTMLMarker
            lngLat={fallbackCoord}
            anchor='bottom'
            title={location.solution.solution_name}
            popup={() => <SolutionFallbackPopup location={location} />}
            popupOptions={{ offset: 18, closeButton: false }}
          >
            <div
              className='flex items-center justify-center cursor-pointer'
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#FCD116',
                boxShadow: '0 4px 12px rgba(252,209,22,0.6)',
                border: '2px solid #fff',
              }}
            >
              <TbMapPin size={18} color='#212121' />
            </div>
          </HTMLMarker>
        )
      )}
    </BaseMap>
  )
}

export default React.memo<Props>(MapSection)
