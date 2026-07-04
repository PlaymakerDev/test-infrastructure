"use client"
import React, { useEffect, useMemo } from 'react'
import { TbMapPin } from 'react-icons/tb'
import BaseMap, { type MapEdgeFadeProps } from '@/components/map/BaseMap'
import HTMLMarker from '@/components/map/primitives/HTMLMarker'
import { useMap } from '@/components/map/hooks/useMap'
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

/** Popup card — shown when a camera marker is clicked. */
const DetailCameraPopup: React.FC<{ camera: CrosswalkCameraItem }> = ({
  camera,
}) => (
  <div
    className='rounded-lg border border-cyan-400 px-3 py-2.5 bg-[rgba(5,13,26,0.96)]'
    style={{ width: 280 }}
  >
    <p className='fs-11 font-bold tracking-wide text-cyan-400'>Camera</p>
    <p className='fs-14 font-semibold text-white leading-snug mt-0.5 mb-2'>
      {camera.camera_name}
    </p>
    <div className='relative rounded-md overflow-hidden bg-black/40'>
      <HLSLivePlayer
        figureClassName='aspect-video rounded-md'
        hlsUrl={camera.hls_url}
        cameraId={camera.id}
      />
    </div>
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

/** Runs inside MapContext so it can fit/flyTo when the cameras data resolves.
 *  If the `/cameras` endpoint returns no coords for this solution, falls back
 *  to a single yellow marker at the solution's own `GeometryPoint` so the map
 *  still points to the crosswalk (same behavior as the overall page). */
const CamerasMarkerLayer: React.FC<{
  cameras: CrosswalkCameraItem[]
  centroid: [number, number] | null
  location: CrosswalkLocation | null
}> = ({ cameras, centroid, location }) => {
  const { map, isLoaded } = useMap()

  const validCameras = useMemo(
    () => cameras.filter((c) => isValidCoord(c.geometry_point)),
    [cameras],
  )

  const useFallback = validCameras.length === 0 && isValidCoord(location?.GeometryPoint)

  useEffect(() => {
    if (!map || !isLoaded) return

    if (useFallback && location) {
      map.flyTo({ center: location.GeometryPoint, zoom: 17, duration: 1000 })
      return
    }

    if (validCameras.length === 0) {
      if (isValidCoord(centroid)) {
        map.flyTo({ center: centroid, zoom: 14, duration: 1000 })
      }
      return
    }

    if (validCameras.length === 1) {
      map.flyTo({ center: validCameras[0].geometry_point, zoom: 17, duration: 1000 })
      return
    }

    let minLng = validCameras[0].geometry_point[0],
      maxLng = validCameras[0].geometry_point[0],
      minLat = validCameras[0].geometry_point[1],
      maxLat = validCameras[0].geometry_point[1]
    for (const cam of validCameras) {
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
      { padding: 60, maxZoom: 17, duration: 1000 },
    )
  }, [map, isLoaded, validCameras, centroid, useFallback, location])

  // Fallback path — solution-level marker when no cameras have coords.
  if (useFallback && location) {
    return (
      <HTMLMarker
        lngLat={location.GeometryPoint}
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
  }

  return (
    <>
      {validCameras.map((camera) => (
        <HTMLMarker
          key={camera.id}
          lngLat={camera.geometry_point}
          anchor='bottom'
          title={camera.camera_name}
          popup={() => <DetailCameraPopup camera={camera} />}
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
      ))}
    </>
  )
}

/** Detail map — one yellow pin per camera (from the `/cameras` endpoint).
 *  If the endpoint has no camera coords for this solution, fall back to a
 *  single pin at the solution's own `GeometryPoint` from the overview
 *  context — matches the marker the user saw on the overall page. */
const MapSection: React.FC<Props> = ({ edgeFade }) => {
  const deptId = useDeptId()
  const { id, location } = useDetailContext()
  const { data } = useCrosswalkCameras(deptId, { solution_id: id })

  // Crosswalk's overview endpoint uses PascalCase `GeometryPoint` — not the
  // same casing as traffic-volume's `geometry_point`.
  const fallbackCoord = location?.GeometryPoint
  const initialCenter: [number, number] = isValidCoord(data?.centroid)
    ? data!.centroid!
    : isValidCoord(fallbackCoord)
      ? fallbackCoord
      : FALLBACK_CENTER
  const initialZoom =
    isValidCoord(data?.centroid) || isValidCoord(fallbackCoord) ? 15 : 5.5

  return (
    <BaseMap
      initialCenter={initialCenter}
      initialZoom={initialZoom}
      initialPitch={55}
      edgeFade={edgeFade}
    >
      <CamerasMarkerLayer
        cameras={data?.cameras ?? []}
        centroid={data?.centroid ?? null}
        location={location}
      />
    </BaseMap>
  )
}

export default React.memo<Props>(MapSection)
