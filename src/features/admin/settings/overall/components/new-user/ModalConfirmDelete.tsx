import { ROLE } from '@/constants'
import { useDepartments } from '@/hooks/queries/manage/useDepartments'
import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetUserModalData } from '@/stores/reducers/modal/customModalSlice'
import { APIResponseGeneralUser } from '@/types/manage/general-user-api'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback } from 'react'

interface Props {
  onDelete?: (userId: string) => void
  isPending?: boolean
}

interface ContentProps {
  data?: APIResponseGeneralUser | null
}

const Content: React.FC<ContentProps> = (props) => {
  const { data } = props

  const { data: departments, isLoading: isDepartmentsLoading, isError: isDepartmentsError } = useDepartments()

  const renderDpt = useCallback((departmentId: string) => {
    if (isDepartmentsLoading) return 'กำลังโหลด...'
    if (isDepartmentsError) return 'เกิดข้อผิดพลาด'
    const department = departments?.find(dpt => Number(dpt.id) === Number(departmentId))
    if (department?.department_name) return department.department_name
    return '-'
  }, [departments, isDepartmentsLoading, isDepartmentsError])

  const renderName = useCallback((firstName: string, lastName: string) => {
    return [firstName, lastName].filter(Boolean).join(' ') || '-'
  }, [])

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
            <h2>ยืนยันลบผู้ใช้งานหรือไม่?</h2>
            <p>ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='rounded-lg border border-[#E94C4C] bg-[#E94C4C]/20 p-5'>
          <p>Username: {data?.user?.username || '-'}</p>
          <p>ชื่อ-นามสกุล: {renderName(data?.first_name || '', data?.lastname || '')}</p>
          <p>หน่วยงาน : {renderDpt(String(data?.department_id))}</p>
          <p>จังหวัด : {data?.province?.name_th || '-'}</p>
          <p>สิทธิ์การเข้าถึงข้อมูล : {ROLE[data?.role as keyof typeof ROLE]?.text || '-'}</p>
          <p>ช่องทางการเพิ่มข้อมูล : {data?.is_ldap ? 'LDAP' : 'DRR ITS'}</p>
        </div>
      </section>
    </div>
  )
}

const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { onDelete, isPending } = props
  const { open, type, data } = useAppSelector((state) => state.custom_modal.user_modal)
  const dispatch = useAppDispatch()

  const handleClose = useCallback(() => {
    dispatch(resetUserModalData())
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
        okText="ยืนยัน"
        cancelText="ยกเลิก"
        okButtonProps={{
          loading: isPending,
          shape: 'round'
        }}
        cancelButtonProps={{
          disabled: isPending,
          shape: 'round'
        }}
        onOk={() => onDelete?.(data?.user_id || '')}
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
