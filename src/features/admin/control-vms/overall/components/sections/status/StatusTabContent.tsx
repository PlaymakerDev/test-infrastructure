import ExportFileModal from '@/components/export/ExportFileModal'
import { statusMeta } from '@/features/admin/vms-command-center/constants/vmsStatus'
import { VMSSettingByStatus, VMSSettingStatusCount } from '@/types/control-vms/display-api'
import { Col, Empty, Row, Skeleton } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import React, { useMemo } from 'react'
import { StatusList } from '../../../components'
import { useControlVMSContext } from '../../../context'
import { useVMSSettingByStatus } from '../../../hooks/useVMSSettingByStatus'

dayjs.extend(buddhistEra)

interface Props {
  item: VMSSettingStatusCount
  /** นำออกเอกสาร modal wiring — state owned by StatusSection (the trigger
   *  button lives in two other subtrees); only the ACTIVE pane is mounted
   *  (Tabs destroyOnHidden), so the modal always exports this tab's rows. */
  exportOpen: boolean
  onExportClose: () => void
}

// Same Mon–Sun values/labels as the on-screen DayList (values 1–7).
const DAY_ABBR: Record<number, string> = { 1: 'จ.', 2: 'อ.', 3: 'พ.', 4: 'พฤ.', 5: 'ศ.', 6: 'ส.', 7: 'อา.' }

const fmtThaiDate = (v: string) => (v ? dayjs(v).locale('th').format('DD MMM BBBB') : '-')

/** Text form of the card's เงื่อนไขการทำงาน block: the all-day pill, or one
 *  line per schedule with its active days + time window (what the DayList
 *  tooltips show on screen). */
const scheduleConditionText = (item: VMSSettingByStatus): string => {
  if (item.is_all_day) return 'แสดงผลตลอดเวลา'
  const lines = (item.schedules ?? []).map((s) => {
    const days = (s.days_of_week ?? []).map((d) => DAY_ABBR[d] ?? String(d)).join(' ')
    return `${s.schedule_name} (${days || '-'}) ${s.time_since}-${s.time_to}`
  })
  return lines.length ? lines.join('\n') : '-'
}

// Shared column config for both PDF and Excel exports — SAME fields, SAME
// order as the on-screen StatusList card (road pill → solution name → status
// pill → hardware pill → dates → condition), skipping the action button and
// video players. `width` = Excel chars, `widthPct` = PDF percent (sums to 100).
const STATUS_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: VMSSettingByStatus, index: number) => string | number
}[] = [
  { header: 'ลำดับ', width: 7, widthPct: 5, value: (_r, i) => i + 1 },
  { header: 'สายทาง', width: 12, widthPct: 8, value: (r) => r.road_code || '-' },
  { header: 'จุดติดตั้ง', width: 34, widthPct: 20, align: 'left', value: (r) => r.solution_name || '-' },
  // Same label source as the card's <StatusPill status={...} />.
  { header: 'สถานะการแสดงผล', width: 16, widthPct: 11, value: (r) => statusMeta(r.status).label },
  { header: 'เชื่อมต่อฮาร์ดแวร์', width: 14, widthPct: 10, value: (r) => (r.is_online ? 'ปกติ' : 'ผิดปกติ') },
  { header: 'วันที่เริ่มต้น', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.start_date) },
  { header: 'วันที่สิ้นสุด', width: 15, widthPct: 13, value: (r) => fmtThaiDate(r.end_date) },
  { header: 'เงื่อนไขการทำงาน', width: 40, widthPct: 20, align: 'left', value: scheduleConditionText },
]

const StatusTabContent: React.FC<Props> = (props) => {
  const { item, exportOpen, onExportClose } = props
  const { statusSearchText } = useControlVMSContext()

  const { data, isLoading, isError } = useVMSSettingByStatus(item.status_id)

  const filteredData = useMemo(() => {
    const list = data?.data ?? []
    const search = statusSearchText.trim().toLowerCase()
    if (!search) return list
    return list.filter((setting) => setting.solution_name.toLowerCase().includes(search))
  }, [data?.data, statusSearchText])

  // Active tab + search term — printed in the PDF header so a reader knows
  // what subset they're looking at.
  const exportFilterNote = useMemo(() => {
    const parts = [`สถานะ ${item.status_name}`]
    const search = statusSearchText.trim()
    if (search) parts.push(`ค้นหา "${search}"`)
    return parts.join(' · ')
  }, [item.status_name, statusSearchText])

  const renderBody = () => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    if (!filteredData.length) return <Empty description="ไม่พบข้อมูล" />

    return (
      <Row gutter={[16, 16]}>
        {filteredData.map((setting) => (
          <Col key={setting.setting_id} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
            <StatusList item={setting} />
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <>
      {renderBody()}

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED cards of this (active)
          status tab, through the shared pdf/excel utils like cctv/lpr.
          Mounted outside renderBody so a click during loading/empty still
          opens the modal instead of leaving exportOpen dangling. */}
      <ExportFileModal
        open={exportOpen}
        onClose={onExportClose}
        count={filteredData.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'VMS_Display_Status_Report',
            title: 'รายงานสถานะการแสดงผลป้าย VMS (VMS Display Status)',
            filterNote: exportFilterNote,
            columns: STATUS_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: filteredData,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'VMS_Display_Status_Report',
            sheetName: 'VMS Display Status',
            columns: STATUS_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: filteredData,
          })
        }}
      />
    </>
  )
}

export default React.memo<Props>(StatusTabContent)
