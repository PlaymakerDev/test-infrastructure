import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import React, { useMemo } from 'react'

interface Props {

}

const mockCameras = [
  {
    id: 1,
    code: 'DRR-CCO-Weight-CAM01 (N) ขาออก ด่านชั่ง',
    location: 'สถานีด่านฯ ฉะเชิงเทรา',
  },
  {
    id: 2,
    code: '6B4M-WIM-NON1002-CAM001',
    location: 'WIM นนทบุรี (นน.1002) ฝั่งบาง',
  },
  {
    id: 3,
    code: '67PSK-WIM-NON4018-F002',
    location: 'WIM เลี้ยงเมืองนนทบุรี (นน.4018)',
  },
]

const WIMCCTVList: React.FC<Props> = (props) => {
  const { } = props

  const renderCameraList = useMemo(() => {
    return mockCameras.map((item) => (
      <div key={item.id} className='flex-1 flex flex-col min-h-0'>
        <HLSLivePlayer figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg' />
        <h4 className='text-xs font-medium text-[#66AEFF] leading-snug break-all mb-0.5'>{item.code}</h4>
        <p className='text-xs text-white leading-snug m-0'>{item.location}</p>
      </div>
    ))
  }, [])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(WIMCCTVList)
