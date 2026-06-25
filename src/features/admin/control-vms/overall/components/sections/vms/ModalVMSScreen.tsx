import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { BureauSign } from '@/types/control-vms/bureau'

interface Props {
  open: boolean
  data: BureauSign | null
  onClose: () => void
}

const Content: React.FC<{ data: BureauSign | null }> = ({ data }) => {
  if (!data) return null
  return (
    <HLSLivePlayer
      cameraId={String(data.solution_id)}
      hlsUrl={data.desktop_screen}
      enableViewportPause
      figureClassName='figure-extra-large min-h-0 overflow-hidden rounded-lg'
    />
  )
}

const ModalVMSScreen: React.FC<Props> = ({ open, data, onClose }) => (
  <ConfigProvider
    theme={{
      components: {
        Modal: { colorIcon: '#FFFFFF' }
      }
    }}
  >
    <Modal
      title="หน้าจอโปรแกรมป้าย VMS"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={open}
      onOk={onClose}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      classNames={{ container: 'border-2! border-(--default-blue)!' }}
      width={1000}
    >
      <Content data={data} />
    </Modal>
  </ConfigProvider>
)

export default React.memo<Props>(ModalVMSScreen)
