"use client"
import React, { useState } from 'react'
import { Button, ConfigProvider, Modal } from 'antd'
import { FaFileExcel, FaFilePdf } from 'react-icons/fa'

interface Props {
  open: boolean
  onClose: () => void
  /** Row count shown as "จำนวนข้อมูล: N รายการ" — omit to hide the line
   *  (chart-style reports have no meaningful row count). */
  count?: number
  /** Export handlers — a button renders only when its handler is passed
   *  (chart-style pages can offer PDF only). Async handlers get a per-button
   *  loading state; the modal closes itself after a successful export. */
  onExportPdf?: () => void | Promise<void>
  onExportExcel?: () => void | Promise<void>
}

/** Shared "นำออกเอกสาร" dialog — same layout as the drr-cm-fe original
 *  (white card, red PDF / green Excel buttons). Uses the app's `light-modal`
 *  override so AntD widgets inside stay dark-on-light. */
const ExportFileModal: React.FC<Props> = ({ open, onClose, count, onExportPdf, onExportExcel }) => {
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null)

  const run = (kind: 'pdf' | 'excel', fn: () => void | Promise<void>) => async () => {
    setBusy(kind)
    try {
      await fn()
      onClose()
    } catch (e) {
      // Keep the modal open so the user can retry; surface the reason in dev.
      console.error(`Export ${kind} failed:`, e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#ffffff', headerBg: '#ffffff', titleColor: '#212121' } } }}
    >
    <Modal
      title={<span style={{ color: '#212121', fontWeight: 700 }}>Export File</span>}
      open={open}
      onCancel={busy ? undefined : onClose}
      footer={null}
      centered
      width={400}
      className='light-modal'
    >
      <div style={{ padding: '8px 0 4px' }}>
        <p style={{ color: '#212121', fontWeight: 500, marginBottom: 6 }}>
          เลือกรูปแบบไฟล์ที่ต้องการ Export:
        </p>
        {count != null && (
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            จำนวนข้อมูล: {count.toLocaleString()} รายการ
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {onExportPdf && (
            <Button
              type='primary'
              size='large'
              icon={<FaFilePdf />}
              onClick={run('pdf', onExportPdf)}
              loading={busy === 'pdf'}
              disabled={busy !== null && busy !== 'pdf'}
              block
              style={{ height: 50, fontSize: 16, fontWeight: 600, backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              Export as PDF
            </Button>
          )}
          {onExportExcel && (
            <Button
              type='primary'
              size='large'
              icon={<FaFileExcel />}
              onClick={run('excel', onExportExcel)}
              loading={busy === 'excel'}
              disabled={busy !== null && busy !== 'excel'}
              block
              style={{ height: 50, fontSize: 16, fontWeight: 600, backgroundColor: '#16A34A', borderColor: '#16A34A' }}
            >
              Export as Excel
            </Button>
          )}
          <Button size='large' onClick={onClose} disabled={busy !== null} block style={{ height: 50, fontSize: 16 }}>
            ยกเลิก
          </Button>
        </div>
      </div>
    </Modal>
    </ConfigProvider>
  )
}

export default React.memo<Props>(ExportFileModal)
