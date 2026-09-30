"use client"
import React from 'react'
import { ConfigProvider, Empty, Modal, Spin } from 'antd'
import { TbExternalLink, TbFileText } from 'react-icons/tb'

export interface LetterPreviewModalProps {
  open: boolean
  /** Object URL of the PDF; null while it loads or if it failed. */
  url: string | null
  loading: boolean
  failed: boolean
  title: string
  subtitle?: string
  /** The header buttons — e.g. แก้ไข / บันทึก, or ปิด / ดาวน์โหลดเอกสาร. */
  actions: React.ReactNode
  /** Esc and a click on the mask. */
  onClose: () => void
  /** A line under the viewer, about what it can't show yet. */
  note?: string
  loadingText?: string
  failedText?: string
}

/** Class for the header buttons, so both uses of this modal look alike. */
export const previewActionButton = 'inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[14px] font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'

/** A PDF shown in a modal with its buttons on top. Two uses (user 2026-09-28):
 *  the letter a /case/new form would issue, checked before anything is saved
 *  (แก้ไข / บันทึก), and a case's signed notice (ปิด / ดาวน์โหลดเอกสาร). */
const LetterPreviewModal: React.FC<LetterPreviewModalProps> = ({
  open,
  url,
  loading,
  failed,
  title,
  subtitle,
  actions,
  onClose,
  note,
  loadingText = 'กำลังโหลดเอกสาร...',
  failedText = 'โหลดเอกสารไม่สำเร็จ กรุณาลองอีกครั้ง',
}) => {
  // Phones' browsers (Android Chrome) have no inline PDF viewer, so the frame
  // would stay blank there — offer the file in its own tab instead.
  const canShowInline = typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', colorIcon: '#FFFFFF', colorIconHover: '#FFFFFF', borderRadiusLG: 16 } } }}
    >
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={null}
        closable={false}
        centered
        width={{ xs: '96vw', md: 900, lg: 1000 }}
        mask={{ blur: true }}
        destroyOnHidden
        aria-labelledby='letter-preview-title'
      >
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex items-start gap-2 min-w-0 flex-1'>
            <TbFileText size={26} color='#FCD116' className='shrink-0 mt-0.5' />
            <div className='min-w-0'>
              <p id='letter-preview-title' style={{ color: '#FCD116', fontSize: 18, fontWeight: 600, margin: 0 }}>
                {title}
              </p>
              {subtitle && <p className='truncate' style={{ color: '#979797', fontSize: 14, margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
          <div className='flex gap-3 w-full sm:w-auto justify-end'>{actions}</div>
        </div>

        {/* Shorter on a phone, where the header already wraps onto two rows. */}
        <div className='mt-4 rounded-lg overflow-hidden h-[58vh] sm:h-[min(72vh,1100px)]' style={{ background: '#525659' }}>
          {loading ? (
            <div className='h-full flex flex-col items-center justify-center gap-3'>
              <Spin size='large' />
              <p style={{ color: '#E6E6E6', fontSize: 14, margin: 0 }}>{loadingText}</p>
            </div>
          ) : failed || !url ? (
            <div className='h-full flex items-center justify-center'>
              <Empty description={<span style={{ color: '#E6E6E6' }}>{failedText}</span>} />
            </div>
          ) : canShowInline ? (
            // No toolbar: the buttons above are what act on the document. No
            // `view=` either: the viewer's default (actual size, or fit to
            // width when the page is wider than the frame) already fits.
            <iframe
              title={title}
              src={`${url}#toolbar=0&navpanes=0`}
              className='w-full h-full border-0 block'
            />
          ) : (
            <div className='h-full flex flex-col items-center justify-center gap-3 px-6 text-center'>
              <TbFileText size={56} color='#FCD116' />
              <p style={{ color: '#E6E6E6', fontSize: 14, margin: 0 }}>เบราว์เซอร์นี้แสดง PDF ในหน้าไม่ได้</p>
              <a
                href={url}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[14px] font-medium'
                style={{ background: '#FCD116', color: '#212121' }}
              >
                <TbExternalLink size={16} />
                เปิดดูเอกสาร (PDF)
              </a>
            </div>
          )}
        </div>

        <div className='mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1'>
          <p style={{ color: '#979797', fontSize: 14, margin: 0 }}>{note}</p>
          {url && canShowInline && !loading && (
            <a href={url} target='_blank' rel='noreferrer' className='inline-flex items-center gap-1 shrink-0' style={{ color: '#66AEFF', fontSize: 14 }}>
              <TbExternalLink size={14} />
              เปิดในแท็บใหม่
            </a>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<LetterPreviewModalProps>(LetterPreviewModal)
