import React, { useMemo, useState } from 'react'
import DisplayTitle from './DisplayTitle'
import DisplayTableList from './DisplayTableList'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import ExportFileModal from '@/components/export/ExportFileModal'
import { statusMeta } from '@/features/admin/vms-command-center/constants/vmsStatus'
import type { SettingByRoad } from '@/types/control-vms/display-api'
import { useControlVMSContext } from '../../../context'
import { useVMSSettingByRoad } from '../../../hooks/useVMSSettingByRoad'

dayjs.extend(buddhistEra)

interface Props {

}

/** One flattened export row = a DisplayTableData row + its road-group header
 *  fields (the screen renders one card per road; the export flattens the
 *  grouping into สายทาง/หน่วยงาน columns, mirroring cctv/lpr). */
type DisplayExportRow = SettingByRoad & {
  road_code: string
  department_short_name: string
}

const fmtThaiDate = (v: string) => (v ? dayjs(v).locale('th').format('DD MMM BBBB') : '-')

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen DisplayTableData, plus ลำดับ/สายทาง/หน่วยงาน since the
// export flattens the per-road group cards. `width` = Excel chars,
// `widthPct` = PDF table percent (sums to 100).
const DISPLAY_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: DisplayExportRow, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'สายทาง', width: 12, widthPct: 7, value: (r) => r.road_code || '-' },
  { header: 'หน่วยงาน', width: 16, widthPct: 9, value: (r) => r.department_short_name || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 14, align: 'left', value: (r) => r.solution_name || '-' },
  { header: 'หมวดหมู่', width: 14, widthPct: 8, value: (r) => r.setting_type_name || '-' },
  { header: 'ประเภทเนื้อหา', width: 16, widthPct: 10, value: (r) => r.settings_content || '-' },
  { header: 'วันที่เริ่มต้น', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.start_date) },
  { header: 'วันที่สิ้นสุด', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.end_date) },
  { header: 'แสดงผล', width: 12, widthPct: 6, value: (r) => r.display_hour || '-' },
  // Same label source as the on-screen <StatusPill status={...} /> cell.
  { header: 'สถานะการแสดงผล', width: 16, widthPct: 9, value: (r) => (r.status != null ? statusMeta(r.status).label : '-') },
  { header: 'การเชื่อมต่อ', width: 12, widthPct: 6, value: (r) => (r.is_online ? 'ออนไลน์' : 'ออฟไลน์') },
]

const DataDisplaySection: React.FC<Props> = (props) => {
  const { } = props
  const { searchText } = useControlVMSContext()
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading, isError } = useVMSSettingByRoad(searchText?.road_code)

  // Flatten the road-grouped response into one row per setting, in the SAME
  // order the cards render, tagging each row with its group header fields.
  const exportRows = useMemo<DisplayExportRow[]>(() => (
    (data?.data ?? []).flatMap((route) =>
      (route.settings ?? []).map((setting) => ({
        ...setting,
        road_code: route.road_code,
        department_short_name: route.department_short_name,
      }))
    )
  ), [data])

  // Human-readable note of the active search — printed in the PDF header so a
  // reader knows what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const road = searchText?.road_code?.trim()
    return road ? `ค้นหาสายทาง "${road}"` : undefined
  }, [searchText])

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return <DisplayTableList data={data?.data} />
  }, [isLoading, isError, data])

  return (
    <>
      <section className='mt-5'>
        <DisplayTitle onExport={() => setExportOpen(true)} />
      </section>
      <section className='mt-5'>
        {renderContent}
      </section>

      {/* นำออกเอกสาร — exports the rows the tables below show (all road groups
          flattened, current search applied), through the shared pdf/excel
          utils like cctv/lpr overall. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'VMS_Display_Schedule_Report',
            title: 'รายงานสายทางที่มีตารางเวลาป้าย VMS (VMS Display Schedule)',
            filterNote: exportFilterNote,
            columns: DISPLAY_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'VMS_Display_Schedule_Report',
            sheetName: 'VMS Display Schedule',
            title: 'รายงานสายทางที่มีตารางเวลาป้าย VMS (VMS Display Schedule)',
            filterNote: exportFilterNote,
            columns: DISPLAY_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: exportRows,
          })
        }}
      />
    </>
  )
}

export default React.memo<Props>(DataDisplaySection)
