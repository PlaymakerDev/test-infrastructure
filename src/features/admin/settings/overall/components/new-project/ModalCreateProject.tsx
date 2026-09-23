import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetProjectModalData } from '@/stores/reducers/modal/customModalSlice'
import { useCreateProject, useUpdateProject } from '@/hooks/queries/manage'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback, useRef } from 'react'
import { TbClipboardList } from 'react-icons/tb'
import FormCreateProject from './FormCreateProject'

interface Props {

}

const ModalCreateProject: React.FC<Props> = (props) => {
  const { } = props
  const submitRef = useRef<HTMLButtonElement | null>(null)
  const { open, type, data } = useAppSelector((state) => state.custom_modal.project_modal)
  const dispatch = useAppDispatch()

  const { isPending: isCreatePending } = useCreateProject()
  const { isPending: isUpdatePending } = useUpdateProject()

  const handleClose = useCallback(() => {
    dispatch(resetProjectModalData())
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
            <TbClipboardList className='fs-24 text-(--default-blue)' />
            <h3 className='text-(--default-blue)'>
              {data?.id ? 'แก้ไขข้อมูลโครงการ' : 'เพิ่มข้อมูลโครงการ'}
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
          <FormCreateProject
            data={data}
            submitRef={submitRef}
            onSuccess={handleClose}
          />
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalCreateProject)
