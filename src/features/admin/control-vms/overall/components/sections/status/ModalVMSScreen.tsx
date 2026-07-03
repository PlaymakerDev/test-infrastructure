
import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { INIT_OPEN_VMS_SCREEN, useControlVMSContext } from '../../../context'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'

interface Props { }

interface ContentProps {
  id: number | null
  vms_url: string
}

const Content: React.FC<ContentProps> = (props) => {
  const { id, vms_url } = props
  if (id === null || !vms_url) return null

  return (
    <HLSLivePlayer
      cameraId={String(id)}
      hlsUrl={vms_url}
      enableViewportPause
      figureClassName='figure-extra-large min-h-0 overflow-hidden rounded-lg'
    />
  )
}
const ModalVMSScreen: React.FC<Props> = (props) => {
  const { } = props
  const { openVMSScreen, setOpenVMSScreen } = useControlVMSContext()
  const { open, id, vms_url } = openVMSScreen

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
        onOk={() => setOpenVMSScreen(INIT_OPEN_VMS_SCREEN)}
        onCancel={() => setOpenVMSScreen(INIT_OPEN_VMS_SCREEN)}
        footer={null}
        destroyOnHidden
        classNames={{
          container: 'border-2! border-(--default-blue)!'
        }}
        width={1000}
      >
        <Content id={id} vms_url={vms_url} />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalVMSScreen)
