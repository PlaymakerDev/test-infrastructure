import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetContactModalData } from '@/stores/reducers/modal/customModalSlice'
import { useCreateContractor, useUpdateContractor } from '@/hooks/queries/manage'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback, useRef } from 'react'
import { TbBuildingSkyscraper } from 'react-icons/tb'
import FormCreateContact from './FormCreateContact'

interface Props {

}

const ModalCreateContact: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement | null>(null)
  const { open, type, data } = useAppSelector((state) => state.custom_modal.contact_modal)
  const dispatch = useAppDispatch()

  const { isPending: isCreatePending } = useCreateContractor()
  const { isPending: isUpdatePending } = useUpdateContractor()

  const handleClose = useCallback(() => {
    dispatch(resetContactModalData())
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
            <TbBuildingSkyscraper className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>
              {data?.user_id ? 'แก้ไขข้อมูลผู้รับจ้าง' : 'เพิ่มผู้รับจ้าง'}
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
          <FormCreateContact
            data={data}
            submitRef={submitRef}
            onSuccess={handleClose}
          />
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateContact)
