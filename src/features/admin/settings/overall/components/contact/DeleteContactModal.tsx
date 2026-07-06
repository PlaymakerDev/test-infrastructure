"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'
import type { Contractor } from '../../types/contractor'

interface Props {
  open: boolean
  contractor: Contractor | null
  onClose: () => void
  onConfirm: (id: string) => void
}

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start gap-2 text-sm'>
    <span className='text-gray-600 shrink-0'>{label}&nbsp;:</span>
    <span className='text-black break-words'>{children}</span>
  </div>
)

const DeleteContactModal: React.FC<Props> = ({ open, contractor, onClose, onConfirm }) => {
  const inUse = !!contractor && contractor.projectCount > 0

  const handleConfirm = () => {
    if (contractor) onConfirm(contractor.id)
    onClose()
  }

  const themeConfig = {
    components: {
      Modal: {
        colorIcon: '#000000',
        contentBg: '#FFFFFF',
        headerBg: '#FFFFFF',
        footerBg: '#FFFFFF',
      },
    },
  }

  if (inUse && contractor) {
    // Cannot-delete branch — mirrors CannotDeleteModal (orange alert palette).
    return (
      <ConfigProvider theme={themeConfig}>
        <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={620} closable={false}>
          <div className='flex flex-col items-center gap-4 py-2'>
            <div
              className='w-16 h-16 rounded-full flex items-center justify-center'
              style={{ border: '3px solid #F59E0B' }}
            >
              <TbAlertCircle size={40} color='#F59E0B' />
            </div>
            <div className='text-center'>
              <h3 className='text-black font-bold text-lg m-0'>ไม่สามารถลบผู้รับจ้างได้</h3>
              <p className='text-gray-600 text-sm mt-1 mb-0'>
                ผู้รับจ้างรายนี้กำลังถูกใช้งานอยู่ใน{' '}
                <span className='text-black font-semibold'>{contractor.projectCount.toLocaleString()}</span>{' '}
                โครงการ กรุณาลบหรือย้ายโครงการที่เกี่ยวข้องก่อน
              </p>
            </div>

            <div
              className='w-full rounded-xl p-4 space-y-1.5'
              style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}
            >
              <InfoRow label='ชื่อบริษัท'>{contractor.companyName}</InfoRow>
              <InfoRow label='เลขประจำตัวผู้เสียภาษี'>{contractor.taxId}</InfoRow>
              <InfoRow label='ผู้ติดต่อ'>{contractor.contactPerson}</InfoRow>
              <InfoRow label='จังหวัด'>{contractor.province}</InfoRow>
              <InfoRow label='จำนวนโครงการที่ใช้งาน'>
                {contractor.projectCount.toLocaleString()}
              </InfoRow>
            </div>

            <div className='flex justify-end w-full mt-2'>
              <Button
                size='large'
                shape='round'
                onClick={onClose}
                style={{
                  background: 'var(--yellow)',
                  color: '#000',
                  borderColor: 'var(--yellow)',
                  fontWeight: 700,
                }}
              >
                รับทราบ
              </Button>
            </div>
          </div>
        </Modal>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={themeConfig}>
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={620} closable={false}>
        <div className='flex flex-col items-center gap-4 py-2'>
          <div
            className='w-16 h-16 rounded-full flex items-center justify-center'
            style={{ border: '3px solid #FF6666' }}
          >
            <TbAlertCircle size={40} color='#FF6666' />
          </div>
          <div className='text-center'>
            <h3 className='text-black font-bold text-lg m-0'>ยืนยันลบผู้รับจ้างหรือไม่?</h3>
            <p className='text-gray-500 text-sm mt-1 mb-0'>
              ระบบจะลบข้อมูลโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {contractor && (
            <div
              className='w-full rounded-xl p-4 space-y-1.5'
              style={{ border: '1px solid #FF6666', background: '#FFF5F5' }}
            >
              <InfoRow label='ชื่อบริษัท'>{contractor.companyName}</InfoRow>
              <InfoRow label='เลขประจำตัวผู้เสียภาษี'>{contractor.taxId}</InfoRow>
              <InfoRow label='ผู้ติดต่อ'>{contractor.contactPerson}</InfoRow>
              <InfoRow label='เบอร์โทรศัพท์'>{contractor.phone}</InfoRow>
              <InfoRow label='จังหวัด'>{contractor.province}</InfoRow>
            </div>
          )}

          <div className='flex justify-end gap-2 w-full mt-2'>
            <Button size='large' shape='round' onClick={onClose}>
              ยกเลิก
            </Button>
            <Button
              size='large'
              shape='round'
              onClick={handleConfirm}
              style={{
                background: 'var(--yellow)',
                color: '#000',
                borderColor: 'var(--yellow)',
                fontWeight: 700,
              }}
            >
              ยืนยัน
            </Button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(DeleteContactModal)
