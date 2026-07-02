import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import type { VMSMediaList } from '@/types/control-vms/vms-api'
import { getPrimaryMediaUrl } from '../../../data/media'
import VMSMedia from './VMSMedia'

interface Props {
  open: boolean
  data: VMSMediaList | null
  onClose: () => void
}

const Content: React.FC<{ data: VMSMediaList | null }> = ({ data }) => {
  if (!data) return null
  const mediaUrl = getPrimaryMediaUrl(data.schedules)
  if (!mediaUrl) return null
  return (
    <figure className='w-full overflow-hidden rounded-lg'>
      <VMSMedia url={mediaUrl} alt={data.type_name} variant='player' />
    </figure>
  )
}

const ModalMediaPreview: React.FC<Props> = ({ open, data, onClose }) => (
  <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
    <Modal
      title={data?.type_name ?? 'ดูรายละเอียด'}
      closable={{ 'aria-label': 'ปิด' }}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      classNames={{ container: 'border-2! border-(--default-blue)!' }}
      width={800}
    >
      <Content data={data} />
    </Modal>
  </ConfigProvider>
)

export default React.memo<Props>(ModalMediaPreview)
