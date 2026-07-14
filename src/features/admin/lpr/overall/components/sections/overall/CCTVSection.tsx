import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import React from 'react'

interface Props {
  deptId?: string | string[] | number
}

const CCTVSection: React.FC<Props> = (props) => {
  const { deptId } = props

  return (
    <div className='h-full flex flex-col gap-4'>
      <div
        className='bg-(--mid-gray) p-3 rounded-2xl flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-2xl cursor-pointer'
        />
        <h4 className='camera-code'>{'-'}</h4>
        <p className='camera-location'>IP Address : {'-'}</p>
      </div>
      <div
        className='bg-(--mid-gray) p-3 rounded-2xl flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-2xl cursor-pointer'
        />
        <h4 className='camera-code'>{'-'}</h4>
        <p className='camera-location'>IP Address : {'-'}</p>
      </div>
      <div
        className='bg-(--mid-gray) p-3 rounded-2xl flex-1 min-h-0 flex flex-col'
      >
        <HLSLivePlayer
          figureClassName='flex-1 min-h-0 mb-1.5 rounded-2xl cursor-pointer'
        />
        <h4 className='camera-code'>{'-'}</h4>
        <p className='camera-location'>IP Address : {'-'}</p>
      </div>
    </div>
  )
}

export default React.memo<Props>(CCTVSection)
