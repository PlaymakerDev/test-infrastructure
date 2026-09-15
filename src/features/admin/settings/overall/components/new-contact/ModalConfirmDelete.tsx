import { useAppDispatch, useAppSelector } from '@/stores/hooks'
import { resetContactModalData } from '@/stores/reducers/modal/customModalSlice'
import { ContractorData } from '@/types/manage/contractor-api'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { ConfigProvider, Modal } from 'antd'
import React, { useCallback } from 'react'

interface Props {
  onDelete?: (id: string) => void
  isPending?: boolean
}

interface ContentProps {
  data?: ContractorData | null
  inUse: boolean
}

const Content: React.FC<ContentProps> = (props) => {
  const { data, inUse } = props

  if (inUse) {
    return (
      <div className='mt-5'>
        <section>
          <div className='flex flex-col items-center justify-center gap-5'>
            <ExclamationCircleOutlined style={{ fontSize: '7rem', color: '#F59E0B' }} />
            <div className='text-center'>
              <h2>ไม่สามารถลบผู้รับจ้างได้</h2>
              <p>
                ผู้รับจ้างรายนี้กำลังถูกใช้งานอยู่ใน{' '}
                <strong>{(data?.project_count ?? 0).toLocaleString()}</strong> โครงการ
                กรุณาลบหรือย้ายโครงการที่เกี่ยวข้องก่อน
              </p>
            </div>
          </div>
        </section>
        <section className='mt-5'>
          <div className='rounded-lg border border-[#F59E0B] bg-[#F59E0B]/20 p-5'>
            <p>ชื่อบริษัท: {data?.company_name || '-'}</p>
            <p>ชื่อย่อ: {data?.short_name || '-'}</p>
            <p>ผู้ติดต่อ: {data?.name || '-'}</p>
            <p>จำนวนโครงการที่ใช้งาน: {(data?.project_count ?? 0).toLocaleString()}</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className='mt-5'>
      <section>
        <div className='flex flex-col items-center justify-center gap-5'>
          <ExclamationCircleOutlined style={{ fontSize: '7rem', color: '#E94C4C' }} />
          <div className='text-center'>
            <h2>ยืนยันลบผู้รับจ้างหรือไม่?</h2>
            <p>ระบบจะลบข้อมูลโดยไม่สามารถกู้คืนหรือย้อนกลับได้</p>
          </div>
        </div>
      </section>
      <section className='mt-5'>
        <div className='rounded-lg border border-[#E94C4C] bg-[#E94C4C]/20 p-5'>
          <p>ชื่อบริษัท: {data?.company_name || '-'}</p>
          <p>ชื่อย่อ: {data?.short_name || '-'}</p>
          <p>ผู้ติดต่อ: {data?.name || '-'}</p>
          <p>เบอร์โทรศัพท์: {data?.phone || '-'}</p>
        </div>
      </section>
    </div>
  )
}

/** Two branches: (1) contractor is used by ≥1 project → block delete with an
 *  orange alert acknowledged via ยกเลิก only; (2) safe to delete → red
 *  confirmation prompt wired to the real DELETE mutation. Mirrors the old
 *  DeleteContactModal's in-use preflight — see that file's own note. If the
 *  server still refuses (e.g. an FK constraint this preflight missed), the
 *  mutation error is surfaced by the parent's message.error toast. */
const ModalConfirmDelete: React.FC<Props> = (props) => {
  const { onDelete, isPending } = props
  const { open, type, data } = useAppSelector((state) => state.custom_modal.contact_modal)
  const dispatch = useAppDispatch()

  const inUse = !!data && data.project_count > 0

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
        title={null}
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={type === 'DELETE' ? open : false}
        okText={inUse ? undefined : 'ยืนยัน'}
        cancelText={inUse ? 'รับทราบ' : 'ยกเลิก'}
        // In-use is a dead end — hide the confirm action entirely so there is
        // nothing to accidentally click into a delete attempt.
        okButtonProps={inUse ? { style: { display: 'none' } } : { loading: isPending, shape: 'round' }}
        cancelButtonProps={{ disabled: isPending, shape: 'round' }}
        onOk={() => data?.user_id && onDelete?.(data.user_id)}
        onCancel={handleClose}
        destroyOnHidden
        width={600}
      >
        <Content
          data={data}
          inUse={inUse}
        />
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ModalConfirmDelete)
