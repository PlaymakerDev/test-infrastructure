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
  submitting?: boolean
  onClose: () => void
  onConfirm: (id: string) => void
}

// Figma delete-confirm spec (red variant)
const CARD_BORDER = '#FF6B6B'
const CARD_BG = '#FFECEC'
const ICON_RED = '#FF3B3B'
const LABEL_MUTED = '#6B6B6B'
const VALUE_TEXT = '#1F1F1F'
const CANCEL_BG = '#E5E5E5'
const CANCEL_TEXT = '#4A4A4A'
const CONFIRM_BG = '#FCD116'
const CONFIRM_TEXT = '#1A1A1A'

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start gap-2 fs-12'>
    <span style={{ color: LABEL_MUTED }} className='shrink-0'>{label}&nbsp;:</span>
    <span style={{ color: VALUE_TEXT }} className='break-words'>{children}</span>
  </div>
)

const DeleteUserModal: React.FC<Props> = ({ open, user, submitting, onClose, onConfirm }) => {
  const isSubmitting = !!submitting

  const handleConfirm = () => {
    if (user) onConfirm(user.id)
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
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={560}
        closable={{ 'aria-label': 'Custom Close Button' }}
        mask={{ closable: !isSubmitting }}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          container: { padding: '32px 40px', borderRadius: 16 },
        }}
      >
        <div className='flex flex-col items-center py-2' style={{ gap: 16 }}>
          <div
            className='rounded-full flex items-center justify-center'
            style={{ width: 56, height: 56, border: `2px solid ${ICON_RED}` }}
          >
            <TbAlertCircle size={36} color={ICON_RED} />
          </div>
          <div className='text-center'>
            <h3 style={{ color: VALUE_TEXT, fontSize: 18, fontWeight: 600 }} className='m-0'>
              ยืนยันลบผู้ใช้งานหรือไม่?
            </h3>
            <p style={{ color: '#8A8A8A', fontSize: "var(--fs-12)" }} className='mt-1 mb-0'>
              ระบบจะลบผู้ใช้งานโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {user && (
            <div
              className='w-full rounded-xl space-y-1.5'
              style={{
                border: `1px solid ${CARD_BORDER}`,
                background: CARD_BG,
                padding: 16,
                marginTop: 4,
              }}
            >
              <InfoRow label='Username'>{user.username}</InfoRow>
              <InfoRow label='ชื่อ-นามสกุล'>{user.fullName || '-'}</InfoRow>
              <div className='flex items-center gap-2 fs-12'>
                <span style={{ color: LABEL_MUTED }}>บทบาท&nbsp;:</span>
                <RoleBadge role={user.role} />
              </div>
              <InfoRow label='หน่วยงาน'>{user.department}</InfoRow>
              <div className='flex items-center gap-2 fs-12'>
                <span style={{ color: LABEL_MUTED }}>สถานะ&nbsp;:</span>
                <StatusPill status={user.status} />
              </div>
            </div>
          )}

          <div className='flex justify-end w-full' style={{ gap: 12, marginTop: 8 }}>
            <Button
              shape='round'
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: CANCEL_BG,
                color: CANCEL_TEXT,
                borderColor: CANCEL_BG,
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              shape='round'
              loading={isSubmitting}
              onClick={handleConfirm}
              style={{
                background: CONFIRM_BG,
                color: CONFIRM_TEXT,
                borderColor: CONFIRM_BG,
                fontWeight: 600,
                padding: '10px 32px',
                height: 'auto',
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
