import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import React, { useMemo } from 'react'

interface Props {}

const mockCameras = [
  { id: 1, code: 'CAM-F03B', location: 'IP Address : 192.168.30.119' },
  { id: 2, code: 'P1-CAM-B01', location: 'IP Address : 10.172.26.17' },
  { id: 3, code: '68SET-PKT3033-B001-จุดที่1-กม.1+400-ป้ายVMS', location: 'IP Address : 10.101.27.1' },
]

const CCTVSection: React.FC<Props> = () => {
  const renderCameraList = useMemo(() => {
    return mockCameras.map((item) => (
      <div key={item.id} className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'>
        <HLSLivePlayer figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg' />
        <h4 className='camera-code'>{item.code}</h4>
        <p className='camera-location'>{item.location}</p>
      </div>
    ))
  }, [])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
