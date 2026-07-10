import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import VMSMedia from './VMSMedia'

interface Props {
  open: boolean
  url: string | null
  onClose: () => void
}

const ModalMediaPreview: React.FC<Props> = ({ open, url, onClose }) => (
  <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
    <Modal
      title='ดูรายละเอียด'
      closable={{ 'aria-label': 'ปิด' }}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      classNames={{ container: 'border-2! border-(--default-blue)!' }}
      width={800}
    >
      {url && (
        <figure className='w-full overflow-hidden rounded-lg'>
          <VMSMedia url={url} alt='ดูรายละเอียด' variant='player' />
        </figure>
      )}
    </Modal>
  </ConfigProvider>
)

export default React.memo<Props>(ModalMediaPreview)
