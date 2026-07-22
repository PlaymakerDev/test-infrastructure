"use client"
import React from 'react'
import { Alert, Button, Empty, Pagination, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import SearchBar, { type FilterConfig, type ViewMode } from '@/components/searchable/SearchBar'
import ExportFileModal from '@/components/export/ExportFileModal'
import { useStatusDetailContext } from '../context'
import { useVMSNotifications } from '@/features/admin/control-vms/overall/hooks/useVMSNotifications'
import type { VMSNotificationStatus } from '@/types/control-vms/vms-api'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// ── Badge ──────────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<VMSNotificationStatus, { color: string; label: string }> = {
  info: { color: '#66AEFF', label: 'Info' },
  warning: { color: '#FF9D00', label: 'Warning' },
  alert: { color: '#E94C4C', label: 'Alert' },
  critical: { color: '#FF0000', label: 'Critical' },
}

const StatusBadge = ({ status }: { status: string }) => {
  const style = STATUS_STYLE[status as VMSNotificationStatus]
  if (!style) {
    return <span style={{ color: '#979797' }}>{status || '-'}</span>
  }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${style.color}`, color: style.color,
    }}>
      {style.label}
    </span>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatusRow {
  key: string
  datetime: string
  eventType: string
  category: string
  status: VMSNotificationStatus
}

// ── Grid view (Segmented "appstore" mode) — mirrors IncidentDetailTable's
// card style, adapted to this page's own StatusRow shape (no image). ──

const STATUS_CARD_COLOR: Record<VMSNotificationStatus, string> = {
  info: '#66AEFF',
  warning: '#FF9D00',
  alert: '#E94C4C',
  critical: '#FF0000',
}

const StatusCard: React.FC<{ record: StatusRow }> = ({ record }) => {
  const color = STATUS_CARD_COLOR[record.status] ?? '#979797'
  return (
    <div className='flex flex-col gap-2 rounded-2xl p-4' style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: color }} />
          <h4 className='mb-0 font-semibold' style={{ color }}>{record.eventType}</h4>
        </div>
        <StatusBadge status={record.status} />
      </div>
      <p className='fs-11 text-gray-400 mb-0'>{record.datetime}</p>
      <div className='my-1 border-t border-dashed' style={{ borderColor: 'rgba(252,209,22,0.5)' }} />
      <p className='fs-11 leading-snug mb-0' style={{ color: '#66AEFF' }}>{record.category || '-'}</p>
    </div>
  )
}

const StatusGridView: React.FC<{ records: StatusRow[] }> = ({ records }) => {
  if (records.length === 0) {
    return <div className='py-12 text-center text-white/30 text-sm'>ไม่พบประวัติการแจ้งเตือนในช่วงวันที่เลือก</div>
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {records.map((r) => <StatusCard key={r.key} record={r} />)}
    </div>
  )
}

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'info', label: 'Info', colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'warning', label: 'Warning', colorPrimary: '#FF9D00', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a5200] text-white', badgeIdleClass: 'bg-[#FF9D00]/20 text-[#FF9D00]' },
  { key: 'alert', label: 'Alert', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'critical', label: 'Critical', colorPrimary: '#FF0000', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-950 text-white', badgeIdleClass: 'bg-red-700/20 text-red-500' },
]

// Shared column config for both PDF and Excel exports — SAME columns, SAME
// order as the on-screen table (วันที่และเวลา → ประเภทเหตุการณ์ → หมวดหมู่ →
// สถานะ); สถานะ exports the same label the on-screen badge shows. `width` =
// Excel chars, `widthPct` = PDF table percent (sums to 100).
const STATUS_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: StatusRow, index: number) => string | number
}[] = [
  { header: 'วันที่และเวลา', width: 26, widthPct: 25, value: (r) => r.datetime },
  { header: 'ประเภทเหตุการณ์', width: 34, widthPct: 35, value: (r) => r.eventType || '-' },
  { header: 'หมวดหมู่', width: 20, widthPct: 22, value: (r) => r.category || '-' },
  { header: 'สถานะ', width: 12, widthPct: 18, value: (r) => STATUS_STYLE[r.status]?.label ?? (r.status || '-') },
]

// ── Component ──────────────────────────────────────────────────────────────────

interface StatusDetailTableProps {
  vmsId: string | number
}

const StatusDetailTable: React.FC<StatusDetailTableProps> = ({ vmsId }) => {
  const [activeTab, setActiveTab] = React.useState('ALL')
  const [viewMode, setViewMode] = React.useState<ViewMode>('TABLE')
  const [exportOpen, setExportOpen] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const pageSize = 10
  const { dateRange } = useStatusDetailContext()
  const startDate = dateRange?.[0]?.format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD')
  const hasDateRange = Boolean(startDate && endDate)

  const notificationsQuery = useVMSNotifications(vmsId, startDate, endDate)
  const { data, isLoading, isFetching, isError } = notificationsQuery

  const records: StatusRow[] = React.useMemo(() => {
    const items = data?.data?.items ?? []
    return items.map((item, index) => ({
      key: `${item.event_code}-${item.timestamp}-${index}`,
      datetime: item.timestamp ? dayjs(item.timestamp).format('D MMM BBBB HH:mm:ss') : '-',
      eventType: item.event_name,
      category: item.category,
      status: item.status,
    }))
  }, [data])

  const columns: ColumnsType<StatusRow> = React.useMemo(() => [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'datetime',
      key: 'datetime',
      align: 'center',
      width: 200,
    },
    {
      title: 'ประเภทเหตุการณ์',
      dataIndex: 'eventType',
      key: 'eventType',
      align: 'center',
      width: 260,
    },
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      width: 160,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (status: VMSNotificationStatus) => <StatusBadge status={status} />,
    },
  ], [])

  const stats = React.useMemo(() => ({
    ALL: data?.data?.count ?? records.length,
    info: records.filter((r) => r.status === 'info').length,
    warning: records.filter((r) => r.status === 'warning').length,
    alert: records.filter((r) => r.status === 'alert').length,
    critical: records.filter((r) => r.status === 'critical').length,
  }), [data, records])

  const filteredData = React.useMemo(() => {
    if (activeTab === 'ALL') return records
    return records.filter((r) => r.status === activeTab)
  }, [activeTab, records])

  // Reset to page 1 whenever the filter (or underlying data) changes, so a
  // filter switch never strands the view on a now-out-of-range page.
  React.useEffect(() => { setPage(1) }, [activeTab, data])

  const pagedData = React.useMemo(
    () => filteredData.slice((page - 1) * pageSize, page * pageSize),
    [filteredData, page],
  )

  // Human-readable note of the active filter/date range — printed in the PDF
  // header so a reader knows what subset they're looking at.
  const exportFilterNote = React.useMemo(() => {
    const parts: string[] = []
    if (activeTab !== 'ALL') {
      parts.push(`สถานะ ${FILTER_CONFIG.find((f) => f.key === activeTab)?.label ?? activeTab}`)
    }
    if (startDate && endDate) {
      parts.push(`ช่วงวันที่ ${dayjs(startDate).format('D MMM BBBB')} - ${dayjs(endDate).format('D MMM BBBB')}`)
    }
    return parts.length ? parts.join(' · ') : undefined
  }, [activeTab, startDate, endDate])

  if (!hasDateRange) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="กรุณาเลือกช่วงวันที่เพื่อดูประวัติการแจ้งเตือน" />
  }

  if (isLoading) {
    return <div className="min-h-48 flex items-center justify-center"><Spin /></div>
  }

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="ไม่สามารถโหลดประวัติการแจ้งเตือนได้"
        action={<Button size="small" onClick={() => void notificationsQuery.refetch()}>ลองใหม่</Button>}
      />
    )
  }

  return (
    <div className="pb-6">
      <section className="mb-4">
        <SearchBar
          filters={FILTER_CONFIG}
          stats={stats}
          defaultFilter="ALL"
          onFilterChange={(key) => setActiveTab(key)}
          filterClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pb-0.5 lg:flex lg:flex-wrap lg:items-center"
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() => setExportOpen(true)}
          // Deliberately hidden pre-export (original design) — wiring stays so
          // flipping this flag is all it takes to enable the button.
          showExportButton={false}
        />
      </section>

      {/* นำออกเอกสาร — exports the CURRENTLY FILTERED notifications (what the
          table/grid shows, all pages), through the shared pdf/excel utils. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={filteredData.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'VMS_Notification_History_Report',
            title: 'รายงานประวัติการแจ้งเตือนป้าย VMS (VMS Notification History)',
            filterNote: exportFilterNote,
            columns: STATUS_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: filteredData,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'VMS_Notification_History_Report',
            sheetName: 'VMS Notifications',
            title: 'รายงานประวัติการแจ้งเตือนป้าย VMS (VMS Notification History)',
            filterNote: exportFilterNote,
            columns: STATUS_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: filteredData,
          })
        }}
      />
      {viewMode === 'TABLE' ? (
        <Table<StatusRow>
          columns={columns}
          dataSource={filteredData}
          loading={isFetching}
          pagination={{
            current: page,
            pageSize,
            total: filteredData.length,
            onChange: setPage,
            showSizeChanger: false,
          }}
          size="middle"
          rowKey="key"
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบประวัติการแจ้งเตือนในช่วงวันที่เลือก" /> }}
        />
      ) : (
        <>
          <Spin spinning={isFetching}>
            <StatusGridView records={pagedData} />
          </Spin>
          {filteredData.length > pageSize && (
            <div className="flex justify-end mt-4">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredData.length}
                onChange={setPage}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default React.memo(StatusDetailTable)
