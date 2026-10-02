"use client"
import React, { useState } from 'react'
import { App, ConfigProvider, Modal, Spin, Upload } from 'antd'
import { AxiosError } from 'axios'
import { FaFilePdf } from 'react-icons/fa'
import { TbPrinter, TbTrash } from 'react-icons/tb'
import { useAttachCaseDocument } from '@/hooks/queries/maintenance'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Same cap as the project's contract document (also a signed PDF). */
const MAX_SIGNED_LETTER_SIZE = 30 * 1024 * 1024

const isPdf = (file: { type?: string; name: string }) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

const actionButton = 'px-5 py-2 rounded-full text-[14px] font-medium cursor-pointer border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'

export interface SignedLetterUploadModalProps {
  open: boolean
  caseNo: string
  onClose: () => void
}

/** นำเข้าหนังสือแจ้งซ่อมพร้อมลายเซ็น — the officer uploads the signed PDF of
 *  the letter. Attaching it is what hands a waiting_doc case to the contractor
 *  (backend 2026-09-28); on a case already open it replaces the document. */
const SignedLetterUploadModal: React.FC<SignedLetterUploadModalProps> = ({ open, caseNo, onClose }) => {
  const { message } = App.useApp()
  const [file, setFile] = useState<File | null>(null)
  const attach = useAttachCaseDocument(caseNo)
  const busy = attach.isPending

  const close = () => {
    if (busy) return
    setFile(null)
    onClose()
  }

  const submit = () => {
    if (!file || busy) return
    attach.mutate(file, {
      onSuccess: () => {
        message.success('นำเข้าหนังสือแจ้งซ่อมพร้อมลายเซ็นเรียบร้อยแล้ว')
        setFile(null)
        onClose()
      },
      onError: (err) => {
        const status = err instanceof AxiosError ? err.response?.status : undefined
        const fromServer = err instanceof AxiosError
          ? (err.response?.data?.res_data?.message ?? err.response?.data?.message)
          : err.message
        message.error(
          status === 409 ? 'Case นี้ปิดแล้ว จึงนำเข้าหนังสือไม่ได้'
            : status === 403 ? 'คุณไม่มีสิทธิ์นำเข้าหนังสือของ Case นี้'
              : fromServer || 'นำเข้าหนังสือไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        )
      },
    })
  }

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#1A1A1A', headerBg: '#1A1A1A', colorIcon: '#FFFFFF', colorIconHover: '#FFFFFF', borderRadiusLG: 16 } } }}
    >
      <Modal
        open={open}
        onCancel={close}
        footer={null}
        title={null}
        centered
        width={{ xs: '92vw', sm: 560, md: 640 }}
        // Nothing may dismiss it half-way through the upload.
        closable={!busy}
        keyboard={!busy}
        mask={{ blur: true, closable: !busy }}
        destroyOnHidden
        aria-labelledby='signed-letter-upload-title'
      >
        <div className='flex items-start gap-2 pr-6'>
          <TbPrinter size={26} color='#FCD116' className='shrink-0 mt-0.5' />
          <div className='min-w-0'>
            <p id='signed-letter-upload-title' style={{ color: '#FCD116', fontSize: 18, fontWeight: 600, margin: 0 }}>
              {/* Keep “พร้อมลายเซ็น” whole — a phone otherwise wraps it as ลาย|เซ็น. */}
              นำเข้าหนังสือแจ้งซ่อม<span className='whitespace-nowrap'>พร้อมลายเซ็น</span>
            </p>
            <p style={{ color: '#979797', fontSize: 14, margin: 0 }}>
              หนังสือแจ้งซ่อมที่ลงนามแล้ว (PDF) — เมื่อนำเข้า ระบบจะแจ้งเตือนไปยังผู้รับจ้าง
            </p>
          </div>
        </div>

        <div className='mt-5'>
          {file ? (
            <div className='flex items-center gap-3 rounded-lg px-4 py-3' style={{ border: '1px solid #FFFFFF4D' }}>
              {/* Same icon/colour as the project's contract-document row. */}
              <FaFilePdf size={28} className='shrink-0' style={{ color: '#DC2626' }} />
              <div className='min-w-0 flex-1'>
                <p className='truncate' title={file.name} style={{ color: '#FFFFFF', fontSize: 14, margin: 0 }}>{file.name}</p>
                <p style={{ color: '#979797', fontSize: 14, margin: 0 }}>
                  {busy ? 'กำลังอัปโหลด...' : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                </p>
              </div>
              {busy ? (
                <Spin size='small' />
              ) : (
                <button
                  type='button'
                  aria-label='ลบไฟล์'
                  className='inline-flex items-center justify-center rounded-lg cursor-pointer border-none hover:opacity-90'
                  style={{ width: 36, height: 36, background: '#E94C4C' }}
                  onClick={() => setFile(null)}
                >
                  <TbTrash size={18} color='#FFFFFF' />
                </button>
              )}
            </div>
          ) : (
            <Upload.Dragger
              style={{ background: 'transparent', border: '1px dashed #FFFFFF66', borderRadius: 10, textAlign: 'center' }}
              className='maintenance-upload-dragger'
              accept='.pdf,application/pdf'
              showUploadList={false}
              // Controlled and always empty — the picked file shows as the row above.
              fileList={[]}
              beforeUpload={(picked) => {
                if (!isPdf(picked)) {
                  message.error('รองรับเฉพาะไฟล์ PDF')
                  return Upload.LIST_IGNORE
                }
                if (picked.size > MAX_SIGNED_LETTER_SIZE) {
                  message.error('ไฟล์ต้องมีขนาดไม่เกิน 30 MB')
                  return Upload.LIST_IGNORE
                }
                return false
              }}
              onChange={({ file: picked }) => {
                // beforeUpload → false hands back the raw File (uid attached).
                setFile((picked.originFileObj ?? picked) as unknown as File)
              }}
            >
              <img src={`${BASE_PATH}/images/Maintenance/cloud-upload.png`} alt='' width={44} height={44} style={{ display: 'block', margin: '0 auto' }} />
              <p style={{ color: '#FFFFFF', fontSize: 16, margin: '4px 0 0 0' }}>ลากหรือวางไฟล์</p>
              <p style={{ color: '#7C7C7C', fontSize: 14, margin: '2px 0 0 0' }}>ไฟล์ PDF ขนาดไม่เกิน 30 MB</p>
            </Upload.Dragger>
          )}
        </div>

        <div className='mt-6 flex flex-wrap justify-end gap-3'>
          <button type='button' className={actionButton} style={{ background: '#C4C4C4', color: '#212121' }} onClick={close} disabled={busy}>
            ยกเลิก
          </button>
          <button type='button' className={actionButton} style={{ background: '#FCD116', color: '#212121' }} onClick={submit} disabled={!file || busy}>
            {busy ? 'กำลังนำเข้า...' : 'นำเข้าหนังสือ'}
          </button>
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default React.memo<SignedLetterUploadModalProps>(SignedLetterUploadModal)
