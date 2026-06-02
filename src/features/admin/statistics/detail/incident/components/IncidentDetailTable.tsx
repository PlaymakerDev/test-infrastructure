"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import SearchBar, { type FilterConfig } from '@/components/searchable/SearchBar'

export type IncidentStatusType = 'รถจอดไหล่ทาง' | 'งานก่อสร้าง' | 'ปิดกั้นทาง'

export interface IncidentRecord {
  key: string
  datetime: string
  eventType: IncidentStatusType
  cameraName: string
  ipAddress: string
  imageUrl?: string
  status: IncidentStatusType
}

const StatusBadge = ({ label }: { label: IncidentStatusType }) => {
  const colorMap: Record<IncidentStatusType, string> = {
    'รถจอดไหล่ทาง': '#00AEFF',
    'งานก่อสร้าง': '#B2FF00',
    'ปิดกั้นทาง': '#FF00F2',
  }
  const color = colorMap[label]
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

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'รถจอดไหล่ทาง', label: 'รถจอดไหล่ทาง', colorPrimary: '#00AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#005580] text-white', badgeIdleClass: 'bg-[#00AEFF]/20 text-[#00AEFF]' },
  { key: 'งานก่อสร้าง', label: 'งานก่อสร้าง', colorPrimary: '#B2FF00', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#567a00] text-white', badgeIdleClass: 'bg-[#B2FF00]/20 text-[#B2FF00]' },
  { key: 'ปิดกั้นทาง', label: 'ปิดกั้นทาง', colorPrimary: '#FF00F2', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#7a0075] text-white', badgeIdleClass: 'bg-[#FF00F2]/20 text-[#FF00F2]' },
]

interface Props {
  data?: IncidentRecord[]
  loading?: boolean
}

export const INCIDENT_MOCK_DATA: IncidentRecord[] = [
  { key: '1', datetime: '18/04/2569  13:28', eventType: 'รถจอดไหล่ทาง', cameraName: '68FTD-TAK3002-FAI010-จุดที่5-กม.1+830-มุ่งหน้าถนนทางหลวง ทล.105', ipAddress: '192.168.3.169', status: 'รถจอดไหล่ทาง' },
  { key: '2', datetime: '18/04/2569  14:05', eventType: 'รถจอดไหล่ทาง', cameraName: '68FTD-TAK3005-FAI022-จุดที่2-กม.3+200-มุ่งหน้าทางหลวง ทล.12', ipAddress: '192.168.3.172', status: 'รถจอดไหล่ทาง' },
  { key: '3', datetime: '18/04/2569  15:42', eventType: 'รถจอดไหล่ทาง', cameraName: '68FTD-TAK3008-FAI031-จุดที่1-กม.0+950-มุ่งหน้าถนนทางหลวง ทล.105', ipAddress: '192.168.3.178', status: 'รถจอดไหล่ทาง' },
  { key: '4', datetime: '19/04/2569  08:15', eventType: 'รถจอดไหล่ทาง', cameraName: '68FTD-TAK3011-FAI044-จุดที่3-กม.5+100-มุ่งหน้าถนนทางหลวง ทล.1', ipAddress: '192.168.4.101', status: 'รถจอดไหล่ทาง' },
  { key: '5', datetime: '19/04/2569  09:33', eventType: 'รถจอดไหล่ทาง', cameraName: '68FTD-TAK3014-FAI055-จุดที่1-กม.2+400-มุ่งหน้าถนนทางหลวง ทล.105', ipAddress: '192.168.4.115', status: 'รถจอดไหล่ทาง' },
  { key: '6', datetime: '18/04/2569  17:05', eventType: 'งานก่อสร้าง', cameraName: '68FTD-TAK3016-FAI062-จุดที่4-กม.7+600-มุ่งหน้าถนนทางหลวง ทล.12', ipAddress: '192.168.4.122', status: 'งานก่อสร้าง' },
  { key: '7', datetime: '18/04/2569  14:30', eventType: 'งานก่อสร้าง', cameraName: '68FTD-TAK3019-FAI073-จุดที่2-กม.9+200-มุ่งหน้าถนนทางหลวง ทล.105', ipAddress: '192.168.4.133', status: 'งานก่อสร้าง' },
  { key: '8', datetime: '17/04/2569  11:10', eventType: 'งานก่อสร้าง', cameraName: '68FTD-TAK3022-FAI084-จุดที่6-กม.11+800-มุ่งหน้าถนนทางหลวง ทล.1', ipAddress: '192.168.5.101', status: 'งานก่อสร้าง' },
  { key: '9', datetime: '17/04/2569  09:30', eventType: 'ปิดกั้นทาง', cameraName: '68FTD-TAK3025-FAI095-จุดที่3-กม.14+300-มุ่งหน้าถนนทางหลวง ทล.105', ipAddress: '192.168.5.108', status: 'ปิดกั้นทาง' },
  { key: '10', datetime: '16/04/2569  15:55', eventType: 'ปิดกั้นทาง', cameraName: '68FTD-TAK3028-FAI106-จุดที่1-กม.16+700-มุ่งหน้าถนนทางหลวง ทล.12', ipAddress: '192.168.5.116', status: 'ปิดกั้นทาง' },
]

const IncidentDetailTable: React.FC<Props> = ({ data = INCIDENT_MOCK_DATA, loading = false }) => {
  const [activeTab, setActiveTab] = React.useState('ALL')

  const columns: ColumnsType<IncidentRecord> = React.useMemo(() => [
    {
      title: 'วันที่และเวลา', dataIndex: 'datetime', key: 'datetime', align: 'center', width: 160,
      render: (v: string) => <span style={{ color: '#FFFFFF', whiteSpace: 'pre' }}>{v}</span>,
    },
    {
      title: 'ประเภทเหตุการณ์', dataIndex: 'eventType', key: 'eventType', align: 'center', width: 160,
      render: (v: IncidentStatusType) => <StatusBadge label={v} />,
    },
    {
      title: 'ชื่อกล้อง', dataIndex: 'cameraName', key: 'cameraName', align: 'left', width: 360,
      render: (v: string) => <span style={{ color: '#FFFFFF', fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', align: 'center', width: 140,
      render: (v: string) => <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'ภาพขณะเกิดเหตุ', dataIndex: 'imageUrl', key: 'imageUrl', align: 'center', width: 140,
      render: () => (
        <div style={{
          width: 100, height: 64, borderRadius: 6, overflow: 'hidden',
          backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto', border: '1px solid #333',
        }}>
          <img src="/images/statistics/c1ex.png" alt="incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ),
    },
  ], [])

  const stats = React.useMemo(() => ({
    ALL: data.length,
    'รถจอดไหล่ทาง': data.filter((r) => r.status === 'รถจอดไหล่ทาง').length,
    'งานก่อสร้าง': data.filter((r) => r.status === 'งานก่อสร้าง').length,
    'ปิดกั้นทาง': data.filter((r) => r.status === 'ปิดกั้นทาง').length,
  }), [data])

  const filteredData = React.useMemo(() => {
    if (activeTab === 'ALL') return data
    return data.filter((r) => r.status === activeTab)
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
      <Table<IncidentRecord>
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={false}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default React.memo<Props>(IncidentDetailTable)
