"use client"
import React, { useMemo } from 'react'
import { useParams } from 'next/navigation'
import BaseMap from '@/components/map/BaseMap'
import OverlapMarkers, { type OverlapMarkerItem } from '@/components/map/markers/OverlapMarkers'
import FitBoundsEffect from '@/components/map/primitives/FitBoundsEffect'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useIncidentSolutionCameras } from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'
import type { IncidentCameraMapItem } from '@/types/incident-detection/camera-api'

const CameraPopup: React.FC<{ cam: IncidentCameraMapItem }> = ({ cam }) => (
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

/** Center — 3D pitched map. Markers come from /cameras/?solution_id=. */
const MapSection: React.FC = () => {
  const deptId = useDeptId()
  const params = useParams()
  const solutionId = Array.isArray(params.id) ? params.id[0] : params.id
  const { data } = useIncidentSolutionCameras(deptId, solutionId)

  // Only render markers that actually have a coordinate. A null geometry would
  // make Mapbox reject the whole source.
  const cameras = useMemo(
    () => (data?.cameras ?? []).filter((c) => Array.isArray(c.geometry_point) && c.geometry_point.length === 2),
    [data?.cameras]
  )

  const coords = useMemo<[number, number][]>(
    () => cameras.map((c) => c.geometry_point as [number, number]),
    [cameras]
  )

  // Fall back to the response centroid if we have it, else a sane default.
  const center = data?.centroid ?? [100.5018, 13.7563]

  // Group by coordinate so cameras sharing one lat/lon fan out (spider) and
  // stay individually clickable instead of stacking on top of each other.
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

  // Reserve room for the Tab1 overlay rails (event list on the left, stat
  // cards + charts on the right) so route markers stay framed in the central
  // strip instead of hiding behind a panel — same approach as the CCTV detail
  // map. The rails only render at xl+ (hidden below), so smaller screens, where
  // the panels stack under the map, use uniform padding.
  const fitPadding = useMemo<
    number | { top: number; bottom: number; left: number; right: number }
  >(() => {
    if (typeof window === 'undefined') return 56
    const w = window.innerWidth
    if (w >= 1536) return { top: 80, bottom: 80, left: 470, right: 510 } // 2xl rails (w-104 / w-115)
    if (w >= 1280) return { top: 70, bottom: 70, left: 380, right: 410 } // xl rails (w-80 / w-90)
    return 56
  }, [])

  return (
    <BaseMap
      initialCenter={center}
      initialZoom={14}
      initialPitch={45}
      initialBearing={-10}
      edgeFade={{ left: 10, right: 10, top: 10, bottom: 10 }}
    >
      <FitBoundsEffect coords={coords} padding={fitPadding} maxZoom={16} />
      <OverlapMarkers items={markerItems} />
    </BaseMap>
  )
}

export default React.memo(MapSection)
