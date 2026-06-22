
import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { INIT_MEDIA_MODAL, useControlVMSContext } from '../../../context'
import { DetailTabContent } from '../../../components'

interface Props { }

const ModalDetailItemStorage: React.FC<Props> = (props) => {
  const { } = props
  const { openMediaModal, setOpenMediaModal } = useControlVMSContext()
  const { open } = openMediaModal

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
        title="คลังรูปภาพและวิดีโอ"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => setOpenMediaModal(INIT_MEDIA_MODAL)}
        onCancel={() => setOpenMediaModal(INIT_MEDIA_MODAL)}
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
}

export default React.memo<Props>(ModalDetailItemStorage)