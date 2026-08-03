"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'

interface Props {
  open: boolean
  title: string
  subtitle?: string
  bodyNode: React.ReactNode
  variant?: 'danger' | 'neutral'
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmDeleteModal: React.FC<Props> = ({
  open,
  title,
  subtitle,
  bodyNode,
  variant = 'danger',
  onCancel,
  onConfirm,
}) => {
  const isDanger = variant === 'danger'
  const borderColor = isDanger ? '#FF6B6B' : '#66AEFF'
  const iconColor = isDanger ? '#FF3B3B' : '#66AEFF'
  const bg = isDanger ? '#FFECEC' : '#F0F7FF'
  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000', borderRadiusLG: 16 },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onCancel}
        footer={null}
        destroyOnHidden
        width={620}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '36px 40px', borderRadius: 16 }, mask: { background: 'rgba(0,0,0,0.55)' } }}
      >
        <div className='flex flex-col items-center gap-4'>
          <div
            className='rounded-full flex items-center justify-center'
            style={{ width: 56, height: 56, border: `2px solid ${iconColor}` }}
          >
            <TbAlertCircle size={36} color={iconColor} strokeWidth={2.5} />
          </div>
          <div className='text-center'>
            <h3 style={{ color: '#1F1F1F', fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h3>
            {subtitle && (
              <p style={{ color: '#8A8A8A', fontSize: "var(--fs-12)", marginTop: 6, marginBottom: 0 }}>{subtitle}</p>
            )}
          </div>
          <div
            className='w-full rounded-xl'
            style={{ border: `1px solid ${borderColor}`, background: bg, padding: '20px 24px', marginTop: 4 }}
          >
            {bodyNode}
          </div>
          <div className='flex justify-end gap-3 w-full mt-2'>
            <Button
              shape='round'
              onClick={onCancel}
              style={{ background: '#E5E5E5', color: '#4A4A4A', borderColor: '#E5E5E5', padding: '10px 28px', height: 'auto', fontWeight: 500 }}
            >
              ยกเลิก
            </Button>
            <Button
              shape='round'
              onClick={onConfirm}
              style={{ background: '#FCD116', color: '#1A1A1A', borderColor: '#FCD116', padding: '10px 32px', height: 'auto', fontWeight: 600 }}
            >
              ยืนยัน
            </Button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ConfirmDeleteModal)
