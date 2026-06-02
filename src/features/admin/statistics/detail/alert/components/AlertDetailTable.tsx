"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import SearchBar, { type FilterConfig } from '@/components/searchable/SearchBar'

// ── Types ──────────────────────────────────────────────────────────────────────

export type AlertLevelType = 'Warning' | 'Alert'
export type AlertLineStatusType = 'UP' | 'DOWN'

export interface AlertSubRecord {
  key: string
  datetime: string
  device: string
  event: string
  level: AlertLevelType
  lineStatus: AlertLineStatusType
}

export interface AlertRecord {
  key: string
  datetime: string
  device: string
  event: string
  level: AlertLevelType
  lineStatus: AlertLineStatusType
  children?: AlertSubRecord[]
}

// ── Badges ─────────────────────────────────────────────────────────────────────

const LevelBadge = ({ label }: { label: AlertLevelType }) => {
  const color = label === 'Warning' ? '#FF9D00' : '#E94C4C'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${color}`, color,
    }}>
      {label}
    </span>
  )
}

const LineStatusBadge = ({ label }: { label: AlertLineStatusType }) => {
  const color = label === 'UP' ? '#66AEFF' : '#E94C4C'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${color}`, color,
    }}>
      {label}
    </span>
  )
}

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'UP', label: 'UP', colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'DOWN', label: 'DOWN', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
]

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  data?: AlertRecord[]
  loading?: boolean
}

// ── Mock data ──────────────────────────────────────────────────────────────────

export const ALERT_MOCK_DATA: AlertRecord[] = [
  { key: '1', datetime: '20 เม.ย. 2569 11:35:33', device: 'Warning Transformer เฟส 1 ตัว', event: 'อาจเกิดโอเวอร์โหลด / ซ่อมบำรุง', level: 'Warning', lineStatus: 'UP' },
  { key: '2', datetime: '20 เม.ย. 2569 12:10:05', device: 'Warning Transformer เฟส 2 ตัว', event: 'อาจเกิดไฟช็อตในตู้ / ซ่อมบำรุง', level: 'Warning', lineStatus: 'DOWN' },
  { key: '3', datetime: '20 เม.ย. 2569 13:22:18', device: 'Alert Transformer เฟส 3 ตัว', event: 'กลับมาใช้งานได้', level: 'Alert', lineStatus: 'UP' },
  { key: '4', datetime: '19 เม.ย. 2569 09:45:10', device: 'Alert Line สาย A', event: 'อาจเกิดโอเวอร์โหลด / ซ่อมบำรุง', level: 'Alert', lineStatus: 'DOWN' },
  { key: '5', datetime: '19 เม.ย. 2569 08:22:55', device: 'Warning Line สาย B', event: 'กลับมาใช้งานได้', level: 'Warning', lineStatus: 'UP' },
  { key: '6', datetime: '18 เม.ย. 2569 17:05:44', device: 'Alert วงจรหลัก', event: 'อาจเกิดไฟช็อตในตู้ / ซ่อมบำรุง', level: 'Alert', lineStatus: 'DOWN' },
  { key: '7', datetime: '18 เม.ย. 2569 14:30:20', device: 'Warning วงจรสำรอง', event: 'กลับมาใช้งานได้', level: 'Warning', lineStatus: 'UP' },
  { key: '8', datetime: '17 เม.ย. 2569 11:10:05', device: 'Alert สายส่งไฟฟ้า', event: 'อาจเกิดโอเวอร์โหลด / ซ่อมบำรุง', level: 'Alert', lineStatus: 'DOWN' },
]

// ── Component ──────────────────────────────────────────────────────────────────

const AlertDetailTable: React.FC<Props> = ({ data = ALERT_MOCK_DATA, loading = false }) => {
  const [activeTab, setActiveTab] = React.useState('ALL')

  const columns: ColumnsType<AlertRecord> = React.useMemo(() => [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'datetime',
      key: 'datetime',
      align: 'center',
      width: 200,
    },
    {
      title: 'อุปกรณ์',
      dataIndex: 'device',
      key: 'device',
      align: 'center',
      width: 260,
      render: (value: string, record: AlertRecord) => (
        <LevelBadge label={record.level} />
      ),
    },
    {
      title: 'เหตุการณ์',
      dataIndex: 'event',
      key: 'event',
      align: 'center',
      width: 260,
      render: (value: string) => (
        <span style={{ color: '#FFFFFF' }}>{value}</span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'lineStatus',
      key: 'lineStatus',
      align: 'center',
      width: 120,
      fixed: 'right',
      render: (value: AlertLineStatusType) => <LineStatusBadge label={value} />,
    },
  ], [])

  const flatData = React.useMemo(() => {
    const all: AlertRecord[] = []
    data.forEach((r) => {
      all.push(r)
      r.children?.forEach((c) => all.push(c as AlertRecord))
    })
    return all
  }, [data])

  const stats = React.useMemo(() => ({
    ALL: flatData.length,
    UP: flatData.filter((r) => r.lineStatus === 'UP').length,
    DOWN: flatData.filter((r) => r.lineStatus === 'DOWN').length,
  }), [flatData])

  const filteredData = React.useMemo(() => {
    if (activeTab === 'ALL') return data
    return data
      .map((r) => ({
        ...r,
        children: r.children?.filter((c) => c.lineStatus === activeTab),
      }))
      .filter((r) => r.lineStatus === activeTab || (r.children && r.children.length > 0))
  }, [activeTab, data])

  return (
    <div>
      <section className="mb-4">
        <SearchBar
          filters={FILTER_CONFIG}
          stats={stats}
          defaultFilter="ALL"
          onFilterChange={(key) => setActiveTab(key)}
        />
      </section>
      <Table<AlertRecord>
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

export default React.memo<Props>(AlertDetailTable)
