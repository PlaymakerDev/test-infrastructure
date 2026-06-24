import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { DetailTabContent } from '../../../components'

interface Props {
  open: boolean
  onClose: () => void
}

const ModalDetailItemStorage: React.FC<Props> = ({ open, onClose }) => (
  <ConfigProvider
    theme={{
      components: {
        Modal: { colorIcon: '#FFFFFF' }
      }
    }}
  >
    <Modal
      title="คลังรูปภาพและวิดีโอ"
      closable={{ 'aria-label': 'Custom Close Button' }}
      open={open}
      onOk={onClose}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      classNames={{
        container: 'border-2! border-(--default-blue)!',
        body: 'max-h-[70vh] overflow-y-auto overflow-x-hidden'
      }}
      width={1000}
    >
      <DetailTabContent />
    </Modal>
  </ConfigProvider>
)

export default React.memo<Props>(ModalDetailItemStorage)
