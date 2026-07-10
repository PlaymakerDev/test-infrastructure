"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'next/navigation'
import SearchBar, { type FilterConfig } from '@/components/searchable/SearchBar'
import { useIncidentTransactions } from '@/hooks/queries/incident-detection'
import { useIncidentDetailContext } from '../context'
import dayjs from 'dayjs'

export type IncidentStatusType = 'รถเกิดอุบัติเหตุ' | 'รถจอดเสีย' | 'รถจอดไหล่ทาง' | 'งานก่อสร้าง' | 'ปิดกั้นทาง' | 'รถย้อนเลน' | 'รถบรรทุกวิ่งเลนขวา' | 'รถความเร็วเกินกำหนด' | 'จราจรติดขัด'

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
    'รถเกิดอุบัติเหตุ': '#FF0000',
    'รถจอดเสีย': '#FFA500',
    'รถจอดไหล่ทาง': '#00AEFF',
    'งานก่อสร้าง': '#B2FF00',
    'ปิดกั้นทาง': '#FF00F2',
    'รถย้อนเลน': '#FF4444',
    'รถบรรทุกวิ่งเลนขวา': '#FF8800',
    'รถความเร็วเกินกำหนด': '#FFFF00',
    'จราจรติดขัด': '#FF6600',
  }
  const color = colorMap[label] ?? '#979797'
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

const IncidentDetailTable: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('ALL')
  const { dateRange } = useIncidentDetailContext()
  const searchParams = useSearchParams()
  const solutionId = searchParams.get('detail') ?? ''

  const startDate = dateRange?.[0]?.format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD')

  const { data, isLoading } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: startDate,
    end_date: endDate,
  })

  const records: IncidentRecord[] = React.useMemo(() => {
    const items = data?.res_data ?? []
    return items.map((item) => ({
      key: String(item.id),
      datetime: dayjs(item.date_time).format('DD/MM/YYYY HH:mm'),
      eventType: (item.analytic_type_info?.analytic_type_name_th ?? 'อื่นๆ') as IncidentStatusType,
      cameraName: item.camera?.camera_name ?? '-',
      ipAddress: item.camera?.ip_address ?? '-',
      imageUrl: item.image_path,
      status: (item.analytic_type_info?.analytic_type_name_th ?? 'อื่นๆ') as IncidentStatusType,
    }))
  }, [data])

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
      render: (url?: string) => (
        <div style={{
          width: 100, height: 64, borderRadius: 6, overflow: 'hidden',
          backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto', border: '1px solid #333',
        }}>
          {url
            ? <img src={url} alt="incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src="/images/statistics/c1ex.png" alt="incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          }
        </div>
      ),
    },
  ], [])

  const stats = React.useMemo(() => {
    const typeDetails = data?.summary?.type_details ?? []
    const getCount = (names: string[]) => typeDetails.filter((t) => names.includes(t.type_name_th)).reduce((sum, t) => sum + t.count, 0)
    return {
      ALL: data?.summary?.total ?? records.length,
      'รถจอดไหล่ทาง': getCount(['รถจอดไหล่ทาง']),
      'งานก่อสร้าง': getCount(['งานก่อสร้าง']),
      'ปิดกั้นทาง': getCount(['ปิดกั้นทาง']),
    }
  }, [data, records.length])

  const filteredData = React.useMemo(() => {
    if (activeTab === 'ALL') return records
    return records.filter((r) => r.status === activeTab)
  }, [activeTab, records])

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
        loading={isLoading}
        pagination={false}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default React.memo(IncidentDetailTable)
