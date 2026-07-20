"use client"
import React from 'react'
import { Alert, Button, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbPhotoOff } from 'react-icons/tb'
import SearchBar, { type FilterConfig, type ViewMode } from '@/components/searchable/SearchBar'
import EventDetailModal from '@/features/admin/incident-detection/components/EventDetailModal'
import { useIncidentTransactions } from '@/hooks/queries/incident-detection'
import type { IncidentTransactionItem } from '@/types/incident-detection/details-api'
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
  /** Full source row — needed to open EventDetailModal on image click. */
  raw: IncidentTransactionItem
}

// Shared by StatusBadge (table) and IncidentCard (grid) below.
const EVENT_TYPE_COLOR: Record<IncidentStatusType, string> = {
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

const StatusBadge = ({ label }: { label: IncidentStatusType }) => {
  const color = EVENT_TYPE_COLOR[label] ?? '#979797'
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

// ── Grid view (Segmented "appstore" mode) — mirrors incident-detection's
// EventGridView card style, adapted to this page's own IncidentRecord shape. ──

const IncidentCard: React.FC<{ record: IncidentRecord; onSelect: (item: IncidentTransactionItem) => void }> = ({ record, onSelect }) => {
  const color = EVENT_TYPE_COLOR[record.eventType] ?? '#979797'
  return (
    <div className='flex flex-col gap-2 rounded-2xl p-4' style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <div className='flex items-center gap-2'>
        <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: color }} />
        <h4 className='mb-0 font-semibold' style={{ color }}>{record.eventType}</h4>
      </div>
      <p className='fs-11 text-gray-400 mb-0'>{record.datetime}</p>
      <div className='my-1 border-t border-dashed' style={{ borderColor: 'rgba(252,209,22,0.5)' }} />
      <p className='fs-11 leading-snug mb-0.5 line-clamp-2'>
        <span className='text-gray-400'>ชื่อกล้อง : </span>
        <span className='text-blue-400'>{record.cameraName}</span>
      </p>
      <p className='fs-11 text-gray-400 mb-1'>IP Address : {record.ipAddress}</p>
      {record.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={record.imageUrl}
          alt='ภาพเหตุการณ์'
          className='w-full aspect-[4/3] rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity'
          onClick={() => onSelect(record.raw)}
          title='คลิกเพื่อดูรายละเอียดเหตุการณ์'
        />
      ) : (
        <div className='w-full aspect-[4/3] rounded-lg flex items-center justify-center bg-[#0e0e0e] text-gray-600'>
          <TbPhotoOff size={22} />
        </div>
      )}
    </div>
  )
}

const IncidentGridView: React.FC<{ records: IncidentRecord[]; onSelect: (item: IncidentTransactionItem) => void }> = ({ records, onSelect }) => {
  if (records.length === 0) {
    return <div className='py-12 text-center text-white/30 text-sm'>ไม่พบเหตุการณ์</div>
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {records.map((r) => <IncidentCard key={r.key} record={r} onSelect={onSelect} />)}
    </div>
  )
}

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'รถจอดไหล่ทาง', label: 'รถจอดไหล่ทาง', colorPrimary: '#00AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#005580] text-white', badgeIdleClass: 'bg-[#00AEFF]/20 text-[#00AEFF]' },
  { key: 'งานก่อสร้าง', label: 'งานก่อสร้าง', colorPrimary: '#B2FF00', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#567a00] text-white', badgeIdleClass: 'bg-[#B2FF00]/20 text-[#B2FF00]' },
  { key: 'ปิดกั้นทาง', label: 'ปิดกั้นทาง', colorPrimary: '#FF00F2', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#7a0075] text-white', badgeIdleClass: 'bg-[#FF00F2]/20 text-[#FF00F2]' },
]

interface IncidentDetailTableProps {
  /** Already validated against the selected route by the parent screen. */
  solutionId: string
  roadCode?: string
}

const IncidentDetailTable: React.FC<IncidentDetailTableProps> = ({ solutionId, roadCode }) => {
  const [activeTab, setActiveTab] = React.useState('ALL')
  const [viewMode, setViewMode] = React.useState<ViewMode>('TABLE')
  const [selected, setSelected] = React.useState<IncidentTransactionItem | null>(null)
  const { dateRange } = useIncidentDetailContext()

  const startDate = dateRange?.[0]?.format('YYYY-MM-DD')
  const endDate = dateRange?.[1]?.format('YYYY-MM-DD')

  const { data, isLoading, isFetching, isError, refetch } = useIncidentTransactions({
    solution_id: solutionId,
    start_date: startDate,
    end_date: endDate,
  })

  const records: IncidentRecord[] = React.useMemo(() => {
    const items = data?.res_data ?? []
    // `${id}-${index}` — the backend can return the same event `id` more than
    // once in a single page (e.g. a join fan-out), which would otherwise
    // produce a duplicate React key and silently drop/duplicate rows.
    return items.map((item, index) => ({
      key: `${item.id}-${index}`,
      datetime: dayjs(item.date_time).format('DD/MM/YYYY HH:mm'),
      eventType: (item.analytic_type_info?.analytic_type_name_th ?? 'อื่นๆ') as IncidentStatusType,
      cameraName: item.camera?.camera_name ?? '-',
      ipAddress: item.camera?.ip_address ?? '-',
      imageUrl: item.image_path,
      status: (item.analytic_type_info?.analytic_type_name_th ?? 'อื่นๆ') as IncidentStatusType,
      raw: item,
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
      render: (url: string | undefined, record: IncidentRecord) => (
        <div
          onClick={() => setSelected(record.raw)}
          title='คลิกเพื่อดูรายละเอียดเหตุการณ์'
          style={{
            width: 100, height: 64, borderRadius: 6, overflow: 'hidden',
            backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', border: '1px solid #333', cursor: 'pointer',
          }}
        >
          {url
            ? <img src={url} alt="incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src="/atlas/images/statistics/c1ex.png" alt="incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

  if (isLoading) {
    return <div className="min-h-48 flex items-center justify-center"><Spin size="large" /></div>
  }

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="ไม่สามารถโหลดรายการเหตุการณ์ได้"
        action={<Button size="small" onClick={() => void refetch()}>ลองใหม่</Button>}
      />
    )
  }

  return (
    <div>
      <section className="mb-4">
        <SearchBar
          filters={FILTER_CONFIG}
          stats={stats}
          defaultFilter="ALL"
          onFilterChange={(key) => setActiveTab(key)}
          defaultViewMode={viewMode}
          onViewModeChange={setViewMode}
          showExportButton={false}
          // Mobile: 2-column grid so each tab fills half the row (2 per line,
          // no scrollbar). Desktop: flex row as usual.
          filterClassName="grid grid-cols-2 gap-2 pb-0.5 lg:flex lg:flex-wrap lg:items-center"
        />
      </section>
      {viewMode === 'TABLE' ? (
        <Table<IncidentRecord>
          columns={columns}
          dataSource={filteredData}
          loading={isFetching}
          pagination={false}
          size="middle"
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <Spin spinning={isFetching}>
          <IncidentGridView records={filteredData} onSelect={setSelected} />
        </Spin>
      )}

      <EventDetailModal
        open={!!selected}
        event={selected}
        roadCode={roadCode}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

export default React.memo(IncidentDetailTable)
