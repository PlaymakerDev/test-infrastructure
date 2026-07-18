"use client"
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TbArrowBigLeftFilled, TbBolt } from 'react-icons/tb'
import { Segmented } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import { useStatisticsContext } from '../context'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard, SummaryBadge } from './shared'
import { useLiveAlertRouteItems } from '../../data/useLiveAlertRouteItems'
import type { MapMarkerItem } from '../../data/routeItems'
import { useIotStatus, useIotStatusSummary } from '@/hooks/queries/incident-detection'
import type { ColumnsType } from 'antd/es/table'

// ── Map marker group popup ──────────────────────────────────────────────────
// Shown (instead of navigating instantly) when a marker point represents one
// or more devices at the exact same physical location — e.g. several
// electrical cabinets ("ตู้") installed at one road point, which Mapbox
// clusters together at every zoom level since they share one coordinate.

interface AlertPopupDevice {
  key: string
  label: string
  isOnline: boolean
}

const AlertMapPopup: React.FC<{
  roadCode: string
  departmentName: string
  devices: AlertPopupDevice[]
  onViewDetails: () => void
}> = ({ roadCode, departmentName, devices, onViewDetails }) => (
  <div style={{
    background: '#000000CC', borderRadius: 16, padding: '20px 24px',
    minWidth: 320, maxWidth: 380,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.08)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <TbBolt size={22} color="#FCD116" />
      <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>สายทาง : {roadCode}</span>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: '#FCD116', marginTop: 6, marginLeft: 32 }}>
      หน่วยงานรับผิดชอบ : {departmentName}
    </p>
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {devices.map((d) => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#FFFFFF', flex: 1, minWidth: 0 }}>{d.label}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
            height: 26, borderRadius: 88, padding: '0 12px',
            border: `1px solid ${d.isOnline ? '#66AEFF' : '#E94C4C'}`,
            fontSize: 12, fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap',
          }}>
            <img
              src={d.isOnline ? '/images/statistics/iconconnect.png' : '/images/statistics/iconnoconnect.png'}
              alt=""
              width={14}
              height={14}
            />
            {d.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={onViewDetails}
      style={{
        marginTop: 18, width: '100%', height: 40, borderRadius: 88,
        background: '#FCD116', color: '#212121', border: 'none',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}
    >
      ดูรายละเอียดเหตุการณ์
    </button>
  </div>
)

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'OVERVIEW' },
  { label: 'ตารางเปรียบเทียบเหตุการณ์', value: 'COMPARISON' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const isParent = (r: ComparisonRecord) => !r.isChild

const ALERT_COMPARISON_COLUMNS: ColumnsType<ComparisonRecord> = [
  {
    title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 260,
    render: (v: string, r: ComparisonRecord) => (
      <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff', fontWeight: isParent(r) ? 600 : 400, paddingLeft: 12, display: 'inline-block' }}>{v}</span>
    ),
  },
  {
    title: 'จุดติดตั้ง', dataIndex: 'installations', key: 'installations', align: 'center', width: 120,
    render: (v: number, r: ComparisonRecord) => <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff' }}>{v}</span>,
  },
  {
    title: 'ออนไลน์', dataIndex: 'online', key: 'online', align: 'center', width: 100,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#3A5692' } : {} }),
  },
  {
    title: 'ออฟไลน์', dataIndex: 'offline', key: 'offline', align: 'center', width: 100,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#853434' } : {} }),
  },
  {
    title: 'Line Check', dataIndex: 'lineCheck', key: 'lineCheck', align: 'center', width: 130,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#5C4A0A' } : {} }),
  },
  {
    title: 'Circuit', dataIndex: 'circuit', key: 'circuit', align: 'center', width: 120,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#5C4A0A' } : {} }),
  },
  {
    title: 'Volt / Amp', dataIndex: 'voltAmp', key: 'voltAmp', align: 'center', width: 120,
    render: (v: number) => <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#2E4A1A' } : {} }),
  },
]



// Maps a period Segmented value to { start_date, end_date } bounds for the
// iot-status endpoints (which use `start_date`/`end_date`). Mirrors the same
// logic in IncidentSection's periodToDateBounds.
const periodToSinceUntil = (period: string): { start_date?: string; end_date?: string } => {
  const now = new Date()
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'TODAY':
      return { start_date: fmt(today), end_date: fmt(today) }
    case 'LAST_7_DAYS': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start_date: fmt(start), end_date: fmt(today) }
    }
    case 'THIS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start_date: fmt(start), end_date: fmt(today) }
    }
    case 'THIS_YEAR': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start_date: fmt(start), end_date: fmt(today) }
    }
    case 'LAST_YEAR': {
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end = new Date(now.getFullYear() - 1, 11, 31)
      return { start_date: fmt(start), end_date: fmt(end) }
    }
    default:
      return {}
  }
}

const AlertSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentTab } = useStatisticsContext()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  // Period → { since, until }. Shared by the stat cards AND the map/search-list
  // so they always agree. Part of the TanStack Query cache key AND the backend's
  // Redis cache key, so changing the period refetches automatically.
  const summaryDateRange = React.useMemo(() => periodToSinceUntil(activePeriod), [activePeriod])

  // ค้นหาสายทาง + map markers — `markerItems` plots each device at its OWN
  // real geometry_point (decoupled from the coarser bureau-level search tree).
  const { routeItems: liveRouteItems, markerItems } = useLiveAlertRouteItems(summaryDateRange)

  // MapMarkerItem only carries routeKey/detailKey/lngLat/offline — cross-
  // reference liveRouteItems (which has the road_code/solution_name label +
  // sub-department name) to build the marker-group popup's content. Road
  // code is the part of the label before " - " (see useLiveAlertRouteItems'
  // `${road.road_code} - ${dev.solution_name}` construction).
  const deviceInfoByKey = useMemo(() => {
    const map = new Map<string, { label: string; roadCode: string; isOnline: boolean; subDeptName: string }>()
    for (const bureau of liveRouteItems) {
      for (const sub of bureau.sub3) {
        for (const d of sub.detail) {
          if (typeof d === 'string') continue
          const sepIndex = d.label.indexOf(' - ')
          const roadCode = sepIndex === -1 ? d.label : d.label.slice(0, sepIndex)
          const rest = sepIndex === -1 ? d.label : d.label.slice(sepIndex + 3)
          map.set(String(d.id), {
            label: rest,
            roadCode,
            isOnline: d.is_online ?? d.connected ?? false,
            subDeptName: sub.label,
          })
        }
      }
    }
    return map
  }, [liveRouteItems])

  // Devices that share the exact same coordinate (a "stuck" cluster —
  // StatisticsMapPanel already detected this) show this popup instead of
  // navigating straight to the detail page. NOTE: there's no per-device
  // "Phase" field anywhere in the lighting IoT-status API (same gap already
  // found on the alert detail header), so unlike the reference design this
  // only shows the real fields — road, department, and online status.
  const handleMarkerGroupClick = useCallback((items: MapMarkerItem[]): React.ReactNode => {
    const rows = items
      .map((it) => ({ marker: it, info: deviceInfoByKey.get(it.detailKey) }))
      .filter((x): x is { marker: MapMarkerItem; info: NonNullable<typeof x.info> } => !!x.info)
    if (rows.length === 0) return null
    const first = rows[0]
    return (
      <AlertMapPopup
        roadCode={first.info.roadCode}
        departmentName={first.info.subDeptName}
        devices={rows.map(({ marker, info }) => ({ key: marker.detailKey, label: info.label, isOnline: info.isOnline }))}
        onViewDetails={() => router.push(`/admin/statistics/detail/alert?route=${encodeURIComponent(first.marker.routeKey)}&detail=${encodeURIComponent(first.marker.detailKey)}`)}
      />
    )
  }, [deviceInfoByKey, router])

  // Stat cards data — real API instead of mock.
  const { data: summaryData } = useIotStatusSummary(0, { scope: 'all', ...summaryDateRange })

  // Comparison table data — real API instead of mock. Reuses the same
  // iot-status tree the map/search list uses, but with its OWN period so the
  // comparison table's noti_count can be scoped independently from the
  // overview cards. Bureau = parent row, แขวง (sub_department) = child rows.
  const [comparisonPeriod, setComparisonPeriod] = useState('TODAY')
  const comparisonDateRange = React.useMemo(() => periodToSinceUntil(comparisonPeriod), [comparisonPeriod])
  const { data: comparisonTree, isFetching: comparisonFetching } = useIotStatus(0, { scope: 'all', ...comparisonDateRange })
  const comparisonData: ComparisonRecord[] = React.useMemo(() => {
    const bureaus = comparisonTree ?? []
    const rows: ComparisonRecord[] = []
    for (const bureau of bureaus) {
      rows.push({
        key: `bureau-${bureau.department_id}`,
        agency: bureau.department_short_name,
        installations: bureau.install_points,
        online: bureau.online,
        offline: bureau.offline,
        newCmdWeb: 0,
        newCmdApp: 0,
        lineCheck: bureau.line_check_fail,
        circuit: bureau.circuit_fail,
        voltAmp: bureau.volt_amp_fail,
      })
      for (const sub of bureau.sub_department) {
        rows.push({
          key: `sub-${sub.department_id}`,
          agency: sub.department_short_name,
          installations: sub.install_points,
          online: sub.online,
          offline: sub.offline,
          newCmdWeb: 0,
          newCmdApp: 0,
          lineCheck: sub.line_check_fail,
          circuit: sub.circuit_fail,
          voltAmp: sub.volt_amp_fail,
          isChild: true,
        })
      }
    }
    return rows
  }, [comparisonTree])
  const comparisonBadges: SummaryBadge[] = React.useMemo(() => {
    // Aggregate totals across all bureaus (the root already sums each, but a
    // bureau tree has no single root object, so sum them here).
    const bureaus = comparisonTree ?? []
    const sum = (sel: (b: typeof bureaus[number]) => number) => bureaus.reduce((acc, b) => acc + sel(b), 0)
    return [
      { label: `${sum(b => b.install_points)} จุดติดตั้ง`, color: '#66AEFF' },
      { label: `${sum(b => b.offline)} ออฟไลน์`, color: '#E94C4C', icon: '/images/statistics/iconnoconnect.png' },
      { label: `${sum(b => b.line_check_fail)} Line Check`, color: '#F29F05' },
      { label: `${sum(b => b.circuit_fail)} Circuit`, color: '#FCD116' },
      { label: `${sum(b => b.volt_amp_fail)} Volt / Amp`, color: '#83F205' },
    ]
  }, [comparisonTree])
  const alertCards: StatCard[] = React.useMemo(() => {
    const s = summaryData
    const fmt = (v: number | undefined) => s != null ? (v ?? 0) : '-'
    return [
      { borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF', value: String(fmt(s?.installation_points?.total)), unit: 'จุดติดตั้ง', sub: s ? `1 Phase ${s.installation_points.phase_1} / 3 Phase ${s.installation_points.phase_3}` : '-' },
      { borderColor: '#E94C4C', icon: '/images/statistics/ce2.png', label: 'สถานะสายผิดปกติ', labelColor: '#E94C4C', value: String(fmt(s?.line_broken?.total)), unit: 'เหตุการณ์', sub: s ? `${s.line_broken.top_department.department_short_name} (${s.line_broken.top_department.percentage.toFixed(1)}%)` : '-' },
      { borderColor: '#E99A4C', icon: '/images/statistics/ce3.png', label: 'สถานะวงจรผิดปกติ', labelColor: '#E99A4C', value: String(fmt(s?.circuit_abnormal?.total)), unit: 'เหตุการณ์', sub: s ? `${s.circuit_abnormal.top_department.department_short_name} (${s.circuit_abnormal.top_department.percentage.toFixed(1)}%)` : '-' },
      { borderColor: '#FCD116', icon: '/images/statistics/ce4.png', label: 'การทำงานปกติรวม', labelColor: '#FCD116', value: s ? `${s.normal.percentage.toFixed(1)}%` : '-', sub: s ? `แจ้งเตือน ${s.notifications.total} เหตุการณ์` : '-' },
    ]
  }, [summaryData])

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)', paddingBottom: 40 }}>
      <section className="flex items-start gap-3 px-3">
        <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
        <div>
          <h1 className="text-(--yellow)">ไฟฟ้าแจ้งเตือน</h1>
          <p className="text-(--yellow)">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </div>
      </section>
      <section className="mt-5 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive={activeSubTab}
          setLabelValue={(value) => router.push(`/admin/statistics?alert&subtab=${value.toLowerCase()}`)}
          size={isMobile ? 'middle' : 'large'}
        />
      </section>
      {activeSubTab === 'OVERVIEW' && (
        <section className="mt-4 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Segmented
            value={activePeriod}
            onChange={(value) => setActivePeriod(value as string)}
            options={PERIOD_OPTIONS}
            size={isMobile ? 'middle' : 'large'}
            classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
          />
        </section>
      )}
      {activeSubTab === 'OVERVIEW' && (
        <StatisticsMapPanel
          markerTextColor="#000000"
          markerItemColor="#FCD116"
          markerItemOverflowColor="#E94C4C"
          useModernMarkers
          detailUrl="/admin/statistics/detail/alert"
          hideIndexBadge
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={alertCards}
          routeItems={liveRouteItems}
          markerItems={markerItems}
          onMarkerGroupClick={handleMarkerGroupClick}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable
          data={comparisonData}
          summaryBadges={comparisonBadges}
          columns={ALERT_COMPARISON_COLUMNS}
          useArrowExpand
          activePeriod={comparisonPeriod}
          onPeriodChange={setComparisonPeriod}
          loading={comparisonFetching}
        />
      )}
    </div>
  )
}

export default React.memo(AlertSection)
