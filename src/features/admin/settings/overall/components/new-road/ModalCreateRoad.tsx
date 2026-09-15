import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetRoadModalData } from '@/stores/reducers/modal/customModalSlice'
import { useCreateRoad, useUpdateRoad } from '@/hooks/queries/manage'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback, useRef } from 'react'
import { TbRoad } from 'react-icons/tb'
import FormCreateRoad from './FormCreateRoad'

interface Props {

}

const ModalCreateRoad: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement | null>(null)
  const { open, type, data } = useAppSelector((state) => state.custom_modal.road_modal)
  const dispatch = useAppDispatch()

  const { isPending: isCreatePending } = useCreateRoad()
  const { isPending: isUpdatePending } = useUpdateRoad()

  const handleClose = useCallback(() => {
    dispatch(resetRoadModalData())
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
        title={
          <div className='flex items-center flex-wrap gap-3'>
            <TbRoad className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>
              {data?.id ? 'แก้ไขข้อมูลสายทาง' : 'เพิ่มข้อมูลสายทาง'}
            </h3>
          </div>
        }
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={type === 'DELETE' ? false : open}
        okText='ยืนยัน'
        cancelText='ยกเลิก'
        okButtonProps={{
          loading: isCreatePending || isUpdatePending,
          shape: 'round'
        }}
        cancelButtonProps={{
          disabled: isCreatePending || isUpdatePending,
          shape: 'round'
        }}
        onOk={() => submitRef.current?.click()}
        onCancel={handleClose}
        destroyOnHidden
        width={800}
      >
        <div className='mt-5'>
          <FormCreateRoad
            data={data}
            submitRef={submitRef}
            onSuccess={handleClose}
          />
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateRoad)
