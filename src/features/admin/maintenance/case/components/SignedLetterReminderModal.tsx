"use client"
import React, { useCallback, useEffect } from 'react'
import { ConfigProvider, Modal } from 'antd'
import { TbPrinter } from 'react-icons/tb'
import CountdownBar from '@/components/common/CountdownBar'

/** Same run time as the system-maintenance notice (user 2026-09-28). */
export const SIGNED_LETTER_REMINDER_MS = 20_000

export interface SignedLetterReminderModalProps {
  open: boolean
  /** Called on the close button, Esc, or when the countdown runs out. */
  onClose: () => void
  durationMs?: number
}

/** "กรุณานำเข้าหนังสือแจ้งซ่อมพร้อมลายเซ็น" — shown once the letter is saved:
 *  the contractor is only notified after the SIGNED letter is uploaded, so the
 *  officer is reminded to do that. Closes itself like the maintenance notice. */
const SignedLetterReminderModal: React.FC<SignedLetterReminderModalProps> = ({
  open,
  onClose,
  durationMs = SIGNED_LETTER_REMINDER_MS,
}) => {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(timer)
  }, [open, durationMs, onClose])

  // Focus the content rather than the close button (see MaintenanceNoticeModal).
  const focusOnMount = useCallback((el: HTMLDivElement | null) => {
    el?.focus({ preventScroll: true })
  }, [])

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', colorIcon: '#FFFFFF', colorIconHover: '#FFFFFF', borderRadiusLG: 16 } } }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={null}
        centered
        width={{ xs: '92vw', sm: 560, md: 680, lg: 760 }}
        mask={{ blur: true }}
        destroyOnHidden
        aria-labelledby='signed-letter-reminder-title'
      >
        <div ref={focusOnMount} tabIndex={-1} className='flex flex-col items-center text-center px-1 sm:px-8 pt-8 pb-2 outline-none'>
          <TbPrinter size={104} color='#FCD116' aria-hidden />
          <h2 id='signed-letter-reminder-title' className='mt-4 mb-0 font-bold text-white text-[20px] sm:text-[24px]'>
            {/* Keep "พร้อมลายเซ็น" whole — a phone otherwise wraps it as ลาย|เซ็น. */}
            กรุณานำเข้าหนังสือแจ้งซ่อม<span className='whitespace-nowrap'>พร้อมลายเซ็น</span>
          </h2>
          <p className='mt-3 mb-0 text-[16px]' style={{ color: '#979797' }}>
            หากไม่นำเข้าหนังสือแจ้งซ่อมที่มีการลงนามเรียบร้อยแล้วเข้าสู่ระบบ
          </p>
          <p className='mt-1 mb-0 text-[16px]' style={{ color: '#FCD116' }}>
            ผู้รับจ้างจะไม่ได้รับการแจ้งเตือนจากระบบ
          </p>
          <p className='mt-1 mb-0 text-[16px]' style={{ color: '#979797' }}>
            เพื่อดำเนินการตรวจสอบ แก้ไข หรือซ่อมแซมอุปกรณ์ที่อยู่ในสถานะออฟไลน์หรือชำรุด
          </p>
          {open && <CountdownBar durationMs={durationMs} />}
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<SignedLetterReminderModalProps>(SignedLetterReminderModal)
