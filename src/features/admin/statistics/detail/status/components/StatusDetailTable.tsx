"use client"
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import SearchBar, { type FilterConfig } from '@/components/searchable/SearchBar'
import { useStatusDetailContext } from '../context'
import { getVMSNotificationsAPI } from '@/services/routes/ControlVMSService'
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

const StatusBadge = ({ status }: { status: VMSNotificationStatus }) => {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.info
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

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'info', label: 'Info', colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'warning', label: 'Warning', colorPrimary: '#FF9D00', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a5200] text-white', badgeIdleClass: 'bg-[#FF9D00]/20 text-[#FF9D00]' },
  { key: 'alert', label: 'Alert', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
  { key: 'critical', label: 'Critical', colorPrimary: '#FF0000', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-950 text-white', badgeIdleClass: 'bg-red-700/20 text-red-500' },
]

// ── Component ──────────────────────────────────────────────────────────────────

const StatusDetailTable: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('ALL')
  const searchParams = useSearchParams()
  const vmsId = searchParams.get('detail') ?? ''
  const { dateRange } = useStatusDetailContext()
  const startDate = dateRange?.[0]?.format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD')

  const { data, isFetching } = useQuery({
    queryKey: ['vms_notifications', vmsId, startDate, endDate],
    queryFn: () => getVMSNotificationsAPI(vmsId, { start_date: startDate!, end_date: endDate! }),
    enabled: !!vmsId && !!startDate && !!endDate,
  })

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
    ALL: records.length,
    info: records.filter((r) => r.status === 'info').length,
    warning: records.filter((r) => r.status === 'warning').length,
    alert: records.filter((r) => r.status === 'alert').length,
    critical: records.filter((r) => r.status === 'critical').length,
  }), [records])

  const filteredData = React.useMemo(() => {
    if (activeTab === 'ALL') return records
    return records.filter((r) => r.status === activeTab)
  }, [activeTab, records])

  return (
    <div className="pb-6">
      <section className="mb-4">
        <SearchBar
          filters={FILTER_CONFIG}
          stats={stats}
          defaultFilter="ALL"
          onFilterChange={(key) => setActiveTab(key)}
          filterClassName="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pb-0.5 lg:flex lg:flex-wrap lg:items-center"
          showViewToggle={false}
        />
      </section>
      <Table<StatusRow>
        columns={columns}
        dataSource={filteredData}
        loading={isFetching}
        pagination={false}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default React.memo(StatusDetailTable)
