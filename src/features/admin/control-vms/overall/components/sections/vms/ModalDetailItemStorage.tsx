import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { DetailTabContent } from '../../../components'

interface Props {
  open: boolean
  onClose: () => void
  /** When provided, opens in picker mode — selecting a card calls this with
   *  the media_url and the caller is expected to close the modal. */
  onSelect?: (url: string) => void
}

const ModalDetailItemStorage: React.FC<Props> = ({ open, onClose, onSelect }) => (
  <ConfigProvider
    theme={{
      components: {
        Modal: { colorIcon: '#FFFFFF' }
      }
    }}
  >
    <Modal
      title={onSelect ? 'เลือกไฟล์จากคลังรูปภาพ' : 'คลังรูปภาพและวิดีโอ'}
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
      <DetailTabContent onSelect={onSelect} inModal />
    </Modal>
  </ConfigProvider>
)

export default React.memo<Props>(ModalDetailItemStorage)
