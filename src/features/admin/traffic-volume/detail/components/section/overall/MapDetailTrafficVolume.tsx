"use client"
import React, { useEffect, useMemo } from 'react'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import OverlapMarkers, { type OverlapMarkerItem } from '@/components/map/markers/OverlapMarkers'
import { useMap } from '@/components/map/hooks/useMap'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useTrafficVolumeSolutionCameras } from '@/hooks/queries/traffic-volume'
import { useDeptId } from '@/hooks/useDeptId'
import { useDetailContext } from '../../../context'
import type { CountingCameraItem } from '@/types/traffic-volume/detail-api'

interface Props {
  /** Optional vignette overlay forwarded to BaseMap. */
  edgeFade?: MapEdgeFadeProps
}

const FALLBACK_CENTER: [number, number] = [100.5, 14.0]

const isValidCoord = (
  c: [number, number] | undefined | null
): c is [number, number] =>
  Array.isArray(c) && c.length === 2 && (c[0] !== 0 || c[1] !== 0)

/** Popup card — shown when a camera marker is clicked. */
const DetailCameraPopup: React.FC<{ camera: CountingCameraItem }> = ({
  camera,
}) => (
  <div
    className='rounded-lg border border-cyan-400 px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
    style={{ width: 280 }}
  >
    <p className='fs-12 font-bold tracking-wide text-cyan-400'>
      Traffic Volume
    </p>
    <p className='fs-14 font-semibold text-white leading-snug mt-0.5 mb-2'>
      {camera.camera_name}
    </p>
    {/* Live preview right under the camera name. Fixed `aspect-video` keeps
      * the popup compact while still showing motion. */}
    <div className='relative rounded-md overflow-hidden bg-black/40'>
      <HLSLivePlayer
        figureClassName='aspect-video rounded-md'
        hlsUrl={camera.hls_url}
        cameraId={camera.id}
      />
    </div>
  </div>
)

/** Inner component — runs inside MapContext so it can fit/flyTo when the
 *  cameras data resolves. Uses `fitBounds` when multiple markers exist so the
 *  whole solution fits in view, falls back to flyTo for a single marker. */
const CamerasMarkerLayer: React.FC<{
  cameras: CountingCameraItem[]
  centroid: [number, number] | null
}> = ({ cameras, centroid }) => {
  const { map, isLoaded } = useMap()

  const valid = useMemo(
    () =>
      cameras.filter((c) => isValidCoord(c.geometry_point)),
    [cameras]
  )

  useEffect(() => {
    if (!map || !isLoaded) return

    if (valid.length === 0) {
      if (isValidCoord(centroid)) {
        map.flyTo({ center: centroid, zoom: 14, duration: 1000 })
      }
      return
    }

    if (valid.length === 1) {
      map.flyTo({ center: valid[0].geometry_point, zoom: 17, duration: 1000 })
      return
    }

    // Fit the map to all camera markers with padding + a maxZoom cap so
    // tightly-clustered cameras (e.g. one intersection) don't zoom too close.
    let minLng = valid[0].geometry_point[0],
      maxLng = valid[0].geometry_point[0],
      minLat = valid[0].geometry_point[1],
      maxLat = valid[0].geometry_point[1]
    for (const cam of valid) {
      const [lng, lat] = cam.geometry_point
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      // Keep the 3D tilt — fitBounds computes a top-down camera otherwise.
      { padding: 60, maxZoom: 17, duration: 1000, pitch: 55 }
    )
  }, [map, isLoaded, valid, centroid])

  // Group by coordinate so cameras sharing one lat/lon fan out (spider) and
  // stay individually clickable instead of stacking on top of each other.
  const markerItems = useMemo<OverlapMarkerItem[]>(
    () =>
      valid.map((camera) => ({
        id: camera.id,
        coord: camera.geometry_point,
        title: camera.camera_name,
        popup: <DetailCameraPopup camera={camera} />,
        popupOptions: { offset: 18, closeButton: false },
      })),
    [valid],
  )

  return <OverlapMarkers items={markerItems} variant='white' />
}

/** Detail map — one yellow pin per camera (from the `/cameras` endpoint).
 *  Falls back to the station location from the overview context while the
 *  cameras query is still loading so the map isn't centered on the Atlantic. */
const MapDetailTrafficVolume: React.FC<Props> = ({ edgeFade }) => {
  const deptId = useDeptId()
  const { id, location } = useDetailContext()
  const { data } = useTrafficVolumeSolutionCameras(deptId, id)

  const fallbackCoord = location?.geometry_point
  const initialCenter: [number, number] = isValidCoord(data?.centroid)
    ? data!.centroid!
    : isValidCoord(fallbackCoord)
      ? fallbackCoord
      : FALLBACK_CENTER
  const initialZoom = isValidCoord(data?.centroid) || isValidCoord(fallbackCoord)
    ? 15
    : 5.5

  return (
    <BaseMap
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      initialPitch={55}
      edgeFade={edgeFade}
    >
      <CamerasMarkerLayer
        cameras={data?.counting ?? []}
        centroid={data?.centroid ?? null}
      />
    </BaseMap>
  )
}

export default React.memo<Props>(MapDetailTrafficVolume)
