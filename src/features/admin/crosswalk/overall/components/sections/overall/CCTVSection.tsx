import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import React, { useMemo } from 'react'

interface Props {

}

const mockCameras = [
  {
    id: 1,
    code: '67FTD-CMI2025-FAI037-กม.00+400-มุ่งหน้าแจ่งศรีภูมิ',
    location: 'IP Address : 192.168.30.119',
  },
  {
    id: 2,
    code: '67TRC-SPK4009-C007-Crosswalk2-ขาเข้ามุ่งหน้าถ.ศรีนครินทร์',
    location: 'IP Address : 10.172.26.17',
  },
  {
    id: 3,
    code: '67TRC-SPK4009-C009-Crosswalk3-ขาออกมุ่งหน้า ถ.สุขุมวิท',
    location: 'IP Address : 10.101.27.1',
  },
]

const CCTVSection: React.FC<Props> = (props) => {
  const { } = props

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
