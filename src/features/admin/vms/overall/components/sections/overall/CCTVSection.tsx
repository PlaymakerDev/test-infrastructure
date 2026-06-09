import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { useAppSelector } from '@/stores/hooks'
import React, { useMemo } from 'react'

interface Props { }

const CCTVSection: React.FC<Props> = () => {
  const { vms_random_online } = useAppSelector(state => state.vms_overview)

  const renderCameraList = useMemo(() => {
    return vms_random_online.map((item) => (
      <div
        key={item.solution.id}
        className='bg-(--mid-gray) p-3 rounded-lg flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-lg'
          hlsUrl={item.vms.hls_url}
        />
        <h4 className='camera-code'>{item.solution.solution_name}</h4>
        <p className='camera-location'>เชื่อมต่อล่าสุด :{item.vms.last_connected}</p>
      </div>
    ))
  }, [vms_random_online])

  return (
    <div className='h-full flex flex-col gap-4'>
      {renderCameraList}
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
