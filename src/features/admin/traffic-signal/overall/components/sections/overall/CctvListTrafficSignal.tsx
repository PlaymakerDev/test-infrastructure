"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useTrafficRandomCameras } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'
import { Tooltip } from 'antd'

interface Props {
  roadId?: string | null
}

/** Left rail — live CCTV camera previews for traffic-signal intersections.
 *  Data: `GET /traffic/departments/{deptId}/cameras/random-online?limit=3`
 *  (the response carries ip_address / phases_no / camera_type). */
const CctvListTrafficSignal: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  const { data, isLoading } = useTrafficRandomCameras(deptId, roadId ? { limit: 3, road_id: roadId } : { limit: 3 })
  // Prefer online cameras; if none are online, still show the (offline) cards
  // rather than a blank slot (backend random-online backfills offline anyway).
  const cameras = data?.data ?? []
  const online = cameras.filter((c) => c.camera.is_online)
  const toShow = online.length > 0 ? online : cameras

  if (isLoading && cameras.length === 0) {
    return (
      <div className='h-full flex flex-col gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 animate-pulse' />
        ))}
      </div>
    )
  }

  if (!isLoading && toShow.length === 0) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500 fs-12 p-4'>
        ไม่มีกล้องในขณะนี้
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {toShow.map((entry) => {
        const cam = entry.camera
        const ipAddress = cam.ip_address || '-'
        const phaseCount = cam.phases_no
        const cameraType = cam.camera_type
        // Counting → yellow accent, StopLine → white, default → muted.
        const modeColor =
          cameraType === 'Counting'
            ? '#FCD116'
            : cameraType === 'StopLine'
              ? '#FFFFFF'
              : '#666666'
        const modeText = cameraType ?? '-'

        return (
          <div
            key={cam.id}
            className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col cursor-pointer'
            onClick={() => openCamera(cam.id)}
            role='button'
            tabIndex={0}
          >
            <HLSLivePlayer
              figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
              hlsUrl={cam.hls_url}
              cameraId={cam.id}
              style={{ pointerEvents: 'none' }}
            />
            <Tooltip title={cam.name}>
              <h4 className='camera-code truncate'>{cam.name}</h4>
            </Tooltip>
            {/* IP + phase + type on ONE row per design 2026-07-14 — original
              * font sizes; the LEFT rail was widened to 320px instead (see
              * LocationTrafficSignal) so the longest IP + 2 pills still fit.
              * flex-wrap stays as a last-resort fallback only. */}
            <div className='mt-1 flex items-center gap-1.5 flex-wrap'>
              <p className='camera-location mb-0 whitespace-nowrap'>IP : {ipAddress}</p>
              {/* Phase pill — blue outline */}
              <span
                className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 whitespace-nowrap'
                style={{ border: '1px solid #66AEFF', color: '#66AEFF' }}
              >
                {phaseCount ?? '-'} Phase
              </span>
              {/* Detection mode pill — yellow=Counting, white=StopLine */}
              <span
                className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 whitespace-nowrap'
                style={{ border: `1px solid ${modeColor}`, color: modeColor }}
              >
                {modeText}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default React.memo<Props>(CctvListTrafficSignal)
