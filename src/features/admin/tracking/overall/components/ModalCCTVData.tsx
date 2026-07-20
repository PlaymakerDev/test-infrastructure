import { ConfigProvider, Modal } from 'antd'
import React from 'react'
import { INIT_MODAL_CCTV_DATA, useOverallContext } from '../context'
import HLSLivePlayer from '@/components/video/HLSLivePlayer'
import type { CCTVList } from '@/types/tracking/overall-api'

interface Props { }

interface ContentProps {
  item: CCTVList | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { item } = props
  if (!item) return null

  return (
    <HLSLivePlayer
      cameraId={String(item.id)}
      hlsUrl={item.stream_url}
      enableViewportPause
      figureClassName='figure-extra-large min-h-0 overflow-hidden rounded-lg'
    />
  )
}

const ModalCCTVData: React.FC<Props> = (props) => {
  const { } = props
  const { openCCTVData, setOpenCCTVData } = useOverallContext()
  const { open, item } = openCCTVData

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
        title={item?.camera_description || 'รายละเอียดกล้อง CCTV'}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={() => setOpenCCTVData(INIT_MODAL_CCTV_DATA)}
        onCancel={() => setOpenCCTVData(INIT_MODAL_CCTV_DATA)}
        footer={null}
        destroyOnHidden
        classNames={{
          container: 'border-2! border-(--default-blue)!'
        }}
        width={1000}
      >
        <Content item={item} />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCCTVData)
