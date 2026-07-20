"use client"
import React, { useState, useCallback } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Segmented } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard, SummaryBadge } from './shared'
import { useLiveIncidentRouteItems } from '../../data/useLiveIncidentRouteItems'
import { useIncidentByDepartment, useIncidentSummary } from '@/hooks/queries/incident-detection'
import type { ColumnsType } from 'antd/es/table'
import useIsMobile from '@/utils/hooks/useIsMobile'

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

// Shared by the OVERVIEW summary cards (`since`/`until`) and the COMPARISON
// table (`start_date`/`end_date`) — same period options, different param names.
const periodToDateBounds = (period: string): { start?: string; end?: string } => {
  const now = new Date()
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'TODAY':
      return { start: fmt(today), end: fmt(today) }
    case 'LAST_7_DAYS': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start: fmt(start), end: fmt(today) }
    }
    case 'THIS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: fmt(start), end: fmt(today) }
    }
    case 'THIS_YEAR': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: fmt(start), end: fmt(today) }
    }
    case 'LAST_YEAR': {
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end = new Date(now.getFullYear() - 1, 11, 31)
      return { start: fmt(start), end: fmt(end) }
    }
    case 'ALL':
      return { start: '2000-01-01', end: fmt(today) }
    default:
      return {}
  }
}

interface IncidentRow {
  key: string
  agency: string
  accident: number
  breakdown: number
  shoulder: number
  construction: number
  blocked: number
  wrongWay: number
  rightLane: number
  speeding: number
  congestion: number
  total: number
  isChild?: boolean
  children?: IncidentRow[]
}

const INCIDENT_COMPARISON_COLUMNS: ColumnsType<IncidentRow> = [
  {
    title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 260, fixed: 'left',
    render: (v: string, r: IncidentRow) => (
      <span style={{ color: r.isChild ? '#ffffff' : '#FCD116', fontWeight: r.isChild ? 400 : 600, paddingLeft: 12, display: 'inline-block' }}>{v}</span>
    ),
  },
  {
    title: 'อุบัติเหตุ', dataIndex: 'accident', key: 'accident', align: 'center', width: 110,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({
      style: r.accident ? { background: r.isChild ? '#4A1C1C' : '#853434' } : {},
    }),
  },
  {
    title: 'รถจอดเสีย', dataIndex: 'breakdown', key: 'breakdown', align: 'center', width: 110,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.breakdown ? { background: r.isChild ? '#4A371C' : '#8F5C38' } : {} }),
  },
  {
    title: 'จอดไหล่ทาง', dataIndex: 'shoulder', key: 'shoulder', align: 'center', width: 120,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.shoulder ? { background: r.isChild ? '#1C3B4A' : '#37718D' } : {} }),
  },
  {
    title: 'งานก่อสร้าง', dataIndex: 'construction', key: 'construction', align: 'center', width: 120,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.construction ? { background: r.isChild ? '#324A1C' : '#56802F' } : {} }),
  },
  {
    title: 'ปิดกั้นทาง', dataIndex: 'blocked', key: 'blocked', align: 'center', width: 110,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.blocked ? { background: r.isChild ? '#4A1C46' : '#7C3076' } : {} }),
  },
  {
    title: 'รถย้อนเลน', dataIndex: 'wrongWay', key: 'wrongWay', align: 'center', width: 110,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.wrongWay ? { background: r.isChild ? '#341C4A' : '#5E3685' } : {} }),
  },
  {
    title: 'รถบรรทุกวิ่งเลนขวา', dataIndex: 'rightLane', key: 'rightLane', align: 'center', width: 170,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.rightLane ? { background: r.isChild ? '#494944' : '#808076' } : {} }),
  },
  {
    title: 'ความเร็วเกินกำหนด', dataIndex: 'speeding', key: 'speeding', align: 'center', width: 160,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.speeding ? { background: r.isChild ? '#1C2B4A' : '#3A5692' } : {} }),
  },
  {
    title: 'จราจรติดขัด', dataIndex: 'congestion', key: 'congestion', align: 'center', width: 120,
    render: (v: number) => v ? <span style={{ color: '#ffffff' }}>{v}</span> : null,
    onCell: (r: IncidentRow) => ({ style: r.congestion ? { background: r.isChild ? '#1C4A47' : '#409994' } : {} }),
  },
  {
    title: 'รวม', dataIndex: 'total', key: 'total', align: 'center', width: 90, fixed: 'right',
    render: (v: number, r: IncidentRow) => <span style={{ color: r.isChild ? '#ffffff' : '#FCD116', fontWeight: r.isChild ? 400 : 600 }}>{v}</span>,
  },
]

const IncidentSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  // Shared by both the stat cards AND the map/search-list below — same
  // start_date/end_date window, same backend param names (NOT since/until;
  // those only appear in the response's echoed `range`). Omitting both
  // makes the backend silently default to "today" instead of erroring,
  // which is why this was easy to miss originally.
  const summaryDateRange = React.useMemo<{ start_date?: string; end_date?: string }>(() => {
    const { start, end } = periodToDateBounds(activePeriod)
    return start && end ? { start_date: start, end_date: end } : {}
  }, [activePeriod])

  // ค้นหาสายทาง + map markers — shared with the detail-page sidebar so all
  // three stay in sync. `markerItems` plots each solution at its OWN real
  // geometry_point (decoupled from the coarser bureau-level search tree).
  // `summaryDateRange` bounds each marker's noti_count to the selected period.
  const {
    routeItems: liveRouteItems,
    markerItems,
    isLoading: routesLoading,
    isError: routesError,
  } = useLiveIncidentRouteItems(summaryDateRange)

  // Stat cards data — real API instead of mock. Refetches whenever the
  // period Segmented above changes (`start_date`/`end_date` are part of the
  // query key).
  const { data: summaryData, isError: summaryError } = useIncidentSummary(0, { scope: 'all', ...summaryDateRange })
  const incidentCards: StatCard[] = React.useMemo(() => {
    const s = summaryData
    const unavailable = summaryError ? '—' : '-'
    const fmt = (v: number | undefined) => !summaryError && s != null ? (v ?? 0) : unavailable
    return [
      { borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF', value: String(fmt(s?.installation_points?.total)), unit: 'จุดติดตั้ง', sub: !summaryError && s ? `${s.installation_points.top_region.name_th} (${s.installation_points.top_region.percentage.toFixed(1)}%)` : unavailable },
      { borderColor: '#05F2DB', icon: '/images/statistics/cs2.png', label: 'เหตุการณ์ทั้งหมด', labelColor: '#05F2DB', value: String(fmt(s?.incidents?.total)), unit: 'เหตุการณ์', sub: !summaryError && s ? `${s.incidents.top_department.department_short_name} (${s.incidents.top_department.percentage.toFixed(1)}%)` : unavailable },
      { borderColor: '#B2FF00', icon: '/images/statistics/cs3.png', label: 'หน่วยงานที่มีเหตุการณ์', labelColor: '#B2FF00', value: String(fmt(s?.incidents?.departments_with_incidents)), unit: 'หน่วยงาน', sub: !summaryError && s ? `${s.incidents.top_department.department_short_name} (${s.incidents.top_department.count} เหตุการณ์)` : unavailable },
      { borderColor: '#FCD116', icon: '/images/statistics/cs4.png', label: 'ประเภทเหตุการณ์ที่พบบ่อย', labelColor: '#FCD116', value: !summaryError ? (s?.top_incident_type?.name_th ?? '-') : '—', sub: !summaryError && s ? `${s.top_incident_type.count} เหตุการณ์ (${s.top_incident_type.percentage.toFixed(1)}%)` : unavailable },
    ]
  }, [summaryData, summaryError])

  // Comparison table data — real API instead of mock.
  const [comparisonPeriod, setComparisonPeriod] = useState('TODAY')
  const comparisonDateRange = React.useMemo<{ start_date?: string; end_date?: string }>(() => {
    const { start, end } = periodToDateBounds(comparisonPeriod)
    return start && end ? { start_date: start, end_date: end } : {}
  }, [comparisonPeriod])

  const { data: byDeptData, isFetching: comparisonFetching, isError: comparisonError } = useIncidentByDepartment(0, comparisonDateRange)
  const comparisonData: IncidentRow[] = React.useMemo(() => {
    const rows = byDeptData?.rows ?? []
    return rows.map((r, idx) => ({
      key: `${r.department_id}-${idx}`,
      agency: r.department_short_name,
      accident: r.counts[0] ?? 0,
      breakdown: r.counts[1] ?? 0,
      shoulder: r.counts[2] ?? 0,
      construction: r.counts[3] ?? 0,
      blocked: r.counts[4] ?? 0,
      wrongWay: r.counts[5] ?? 0,
      rightLane: r.counts[6] ?? 0,
      speeding: r.counts[7] ?? 0,
      congestion: r.counts[8] ?? 0,
      total: r.total,
      isChild: !r.is_aggregate,
    }))
  }, [byDeptData])

  const comparisonBadges: SummaryBadge[] = React.useMemo(() => {
    const s = byDeptData?.summary
    const fmt = (v: number | undefined) => !comparisonError && s != null ? (v ?? 0) : '—'
    return [
      { label: `${fmt(s?.departments_count)} หน่วยงาน`, color: '#B2FF00' },
      { label: `${fmt(s?.installation_points_count)} จุดติดตั้ง`, color: '#66AEFF' },
      { label: `${fmt(s?.incidents_count)} เหตุการณ์`, color: '#05F2DB' },
    ]
  }, [byDeptData, comparisonError])

  return (
    <div className="flex flex-col">
      <section className="flex items-start gap-3 px-3">
        <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
        <div>
          <h1 className="text-(--yellow)">รายงานเหตุการณ์</h1>
          <p className="text-(--yellow)">สถิติและรายงานเหตุการณ์ที่เกิดขึ้น</p>
        </div>
      </section>
      <section className="mt-5 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive={activeSubTab}
          setLabelValue={(value) => router.push(`/admin/statistics?incident&subtab=${value.toLowerCase()}`)}
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
          markerColor="#4CE99A"
          markerAltColor="#E94C4C"
          markerTextColor="#000000"
          markerShadowColor="rgba(76, 233, 154, 0.5)"
          markerItemColor="#4CE99A"
          markerItemOverflowColor="#E94C4C"
          useModernMarkers
          detailUrl="/admin/statistics/detail/incident"
          hideCount
          markerOverflowThreshold={99}
          badgeColorFn={(item) => (item.notiTotal ?? 0) === 0 ? '#979797' : '#FCD116'}
          badgeValueFn={(item) => item.notiTotal ?? 0}
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={incidentCards}
          routeItems={liveRouteItems}
          markerItems={markerItems}
          loading={routesLoading}
          error={routesError}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable
          data={comparisonData as unknown as ComparisonRecord[]}
          summaryBadges={comparisonBadges}
          columns={INCIDENT_COMPARISON_COLUMNS as unknown as ColumnsType<ComparisonRecord>}
          activePeriod={comparisonPeriod}
          onPeriodChange={setComparisonPeriod}
          loading={comparisonFetching}
          error={comparisonError}
          showSummaryBadgesOnError
        />
      )}
    </div>
  )
}

export default React.memo(IncidentSection)
