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
   *  scope to both handlers. Omit for the normal single-scope behavior.
   *  `totalCount` may be omitted for cursor-paginated feeds where the backend
   *  reports no total — the ทั้งหมด option then renders without a count. */
  scope?: { totalCount?: number; pageCount: number }
  /** Export handlers — a button renders only when its handler is passed
   *  (chart-style pages can offer PDF only). Async handlers get a per-button
   *  loading state; the modal closes itself after a successful export. */
  onExportPdf?: (scope?: ExportScope) => void | Promise<void>
  onExportExcel?: (scope?: ExportScope) => void | Promise<void>
  /** A third choice beside ทั้งหมด / หน้าปัจจุบัน, with handlers of its own —
   *  picked, its buttons replace the page's (e.g. สรุปข้อมูลผู้รับจ้าง's
   *  รวมผู้รับจ้าง). `note`: shown under the count while it is picked — what it
   *  exports when that differs from the page. Needs `scope`. */
  extraScope?: {
    label: string
    count?: number
    note?: string
    onExportPdf?: () => void | Promise<void>
    onExportExcel?: () => void | Promise<void>
  }
  /** Optional caller-supplied controls (e.g. a date-range picker) rendered
   *  between the heading and the count line. The caller owns the state; keep
   *  contents light-themed to match the white dialog. */
  extra?: React.ReactNode
}

const withCount = (label: string, count?: number) => (count != null ? `${label} (${count.toLocaleString()})` : label)

/** Shared "นำออกเอกสาร" dialog — same layout as the drr-cm-fe original
 *  (white card, red PDF / green Excel buttons). Uses the app's `light-modal`
 *  override so AntD widgets inside stay dark-on-light. */
const ExportFileModal: React.FC<Props> = ({ open, onClose, count, scope, onExportPdf, onExportExcel, extraScope, extra }) => {
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null)
  // Scope toggle state — default ทั้งหมด (the common report need). Only
  // rendered when the page passes `scope`.
  const [scopeValue, setScopeValue] = useState<ExportScope | 'extra'>('all')
  const isExtra = scope && extraScope && scopeValue === 'extra'

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
  // The page's handlers get the chosen scope; the extra scope runs its own.
  const forScope = (fn?: (scope?: ExportScope) => void | Promise<void>) =>
    fn && (() => fn(scope ? (scopeValue === 'page' ? 'page' : 'all') : undefined))
  const handlePdf = isExtra ? extraScope.onExportPdf : forScope(onExportPdf)
  const handleExcel = isExtra ? extraScope.onExportExcel : forScope(onExportExcel)

  const effectiveCount = scope
    ? (isExtra ? extraScope.count : scopeValue === 'all' ? scope.totalCount : scope.pageCount)
    : count

  return (
    <ConfigProvider
      theme={{ components: { Modal: { contentBg: '#ffffff', headerBg: '#ffffff', titleColor: '#212121' } } }}
    >
      {/* destroyOnHidden: a fresh portal at the end of <body> on every open,
          so the dialog lands above whatever modal it was opened from. Kept,
          its portal stayed where it was first created — a modal that
          destroys itself on close (Live Stream, the tracking log modals) and
          was opened again came back after it in the DOM, at the same z-index,
          and covered this dialog until a reload (user 2026-10-07). */}
      <Modal
        title={<span style={{ color: '#212121', fontWeight: 700 }}>Export File</span>}
        open={open}
        onCancel={busy ? undefined : onClose}
        footer={null}
        centered
        width={400}
        className='light-modal'
        destroyOnHidden
      >
        <div style={{ padding: '8px 0 4px' }}>
          <p style={{ color: '#212121', fontWeight: 500, marginBottom: 6 }}>
            เลือกรูปแบบไฟล์ที่ต้องการ Export:
          </p>
          {extra && <div style={{ marginBottom: 12 }}>{extra}</div>}
          {scope && (
            <div style={{ marginBottom: 10 }}>
              <Segmented<ExportScope | 'extra'>
                size='small'
                value={scopeValue}
                onChange={(v) => setScopeValue(v)}
                disabled={busy !== null}
                options={[
                  { label: withCount('ทั้งหมด', scope.totalCount), value: 'all' },
                  { label: withCount('หน้าปัจจุบัน', scope.pageCount), value: 'page' },
                  ...(extraScope ? [{ label: withCount(extraScope.label, extraScope.count), value: 'extra' as const }] : []),
                ]}
              />
            </div>
          )}
          {effectiveCount != null && (
            <p style={{ color: '#666', fontSize: "var(--fs-12)", marginBottom: isExtra && extraScope.note ? 4 : 20 }}>
              จำนวนข้อมูล: {effectiveCount.toLocaleString()} รายการ
            </p>
          )}
          {isExtra && extraScope.note && (
            <p style={{ color: '#666', fontSize: "var(--fs-12)", marginBottom: 20 }}>{extraScope.note}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {handlePdf && (
              <Button
                type='primary'
                size='large'
                icon={<FaFilePdf />}
                onClick={run('pdf', handlePdf)}
                loading={busy === 'pdf'}
                disabled={busy !== null && busy !== 'pdf'}
                block
                style={{ height: 50, fontSize: 16, fontWeight: 600, backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              >
                Export as PDF
              </Button>
            )}
            {handleExcel && (
              <Button
                type='primary'
                size='large'
                icon={<FaFileExcel />}
                onClick={run('excel', handleExcel)}
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
