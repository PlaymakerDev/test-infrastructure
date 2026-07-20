"use client"
import React, { useState } from 'react'
import { Button, ConfigProvider, Modal, Segmented } from 'antd'
import { FaFileExcel, FaFilePdf } from 'react-icons/fa'

/** Which rows to export when the page offers a choice (see `scope` prop). */
export type ExportScope = 'all' | 'page'

interface Props {
  open: boolean
  onClose: () => void
  /** Row count shown as "จำนวนข้อมูล: N รายการ" — omit to hide the line
   *  (chart-style reports have no meaningful row count). Ignored when
   *  `scope` is provided (the picker shows both counts instead). */
  count?: number
  /** Optional scope picker for paginated tables: renders a
   *  "ทั้งหมด / หน้าปัจจุบัน" toggle (default ทั้งหมด) and passes the chosen
   *  scope to both handlers. Omit for the normal single-scope behavior. */
  scope?: { totalCount: number; pageCount: number }
  /** Export handlers — a button renders only when its handler is passed
   *  (chart-style pages can offer PDF only). Async handlers get a per-button
   *  loading state; the modal closes itself after a successful export. */
  onExportPdf?: (scope?: ExportScope) => void | Promise<void>
  onExportExcel?: (scope?: ExportScope) => void | Promise<void>
}

/** Shared "นำออกเอกสาร" dialog — same layout as the drr-cm-fe original
 *  (white card, red PDF / green Excel buttons). Uses the app's `light-modal`
 *  override so AntD widgets inside stay dark-on-light. */
const ExportFileModal: React.FC<Props> = ({ open, onClose, count, scope, onExportPdf, onExportExcel }) => {
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null)
  // Scope toggle state — default ทั้งหมด (the common report need). Only
  // rendered when the page passes `scope`.
  const [scopeValue, setScopeValue] = useState<ExportScope>('all')

  const run = (kind: 'pdf' | 'excel', fn: (scope?: ExportScope) => void | Promise<void>) => async () => {
    setBusy(kind)
    try {
      await fn(scope ? scopeValue : undefined)
      onClose()
    } catch (e) {
      // Keep the modal open so the user can retry; surface the reason in dev.
      console.error(`Export ${kind} failed:`, e)
    } finally {
      setBusy(null)
    }
  }

  const effectiveCount = scope
    ? (scopeValue === 'all' ? scope.totalCount : scope.pageCount)
    : count

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
        {scope && (
          <div style={{ marginBottom: 10 }}>
            <Segmented<ExportScope>
              size='small'
              value={scopeValue}
              onChange={(v) => setScopeValue(v)}
              disabled={busy !== null}
              options={[
                { label: `ทั้งหมด (${scope.totalCount.toLocaleString()})`, value: 'all' },
                { label: `หน้าปัจจุบัน (${scope.pageCount.toLocaleString()})`, value: 'page' },
              ]}
            />
          </div>
        )}
        {effectiveCount != null && (
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
            จำนวนข้อมูล: {effectiveCount.toLocaleString()} รายการ
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
