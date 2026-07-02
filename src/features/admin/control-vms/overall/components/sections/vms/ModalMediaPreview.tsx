import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import type { ScheduleCard } from '../../../data/media'
import VMSMedia from './VMSMedia'

interface Props {
  open: boolean
  data: ScheduleCard | null
  onClose: () => void
}

const Content: React.FC<{ data: ScheduleCard | null }> = ({ data }) => {
  if (!data?.schedule.media_url) return null
  const alt = data.schedule.schedule_name || data.item.type_name
  return (
    <figure className='w-full overflow-hidden rounded-lg'>
      <VMSMedia url={data.schedule.media_url} alt={alt} variant='player' />
    </figure>
  )
}

const ModalMediaPreview: React.FC<Props> = ({ open, data, onClose }) => (
  <ConfigProvider theme={{ components: { Modal: { colorIcon: '#FFFFFF' } } }}>
    <Modal
      title={data?.schedule.schedule_name || data?.item.type_name || 'ดูรายละเอียด'}
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
