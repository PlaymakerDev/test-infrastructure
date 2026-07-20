import React, { useMemo, useState } from 'react'
import { FormSearchControl, ControlStatCard, TableControlData, CCTVControlData } from '../components'
import SearchBar, { ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { CONTROL_MOCK_ROWS, type ControlRecord } from './sections/control/TableControlData'

interface Props {}

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (ลำดับ → วันที่และเวลา → ประเภทการดำเนินการ →
// ชื่อป้าย → ข้อความ/รายละเอียด → IP Address). The ภาพ column is skipped —
// it renders an image, which has no text representation in a table report.
// `width` = Excel chars, `widthPct` = PDF table percent (sums to 100).
const CONTROL_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: ControlRecord, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 6, value: (r) => r.no },
  { header: 'วันที่และเวลา', width: 24, widthPct: 16, value: (r) => `${r.date} ${r.time}` },
  { header: 'ประเภทการดำเนินการ', width: 20, widthPct: 14, value: (r) => r.actionType },
  { header: 'ชื่อป้าย', width: 34, widthPct: 26, align: 'left', value: (r) => r.signName || '-' },
  { header: 'ข้อความ/รายละเอียด', width: 30, widthPct: 26, align: 'left', value: (r) => r.message || '-' },
  { header: 'IP Address', width: 16, widthPct: 12, value: (r) => r.ipAddress || '-' },
]

const ControlSection: React.FC<Props> = () => {
  const [displayType, setDisplayType] = useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = useState(false)

  const renderContent = useMemo(() => {
    switch (displayType) {
      case 'TABLE':
        return <TableControlData />
      case 'GRID':
        return <CCTVControlData />
      default:
        return null
    }
  }, [displayType])

  return (
    <div>
      <section>
        {/* Both export buttons in this tab (the TbPrinter in the search form
            and the SearchBar's นำออกเอกสาร below) open the SAME modal. */}
        <FormSearchControl onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        <ControlStatCard />
      </section>
      <section className='mt-5'>
        <SearchBar
          mode='title'
          title='ตารางข้อมูลการควบคุม VMS'
          onViewModeChange={setDisplayType}
          onExport={() => setExportOpen(true)}
        />
      </section>

      {/* ── นำออกเอกสาร — exports the SAME (mock) rows the control table
            renders. The search form above doesn't filter the mock table yet,
            so no filterNote — export always matches what's on screen. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={CONTROL_MOCK_ROWS.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'VMS_Control_Log',
            title: 'รายงานข้อมูลการควบคุมป้าย VMS (VMS Control Log)',
            columns: CONTROL_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: CONTROL_MOCK_ROWS,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'VMS_Control_Log',
            sheetName: 'VMS Control Log',
            columns: CONTROL_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: CONTROL_MOCK_ROWS,
          })
        }}
      />

      <section className='mt-5'>{renderContent}</section>
    </div>
  )
}

export default React.memo<Props>(ControlSection)
