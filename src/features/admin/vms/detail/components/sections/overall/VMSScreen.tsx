import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import { Image } from 'antd'
import React from 'react'

interface Props {
  data?: APIResponseVMSDetail
}

const VMSScreen: React.FC<Props> = (props) => {
  const { data } = props

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-black/40 backdrop-blur-xs rounded-lg p-5'>
      <h3 className='text-(--yellow) mb-1.5'>หน้าจอโปรแกรมป้าย VMS</h3>
      <HLSLivePlayer
        cameraId={String(data?.desktop_screen.id)}
        hlsUrl={data?.desktop_screen.desktop_screen}
        enableViewportPause
        figureClassName='figure-large min-h-0 overflow-hidden rounded-lg lg:flex-1 lg:max-h-none'
      />
    </div>
  )
}

export default React.memo<Props>(VMSScreen)
