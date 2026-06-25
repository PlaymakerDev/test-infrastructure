"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { useIncidentRandomOnline } from '@/hooks/queries/incident-detection'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {}

/** Overview left-rail — live preview of a few random online analytic cameras. */
const CCTVSection: React.FC<Props> = () => {
  const deptId = useDeptId()
  const dispatch = useAppDispatch()
  const openCamera = (id: string) => dispatch(setCCTVModalOpen({ open: true, camera_id: id }))
  const { data } = useIncidentRandomOnline(deptId, 3)
  // BE backfills with offline cameras when there aren't enough online ones —
  // keep the preview true to its name.
  const cameras = (data?.data ?? []).filter((item) => item.camera.is_online)

  if (cameras.length === 0) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500 fs-12 p-4'>
        ไม่มีกล้องออนไลน์ในขณะนี้
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {cameras.map((item) => (
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
