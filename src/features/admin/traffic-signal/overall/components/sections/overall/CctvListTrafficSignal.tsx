"use client"
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useTrafficRandomCameras } from '@/hooks/queries/traffic-signal'
import { useDeptId } from '@/hooks/useDeptId'

interface Props {}

/** Left rail — live CCTV camera previews for traffic-signal intersections.
 *  Data: `GET /traffic/departments/{deptId}/cameras/random-online?limit=3`
 *
 *  ⚠ Backend `random-online` response is missing fields the design needs:
 *  `ip_address`, `phases_no`, `camera_type`. We render "-" placeholders for
 *  now. To remove the placeholders, ask backend to extend the response with:
 *    camera.ip_address: string
 *    camera.phases_no:  number
 *    camera.camera_type: 'Counting' | 'StopLine' | null
 */
const CctvListTrafficSignal: React.FC<Props> = () => {
  const deptId = useDeptId()
  const { data, isLoading } = useTrafficRandomCameras(deptId, 3)
  // BE `random-online` may backfill with offline cameras when there aren't
  // enough online ones — keep the preview true to its name.
  const cameras = (data?.data ?? []).filter((c) => c.camera.is_online)

  if (isLoading && cameras.length === 0) {
    return (
      <div className='h-full flex flex-col gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 animate-pulse' />
        ))}
      </div>
    )
  }

  if (!isLoading && cameras.length === 0) {
    return (
      <div className='h-full flex items-center justify-center text-gray-500 fs-12 p-4'>
        ไม่มีกล้องออนไลน์ในขณะนี้
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col gap-4'>
      {cameras.map((entry) => {
        // Pull extended fields if backend has added them; fall back to '-'.
        // Once `random-online` includes these, types should be updated to
        // make them non-optional.
        const cam = entry.camera as typeof entry.camera & {
          ip_address?: string
          phases_no?: number
          camera_type?: 'Counting' | 'StopLine' | null
        }
        const ipAddress = cam.ip_address ?? '-'
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
            className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
          >
            <HLSLivePlayer
              figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
              hlsUrl={cam.hls_url}
              cameraId={cam.id}
            />
            <h4 className='camera-code'>{cam.name}</h4>
            <p className='camera-location'>IP Address : {ipAddress}</p>
            <div className='mt-1.5 flex items-center gap-1.5 flex-wrap'>
              {/* Phase pill — blue outline */}
              <span
                className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap'
                style={{ border: '1px solid #66AEFF', color: '#66AEFF' }}
              >
                {phaseCount ?? '-'} Phase
              </span>
              {/* Detection mode pill — yellow=Counting, white=StopLine */}
              <span
                className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap'
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
