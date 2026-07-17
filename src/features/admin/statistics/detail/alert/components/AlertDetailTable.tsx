"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import SearchBar, { type FilterConfig, type ViewMode } from '@/components/searchable/SearchBar'
import { getLightingAlertsAPI } from '@/services/routes/LightingService'
import type { AlertItem } from '@/types/lighting'

dayjs.extend(buddhistEra)
dayjs.locale('th')

// ── Badges ─────────────────────────────────────────────────────────────────────

const levelOf = (equipmentId: string): 'Warning' | 'Alert' => {
  if (/^alert/i.test(equipmentId)) return 'Alert'
  return 'Warning'
}

const LevelBadge = ({ equipmentId }: { equipmentId: string }) => {
  const level = levelOf(equipmentId)
  const color = level === 'Warning' ? '#FF9D00' : '#E94C4C'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${color}`, color,
    }}>
      {level}
    </span>
  )
}

const LineStatusBadge = ({ status }: { status: string }) => {
  const color = status === 'UP' ? '#66AEFF' : '#E94C4C'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 12px', borderRadius: 9999,
      fontSize: 12, whiteSpace: 'nowrap',
      border: `1px solid ${color}`, color,
    }}>
      {status}
    </span>
  )
}

// ── Grid view (Segmented "appstore" mode) — mirrors incident-detection's
// IncidentGridView card style (statistics/detail/incident), adapted to AlertItem. ──

const alertKey = (r: AlertItem) => `${r.imei}-${r.timestamp}-${r.equipment_id}-${r.incident}-${r.status}`

const AlertCard: React.FC<{ record: AlertItem }> = ({ record }) => {
  const level = levelOf(record.equipment_id)
  const levelColor = level === 'Warning' ? '#FF9D00' : '#E94C4C'
  return (
    <div className='flex flex-col gap-2 rounded-2xl p-4' style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: levelColor }} />
          <h4 className='mb-0 font-semibold' style={{ color: levelColor }}>{level}</h4>
        </div>
        <LineStatusBadge status={record.status} />
      </div>
      <p className='fs-11 text-gray-400 mb-0'>
        {record.timestamp ? dayjs(record.timestamp).format('D MMM BBBB HH:mm:ss') : '-'}
      </p>
      <div className='my-1 border-t border-dashed' style={{ borderColor: 'rgba(252,209,22,0.5)' }} />
      <p className='fs-11 leading-snug mb-0' style={{ color: '#66AEFF' }}>{record.incident}</p>
    </div>
  )
}

const AlertGridView: React.FC<{ records: AlertItem[] }> = ({ records }) => {
  if (records.length === 0) {
    return <div className='py-12 text-center text-white/30 text-sm'>ไม่พบข้อมูล</div>
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
      {records.map((r) => <AlertCard key={alertKey(r)} record={r} />)}
    </div>
  )
}

// ── Filter config ──────────────────────────────────────────────────────────────

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'ALL', label: 'ทั้งหมด', colorPrimary: '#FCD116', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#8a7000] text-white', badgeIdleClass: 'bg-[#FCD116]/20 text-[#FCD116]' },
  { key: 'UP', label: 'UP', colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A', badgeActiveClass: 'bg-[#1B3F8B] text-white', badgeIdleClass: 'bg-[#66AEFF]/20 text-[#66AEFF]' },
  { key: 'DOWN', label: 'DOWN', colorPrimary: '#E94C4C', colorTextLightSolid: '#ffffff', badgeActiveClass: 'bg-red-800 text-white', badgeIdleClass: 'bg-red-500/20 text-red-400' },
]

// ── Component ──────────────────────────────────────────────────────────────────

const AlertDetailTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ALL')
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE')
  const searchParams = useSearchParams()
  const imei = searchParams.get('detail') ?? ''
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    if (!imei) {
      setLoaded(true)
      return
    }
    getLightingAlertsAPI(imei, { limit: 100, sort: 'DESC' })
      .then((res) => { if (active) setAlerts(res.data?.res_data ?? []) })
      .catch((err) => console.error('alerts failed:', err))
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [imei])

  const columns: ColumnsType<AlertItem> = useMemo(() => [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'timestamp',
      key: 'timestamp',
      align: 'center',
      width: 200,
      render: (t: string) => (
        <span style={{ color: '#FFFFFF' }}>
          {t ? dayjs(t).format('D MMM BBBB HH:mm:ss') : '-'}
        </span>
      ),
    },
    {
      title: 'อุปกรณ์',
      dataIndex: 'equipment_id',
      key: 'equipment_id',
      align: 'center',
      width: 260,
      render: (eid: string) => <LevelBadge equipmentId={eid} />,
    },
    {
      title: 'เหตุการณ์',
      dataIndex: 'incident',
      key: 'incident',
      align: 'center',
      width: 260,
      render: (v: string) => <span style={{ color: '#66AEFF' }}>{v}</span>,
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
      fixed: 'right',
      render: (s: string) => <LineStatusBadge status={s} />,
    },
  ], [])

  const stats = useMemo(() => ({
    ALL: alerts.length,
    UP: alerts.filter((a) => a.status === 'UP').length,
    DOWN: alerts.filter((a) => a.status === 'DOWN').length,
  }), [alerts])

  const filteredData = useMemo(() => {
    if (activeTab === 'ALL') return alerts
    return alerts.filter((a) => a.status === activeTab)
  }, [activeTab, alerts])

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
          onExport={() => alert('TODO: นำออกเอกสาร')}
        />
      </section>
      {viewMode === 'TABLE' ? (
        <Table<AlertItem>
          columns={columns}
          dataSource={filteredData}
          loading={loaded ? false : true}
          pagination={false}
          size="middle"
          rowKey={alertKey}
          scroll={{ x: 'max-content' }}
        />
      ) : (
        <AlertGridView records={filteredData} />
      )}
    </div>
  )
}

export default React.memo(AlertDetailTable)
