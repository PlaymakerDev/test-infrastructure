"use client"
import React, { useCallback } from 'react'
import { ConfigProvider, Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

export interface ConfirmCreateLetterModalProps {
  open: boolean
  saving: boolean
  /** กลับไปแก้ไข — back to the form. */
  onBack: () => void
  /** บันทึกแบบฟอร์มหนังสือแจ้งซ่อม — the one step that really saves. */
  onConfirm: () => void
}

const actionButton = 'px-6 py-2.5 rounded-full text-[16px] font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed'

/** ยืนยันสร้างแบบฟอร์มหนังสือแจ้งซ่อม — last stop before the case is created:
 *  once issued, the letter can no longer be edited (user 2026-09-28). */
const ConfirmCreateLetterModal: React.FC<ConfirmCreateLetterModalProps> = ({ open, saving, onBack, onConfirm }) => {
  // Focus the content, not the first button: AntD's focus trap would otherwise
  // start on กลับไปแก้ไข with a focus ring the design doesn't have.
  const focusOnMount = useCallback((el: HTMLDivElement | null) => {
    el?.focus({ preventScroll: true })
  }, [])

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', colorIcon: '#FFFFFF', colorIconHover: '#FFFFFF', borderRadiusLG: 16 } } }}
    >
      <Modal
        open={open}
        // Nothing may dismiss it half-way through the save.
        onCancel={saving ? undefined : onBack}
        keyboard={!saving}
        footer={null}
        title={null}
        closable={false}
        centered
        width={{ xs: '92vw', sm: 600, md: 720 }}
        mask={{ blur: true, closable: !saving }}
        destroyOnHidden
        aria-labelledby='confirm-create-letter-title'
      >
        <div ref={focusOnMount} tabIndex={-1} className='flex flex-col items-center text-center px-1 sm:px-6 pt-6 pb-2 outline-none'>
          <ExclamationCircleOutlined style={{ fontSize: 'clamp(4.5rem, 18vw, 7rem)', color: '#E94C4C' }} />
          <h2 id='confirm-create-letter-title' className='mt-5 mb-0 font-bold text-white text-[20px] sm:text-[24px]'>
            ยืนยันสร้างแบบฟอร์มหนังสือแจ้งซ่อม
          </h2>
          <p className='mt-3 mb-0 text-[16px]' style={{ color: '#979797' }}>
            {/* The mock's line breaks only where there is room for them; a
                phone lets the sentence flow instead of breaking mid-line. */}
            เมื่อมีการสร้างหนังสือแจ้งซ่อมสำหรับ Case นี้เรียบร้อยแล้ว{' '}
            <br className='hidden sm:inline' />
            ระบบจะไม่อนุญาตให้แก้ไขหรือเปลี่ยนแปลงข้อมูลใด ๆ ภายในหนังสือแจ้งซ่อมดังกล่าวอีกต่อไป
          </p>
          <p className='mt-3 mb-0 text-[16px]' style={{ color: '#E94C4C' }}>
            กรุณาตรวจสอบความถูกต้องและครบถ้วนของข้อมูลอีกครั้ง{' '}
            <br className='hidden sm:inline' />
            ก่อนดำเนินการสร้างหนังสือแจ้งซ่อม
          </p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <button type='button' className={actionButton} style={{ background: '#C4C4C4', color: '#212121' }} onClick={onBack} disabled={saving}>
              กลับไปแก้ไข
            </button>
            <button type='button' className={actionButton} style={{ background: '#FCD116', color: '#212121' }} onClick={onConfirm} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกแบบฟอร์มหนังสือแจ้งซ่อม'}
            </button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<ConfirmCreateLetterModalProps>(ConfirmCreateLetterModal)
