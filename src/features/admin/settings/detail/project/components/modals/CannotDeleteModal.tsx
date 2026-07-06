"use client"
import { Button, ConfigProvider, Modal } from 'antd'
import React from 'react'
import { TbAlertCircle } from 'react-icons/tb'

interface Props {
  open: boolean
  title: string
  subtitleNode: React.ReactNode
  bodyNode: React.ReactNode
  onClose: () => void
}

const CannotDeleteModal: React.FC<Props> = ({ open, title, subtitleNode, bodyNode, onClose }) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000' },
        },
      }}
    >
      <Modal open={open} onCancel={onClose} footer={null} destroyOnHidden width={620} closable={false}>
        <div className='flex flex-col items-center gap-4 py-2'>
          <div
            className='w-16 h-16 rounded-full flex items-center justify-center'
            style={{ border: '3px solid #F59E0B' }}
          >
            <TbAlertCircle size={40} color='#F59E0B' />
          </div>
          <div className='text-center'>
            <h3 className='text-black font-bold text-lg m-0'>{title}</h3>
            <div className='text-gray-600 text-sm mt-1'>{subtitleNode}</div>
          </div>
          <div
            className='w-full rounded-xl p-4'
            style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}
          >
            {bodyNode}
          </div>
          <div className='flex justify-end w-full mt-2'>
            <Button
              size='large'
              shape='round'
              onClick={onClose}
              style={{
                background: 'var(--yellow)', color: '#000',
                borderColor: 'var(--yellow)', fontWeight: 700,
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

export default React.memo<Props>(CannotDeleteModal)
