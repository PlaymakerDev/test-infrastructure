"use client"
import React, { useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import OverlapMarkers, { type OverlapMarkerItem } from '@/components/map/markers/OverlapMarkers'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useCrosswalkCameras } from '@/hooks/queries/crosswalk'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import type { CrosswalkCameraItem } from '@/types/crosswalk/detail-api'

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
    }}
  >
    {/* Player mounts for EVERY camera — including red (offline) pins, per
      * product decision 2026-07-20: the is_online flag can lag reality, so
      * the stream always gets a chance to load like the other menus. */}
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

/** Detail map — uses the shared overlap-aware marker layer (`OverlapMarkers`,
 *  same grouping as Incident Detection detail): cameras sharing a coordinate
 *  fan out (spider) into individually-clickable pins, each opening a popup with
 *  a live preview. All pins are white teardrops (`variant='white'`).
 *  Cameras WITHOUT lat/lon get NO marker (per design 2026-07-20 — the old
 *  yellow solution-centroid fallback pin read as a fake camera position); the
 *  map still centers on the solution's own coordinate so the area is framed. */
const MapSection: React.FC<Props> = ({ edgeFade = { all: 20 } }) => {
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
        popupOptions: { offset: 22, closeButton: false, maxWidth: '300px' },
        // Status-colored pin: red when the whole coordinate group is offline.
        offline: !cam.is_online,
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
      {hasCoordCams && (
        <>
          {/* maxZoom 19 — street-level close-up, per review 2026-07-20
            * (crosswalk cameras cluster on one junction). */}
          <FitBoundsEffect coords={coords} padding={60} maxZoom={19} pitch={55} />
          <OverlapMarkers items={markerItems} variant='white' />
        </>
      )}
    </BaseMap>
  )
}

export default React.memo<Props>(MapSection)
