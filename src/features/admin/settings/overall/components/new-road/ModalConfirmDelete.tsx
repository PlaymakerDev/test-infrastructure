import { useDepartments } from '@/hooks/queries/manage/useDepartments'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetRoadModalData } from '@/stores/reducers/modal/customModalSlice'
import { RoadData } from '@/types/manage/road-api'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback } from 'react'

interface Props {
  onDelete?: (id: number) => void
  isPending?: boolean
}

interface ContentProps {
  data?: RoadData | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props

  const { data: departments, isLoading: isDepartmentsLoading, isError: isDepartmentsError } = useDepartments()

  const renderDpt = useCallback((departmentId?: number | null) => {
    if (data?.department?.department_short_name) return data.department.department_short_name
    if (isDepartmentsLoading) return 'กำลังโหลด...'
    if (isDepartmentsError) return 'เกิดข้อผิดพลาด'
    const department = departments?.find((dpt) => Number(dpt.id) === Number(departmentId))
    if (department?.department_short_name) return department.department_short_name
    return '-'
  }, [data, departments, isDepartmentsLoading, isDepartmentsError])

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
            <h2>ยืนยันลบสายทางหรือไม่?</h2>
            <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='rounded-lg border border-[#E94C4C] bg-[#E94C4C]/20 p-5'>
          <p>รหัสสายทาง: {data?.road_code || '-'}</p>
          <p>ชื่อสายทาง: {data?.road_name || '-'}</p>
          <p>จังหวัด: {data?.province || '-'}</p>
          <p>อำเภอ: {data?.district || '-'}</p>
          <p>หน่วยงาน: {renderDpt(data?.department_id)}</p>
        </div>
      </section>
    </div>
  )
}

const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { onDelete, isPending } = props
  const { open, type, data } = useAppSelector((state) => state.custom_modal.road_modal)
  const dispatch = useAppDispatch()

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
