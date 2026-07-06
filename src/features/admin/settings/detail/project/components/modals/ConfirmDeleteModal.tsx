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
  const accent = variant === 'danger' ? '#FF6666' : '#66AEFF'
  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000' },
        },
      }}
    >
      <Modal open={open} onCancel={onCancel} footer={null} destroyOnHidden width={620} closable={false}>
        <div className='flex flex-col items-center gap-4 py-2'>
          <div
            className='w-16 h-16 rounded-full flex items-center justify-center'
            style={{ border: `3px solid ${accent}` }}
          >
            <TbAlertCircle size={40} color={accent} />
          </div>
          <div className='text-center'>
            <h3 className='text-black font-bold text-lg m-0'>{title}</h3>
            {subtitle && <p className='text-gray-500 text-sm mt-1 mb-0'>{subtitle}</p>}
          </div>
          <div
            className='w-full rounded-xl p-4'
            style={{ border: `1px solid ${accent}`, background: variant === 'danger' ? '#FFF5F5' : '#F0F7FF' }}
          >
            {bodyNode}
          </div>
          <div className='flex justify-end gap-2 w-full mt-2'>
            <Button size='large' shape='round' onClick={onCancel}>ยกเลิก</Button>
            <Button
              size='large'
              shape='round'
              onClick={onConfirm}
              style={{
                background: 'var(--yellow)', color: '#000',
                borderColor: 'var(--yellow)', fontWeight: 700,
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

export default React.memo<Props>(ConfirmDeleteModal)
