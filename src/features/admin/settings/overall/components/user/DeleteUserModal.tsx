"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'
import type { User } from '../../types/user'
import RoleBadge from './RoleBadge'
import StatusPill from './StatusPill'

interface Props {
  open: boolean
  user: User | null
  onClose: () => void
  onConfirm: (id: string) => void
}

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start gap-2 text-sm'>
    <span className='text-gray-600 shrink-0'>{label}&nbsp;:</span>
    <span className='text-black break-words'>{children}</span>
  </div>
)

const DeleteUserModal: React.FC<Props> = ({ open, user, onClose, onConfirm }) => {
  const handleConfirm = () => {
    if (user) onConfirm(user.id)
    onClose()
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: {
            colorIcon: '#000000',
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            footerBg: '#FFFFFF',
          },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={560} closable={false}>
        <div className='flex flex-col items-center gap-4 py-2'>
          <div
            className='w-16 h-16 rounded-full flex items-center justify-center'
            style={{ border: '3px solid #FF6666' }}
          >
            <TbAlertCircle size={40} color='#FF6666' />
          </div>
          <div className='text-center'>
            <h3 className='text-black font-bold text-lg m-0'>ยืนยันลบผู้ใช้งานหรือไม่?</h3>
            <p className='text-gray-500 text-sm mt-1 mb-0'>
              ระบบจะลบผู้ใช้งานโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {user && (
            <div
              className='w-full rounded-xl p-4 space-y-1.5'
              style={{ border: '1px solid #FF6666', background: '#FFF5F5' }}
            >
              <InfoRow label='Username'>{user.username}</InfoRow>
              <InfoRow label='ชื่อ-นามสกุล'>{user.fullName}</InfoRow>
              <InfoRow label='อีเมล'>{user.email}</InfoRow>
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-600'>บทบาท&nbsp;:</span>
                <RoleBadge role={user.role} />
              </div>
              <InfoRow label='หน่วยงาน'>{user.department}</InfoRow>
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-gray-600'>สถานะ&nbsp;:</span>
                <StatusPill status={user.status} />
              </div>
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

export default React.memo<Props>(DeleteUserModal)
