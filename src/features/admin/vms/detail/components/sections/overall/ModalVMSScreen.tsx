
import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { INIT_VMS_SCREEN, useDetailContext } from '../../../context'
import { APIResponseVMSDetail } from '@/types/vms/detail-api'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'

interface Props { }

interface ContentProps {
  data?: APIResponseVMSDetail
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props

  return (
    <HLSLivePlayer
      cameraId={String(data?.desktop_screen.id)}
      hlsUrl={data?.desktop_screen.desktop_screen}
      enableViewportPause
      figureClassName='figure-extra-large min-h-0 overflow-hidden rounded-lg'
    />
  )
}
const ModalVMSScreen: React.FC<Props> = (props) => {
  const { } = props
  const { openVMSScreen, setOpenVMSScreen } = useDetailContext()
  const { open, data } = openVMSScreen

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
          }
        }
      }}>
      <Modal
        title="หน้าจอโปรแกรมป้าย VMS"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => setOpenVMSScreen(INIT_VMS_SCREEN)}
        onCancel={() => setOpenVMSScreen(INIT_VMS_SCREEN)}
        footer={null}
        destroyOnHidden
        classNames={{
          container: 'border-2! border-(--default-blue)!'
        }}
        width={1000}
      >
        <Content data={data} />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalVMSScreen)