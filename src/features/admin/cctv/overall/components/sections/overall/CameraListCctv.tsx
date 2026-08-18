"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import type { CCTVRandomOnlineCamera } from '@/types/cctv/camera-api'
import { extractIpFromHlsUrl } from '@/utils/extractIpFromHlsUrl'
import { Tooltip } from 'antd'

interface Props {
  cameras: CCTVRandomOnlineCamera[]
}

/** Left-rail live preview — up to 3 random CCTV cameras.
 *
 *  Prefer online cameras; if none are online, still show the (offline) cards
 *  rather than a blank slot (backend `random-online` backfills with offline
 *  cameras when there aren't enough online ones). Card visual matches Traffic
 *  Signal / Incident Detection — the sub-line shows "IP Address : …" like every
 *  other feature, read from the payload's own `ip_address` field (confirmed
 *  present 2026-08-17; `extractIpFromHlsUrl` stays only as a blank-value
 *  fallback). */
const CameraListCctv: React.FC<Props> = ({ cameras }) => {
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  // Prefer online cameras; if none are online, still show the (offline) cards
  // rather than a blank slot (backend random-online backfills offline anyway).
  const online = cameras.filter((c) => c.is_online)
  const toShow = online.length > 0 ? online : cameras

  if (toShow.length === 0) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500 fs-12 p-4'>
        ไม่มีกล้องในขณะนี้
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {toShow.map((cam) => (
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
            showLiveBadge
            enableViewportPause
            style={{ pointerEvents: 'none' }}
          />
          <Tooltip title={cam.camera_name}>
            <h4 className='camera-code truncate'>{cam.camera_name}</h4>
          </Tooltip>
          {/* `ip_address` is the camera's real IP; the hls_url host is only a
              fallback for rows where the backend leaves it blank. */}
          <p className='camera-location'>IP Address : {cam.ip_address || extractIpFromHlsUrl(cam.hls_url)}</p>
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(CameraListCctv)
