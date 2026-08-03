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
          Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF', footerBg: '#FFFFFF', colorIcon: '#000', borderRadiusLG: 16 },
        },
      }}
    >
      <Modal
        wrapClassName='light-modal'
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnHidden
        width={620}
        closable={{ 'aria-label': 'Custom Close Button' }}
        styles={{ container: { padding: '36px 40px', borderRadius: 16 }, mask: { background: 'rgba(0,0,0,0.55)' } }}
      >
        <div className='flex flex-col items-center gap-4'>
          <div
            className='rounded-full flex items-center justify-center'
            style={{ width: 56, height: 56, border: '2px solid #F97316' }}
          >
            <TbAlertCircle size={36} color='#F97316' strokeWidth={2.5} />
          </div>
          <div className='text-center'>
            <h3 style={{ color: '#1F1F1F', fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h3>
            <div style={{ color: '#8A8A8A', fontSize: "var(--fs-12)", marginTop: 6 }}>{subtitleNode}</div>
          </div>
          <div
            className='w-full rounded-xl'
            style={{ border: '1px solid #F97316', background: '#FFEDD5', padding: '20px 24px', marginTop: 4 }}
          >
            {bodyNode}
          </div>
          <div className='flex justify-end w-full mt-2'>
            <Button
              shape='round'
              onClick={onClose}
              style={{ background: '#FCD116', color: '#1A1A1A', borderColor: '#FCD116', padding: '10px 32px', height: 'auto', fontWeight: 600 }}
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
