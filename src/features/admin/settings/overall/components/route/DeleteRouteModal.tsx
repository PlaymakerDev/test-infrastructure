"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'
import type { Route } from '../../types/route'

interface Props {
  open: boolean
  route: Route | null
  deleting: boolean
  onClose: () => void
  onConfirm: (id: number) => void | Promise<void>
}

// Figma tokens for the delete-confirm dialog.
const FIGMA = {
  redBorder: '#FF6B6B',
  redIcon: '#FF3B3B',
  redTint: '#FFECEC',
  labelText: '#6B6B6B',
  valueText: '#1F1F1F',
  titleText: '#1F1F1F',
  subtitleText: '#8A8A8A',
  cancelBg: '#E5E5E5',
  cancelText: '#4A4A4A',
  confirmBg: '#FCD116',
  confirmText: '#1A1A1A',
} as const

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className='flex items-start gap-2 fs-12'>
    <span style={{ color: FIGMA.labelText }} className='shrink-0'>
      {label}&nbsp;:
    </span>
    <span style={{ color: FIGMA.valueText }} className='break-words'>
      {children}
    </span>
  </div>
)

const formatLength = (v: number) =>
  typeof v === 'number' && !Number.isNaN(v)
    ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '-'

const DeleteRouteModal: React.FC<Props> = ({
  open,
  route,
  deleting,
  onClose,
  onConfirm,
}) => {
  const handleConfirm = () => {
    if (route && !deleting) onConfirm(route.id)
  }

  // Prevent backdrop / ESC dismissal while the delete request is inflight —
  // Ant fires onCancel for both.
  const handleCancel = () => {
    if (deleting) return
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
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={handleCancel}
        footer={null}
        destroyOnHidden
        width={560}
        closable={{ 'aria-label': 'Custom Close Button' }}
        mask={{ closable: !deleting }}
        keyboard={!deleting}
        styles={{
          mask: { background: 'rgba(0,0,0,0.55)' },
          container: { borderRadius: 16, padding: '32px 40px' },
          body: { padding: 0 },
        }}
      >
        <div className='flex flex-col items-center'>
          <div
            className='rounded-full flex items-center justify-center'
            style={{
              width: 56,
              height: 56,
              border: `2px solid ${FIGMA.redIcon}`,
            }}
          >
            <TbAlertCircle size={32} color={FIGMA.redIcon} />
          </div>
          <div className='text-center' style={{ marginTop: 16 }}>
            <h3
              className='m-0'
              style={{ color: FIGMA.titleText, fontSize: 18, fontWeight: 600 }}
            >
              ยืนยันลบสายทางหรือไม่?
            </h3>
            <p
              className='mb-0'
              style={{ color: FIGMA.subtitleText, fontSize: "var(--fs-12)", marginTop: 6 }}
            >
              ระบบจะลบคำสั่งโดยไม่สามารถกู้คืนหรือย้อนกลับได้
            </p>
          </div>

          {route && (
            <div
              className='w-full rounded-xl space-y-1.5'
              style={{
                marginTop: 20,
                padding: 16,
                border: `1px solid ${FIGMA.redBorder}`,
                background: FIGMA.redTint,
              }}
            >
              <InfoRow label='รหัสสายทาง'>{route.code}</InfoRow>
              <InfoRow label='ชื่อสายทาง'>{route.name}</InfoRow>
              <InfoRow label='จังหวัด'>{route.province}</InfoRow>
              <InfoRow label='อำเภอ'>{route.district || '-'}</InfoRow>
              <InfoRow label='ระยะทาง (กม.)'>{formatLength(route.lengthKm)}</InfoRow>
              <InfoRow label='หน่วยงานรับผิดชอบ'>{route.responsibleOffice || '-'}</InfoRow>
            </div>
          )}

          <div className='flex justify-end w-full' style={{ marginTop: 20, gap: 12 }}>
            <Button
              onClick={handleCancel}
              disabled={deleting}
              style={{
                background: FIGMA.cancelBg,
                color: FIGMA.cancelText,
                borderColor: FIGMA.cancelBg,
                borderRadius: 999,
                padding: '10px 28px',
                height: 'auto',
                fontWeight: 500,
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirm}
              loading={deleting}
              style={{
                background: FIGMA.confirmBg,
                color: FIGMA.confirmText,
                borderColor: FIGMA.confirmBg,
                borderRadius: 999,
                padding: '10px 32px',
                height: 'auto',
                fontWeight: 600,
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

export default React.memo<Props>(DeleteRouteModal)
