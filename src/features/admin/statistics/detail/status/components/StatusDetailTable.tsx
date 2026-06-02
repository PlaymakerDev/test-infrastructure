"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import SearchBar, { type FilterConfig } from '@/components/searchable/SearchBar'

// ── Types ──────────────────────────────────────────────────────────────────────

export type StatusType = 'Warning' | 'Alert'

export interface StatusSubRecord {
  key: string
  datetime: string
  eventType: string
  category: string
  status: StatusType
  /** optional: highlight color for a specific cell */
  categoryColor?: string
  eventTypeColor?: string
}

export interface StatusRecord {
  key: string
  datetime: string
  eventType: string
  category: string
  status: StatusType
  /** optional: highlight color for a specific cell */
  categoryColor?: string
  eventTypeColor?: string
  /** sub-rows shown as child rows (not collapsible) */
  children?: StatusSubRecord[]
}

// ── Badge ──────────────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<StatusType, React.CSSProperties> = {
  Warning: { borderColor: '#FF9D00', color: '#FF9D00' },
  Alert: { borderColor: '#E94C4C', color: '#E94C4C' },
}

const StatusBadge = ({ label }: { label: StatusType }) => (
  <span style={{
    display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
    fontSize: 12, whiteSpace: 'nowrap',
    border: `1px solid ${BADGE_STYLE[label].borderColor}`,
    color: BADGE_STYLE[label].color,
  }}>
    {label}
  </span>
)

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'Warning', label: 'Warning', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'Alert', label: 'Alert', colorPrimary: '#ef4444', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
]

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  data?: StatusRecord[]
  loading?: boolean
}

// ── Mock data (replace with API response) ─────────────────────────────────────

export const STATUS_MOCK_DATA: StatusRecord[] = [
  { key: '1', datetime: '20 เม.ย. 2569 13:32:30', eventType: 'ป้าย VMS ขัดข้อง', category: 'อุปกรณ์', status: 'Alert' },
  { key: '2', datetime: '20 เม.ย. 2569 12:15:00', eventType: 'การเชื่อมต่อขาดหาย', category: 'เครือข่าย', status: 'Warning' },
  { key: '3', datetime: '19 เม.ย. 2569 09:45:10', eventType: 'ไฟฟ้าดับ', category: 'ระบบไฟฟ้า', status: 'Alert', eventTypeColor: '#E94C4C' },
  { key: '4', datetime: '19 เม.ย. 2569 08:22:55', eventType: 'อุณหภูมิสูงเกินกำหนด', category: 'สิ่งแวดล้อม', status: 'Warning' },
  { key: '5', datetime: '18 เม.ย. 2569 17:05:44', eventType: 'กล้อง Traffic ขาดการเชื่อมต่อ', category: 'กล้อง', status: 'Warning' },
  { key: '6', datetime: '18 เม.ย. 2569 14:30:20', eventType: 'ป้าย VMS แสดงข้อความผิดพลาด', category: 'อุปกรณ์', status: 'Alert' },
  { key: '7', datetime: '17 เม.ย. 2569 11:10:05', eventType: 'Stream หยุดทำงาน', category: 'เครือข่าย', status: 'Alert' },
]

// ── Component ──────────────────────────────────────────────────────────────────

const StatusDetailTable: React.FC<Props> = ({ data = STATUS_MOCK_DATA, loading = false }) => {
  const [activeTab, setActiveTab] = React.useState('ALL')

  const columns: ColumnsType<StatusRecord> = React.useMemo(() => [
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
      render: (value: string, record: StatusRecord) => (
        <span style={record.eventTypeColor ? { color: record.eventTypeColor } : undefined}>
          {value}
        </span>
      ),
    },
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      width: 160,
      render: (value: string, record: StatusRecord) => (
        <span style={record.categoryColor ? { color: record.categoryColor } : undefined}>
          {value}
        </span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (value: StatusType) => <StatusBadge label={value} />,
    },
  ], [])

  const flatData = React.useMemo(() => {
    const all: StatusRecord[] = []
    data.forEach((r) => {
      all.push(r)
      r.children?.forEach((c) => all.push(c as StatusRecord))
    })
    return all
  }, [data])

  const stats = React.useMemo(() => ({
    ALL: flatData.length,
    Warning: flatData.filter((r) => r.status === 'Warning').length,
    Alert: flatData.filter((r) => r.status === 'Alert').length,
  }), [flatData])

  const filteredData = React.useMemo(() => {
    if (activeTab === 'ALL') return data
    return data
      .map((r) => ({
        ...r,
        children: r.children?.filter((c) => c.status === activeTab),
      }))
      .filter((r) => r.status === activeTab || (r.children && r.children.length > 0))
  }, [activeTab, data])

  return (
    <div className="pb-6">
      <section className="mb-4">
        <SearchBar
          filters={FILTER_CONFIG}
          stats={stats}
          defaultFilter="ALL"
          onFilterChange={(key) => setActiveTab(key)}
        />
      </section>
      <Table<StatusRecord>
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={false}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
        indentSize={24}
      />
    </div>
  )
}

export default React.memo<Props>(StatusDetailTable)
