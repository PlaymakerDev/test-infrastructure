import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetProjectModalData } from '@/stores/reducers/modal/customModalSlice'
import { ProjectListData } from '@/types/manage/project-api'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { ConfigProvider, Modal } from 'antd'
import dayjs from 'dayjs'
import React, { useCallback } from 'react'

interface Props {
  onDelete?: (id: number) => void
  isPending?: boolean
}

interface ContentProps {
  data?: ProjectListData | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props

  return (
    <div className='mt-5'>
      <section>
        <div className='flex flex-col items-center justify-center gap-5'>
          <ExclamationCircleOutlined
            style={{
              fontSize: '7rem',
              color: '#E94C4C'
            }}
          />
          <div className='text-center'>
            <h2>ยืนยันลบโครงการหรือไม่?</h2>
            <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='rounded-lg border border-[#E94C4C] bg-[#E94C4C]/20 p-5'>
          <p>ชื่อโครงการ: {data?.project_name || '-'}</p>
          <p>รหัสโครงการ: {data?.project_no || '-'}</p>
          <p>เลขที่สัญญา: {data?.contract_no || '-'}</p>
          <p>ผู้ว่าจ้าง: {data?.department?.department_short_name || '-'}</p>
          <p>ผู้รับจ้าง: {data?.contractor?.contractor?.company_name || '-'}</p>
          <p>
            ระยะเวลาค้ำประกัน:{' '}
            {data?.warranty_start_date ? dayjs(data.warranty_start_date).format('DD MMM BBBB') : '-'}
            {' - '}
            {data?.warranty_end_date ? dayjs(data.warranty_end_date).format('DD MMM BBBB') : '-'}
          </p>
        </div>
      </section>
    </div>
  )
}

const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { onDelete, isPending } = props
  const { open, type, data } = useAppSelector((state) => state.custom_modal.project_modal)
  const dispatch = useAppDispatch()

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
        title={null}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={type === 'DELETE' ? open : false}
        okText='ยืนยัน'
        cancelText='ยกเลิก'
        okButtonProps={{
          loading: isPending,
          shape: 'round'
        }}
        cancelButtonProps={{
          disabled: isPending,
          shape: 'round'
        }}
        onOk={() => data?.id != null && onDelete?.(data.id)}
        onCancel={handleClose}
        destroyOnHidden
        width={600}
      >
        <Content
          data={data}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalConfirmDelete)
