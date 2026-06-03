import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import React from 'react'

interface Props {

}

const ActiveCamera: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-black/40 backdrop-blur-xs rounded-lg p-5'>
      <HLSLivePlayer
        figureClassName='figure-large min-h-0 mb-1.5 rounded-lg lg:flex-1 lg:max-h-none'
      />
      <h4 className='text-blue-500'>68MST-TS-B001-ส่องป้ายVMS</h4>
      <p className='fs-12 text-gray-400'>IP Address : 10.101.27.1</p>
    </div>
  )
}

export default React.memo<Props>(ActiveCamera)
