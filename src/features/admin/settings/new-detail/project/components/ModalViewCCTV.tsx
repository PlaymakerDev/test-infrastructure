import { ConfigProvider, Modal } from 'antd'
import React, { useCallback } from 'react'
import { TableCameraList } from '../components'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetViewDeviceModalData } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseSolutionCameraList } from '@/types/manage/project-detail-api'

interface Props {

}

interface ContentProps {
  data?: APIResponseSolutionCameraList | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props
  return (
    <TableCameraList data={data} />
  )
}

const ModalViewCCTV: React.FC<Props> = (props) => {
  const { } = props
  const { open, data, type } = useAppSelector(state => state.custom_modal.view_device_modal)
  const dispatch = useAppDispatch()

  const handleClose = useCallback(() => {
    dispatch(resetViewDeviceModalData())
  }, [dispatch])

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#FFFFFF',
            borderRadiusLG: 20,
          }
        }
      }}
    >
      <Modal
        title="Basic Modal"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={open}
        onOk={handleClose}
        onCancel={handleClose}
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          shape: 'round'
        }}
        cancelButtonProps={{
          shape: 'round'
        }}
        destroyOnHidden
        width={1400}
      >
        <Content
          data={data}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalViewCCTV)
