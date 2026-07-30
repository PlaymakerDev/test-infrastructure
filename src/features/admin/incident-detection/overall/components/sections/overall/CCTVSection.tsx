"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useIncidentRandomOnline } from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {
  roadId?: string | null
}

/** Overview left-rail — live preview of a few random online analytic cameras. */
const CCTVSection: React.FC<Props> = (props) => {
  const { roadId } = props
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  const { data } = useIncidentRandomOnline(deptId, roadId ? { road_id: Number(roadId), limit: 3 } : { limit: 3 })
  // Prefer online cameras; if none are online, still show the (offline) cards
  // rather than a blank slot (backend random-online backfills offline anyway).
  const cameras = data?.data ?? []
  const online = cameras.filter((item) => item.camera.is_online)
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
      {toShow.map((item) => (
        <div
          key={item.camera.id}
          className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col cursor-pointer'
          onClick={() => openCamera(item.camera.id)}
          role='button'
          tabIndex={0}
        >
          <HLSLivePlayer
            hlsUrl={item.camera.hls_url}
            cameraId={item.camera.id}
            showLiveBadge
            enableViewportPause
            figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
            style={{ pointerEvents: 'none' }}
          />
          <h4 className='camera-code'>{item.camera.name}</h4>
          <p className='camera-location'>IP Address : {item.camera.ip_address}</p>
        </div>
      ))}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
