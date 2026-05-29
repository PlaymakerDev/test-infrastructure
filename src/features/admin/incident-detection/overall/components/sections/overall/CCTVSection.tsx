import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import React, { useMemo } from 'react'

interface Props {}

const mockCameras = [
  { id: 1, code: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550-ปุ่งหน้าปากน้ำโสภาคดี', location: 'IP Address : 10.12.7.3' },
  { id: 2, code: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850-ปุ่งหน้าโรงเรียนบ้านน้ำเพิ่ม', location: 'IP Address : 10.12.2.1' },
  { id: 3, code: '68FTD-KPT6070-FAI006-จุดที่3-กม.5+000-ปุ่งหน้ากม.112', location: 'IP Address : 10.83.8.8' },
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

  return <div className='h-full flex flex-col gap-4'>{renderCameraList}</div>
}

export default React.memo<Props>(CCTVSection)
