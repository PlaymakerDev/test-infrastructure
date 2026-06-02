"use client"
import React, { useState, useCallback, useEffect } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Segmented } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import { useStatisticsContext } from '../context'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard, SummaryBadge } from './shared'
import type { ColumnsType } from 'antd/es/table'

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

const num = (v: number) => <span style={{ color: '#ffffff' }}>{v}</span>

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

const COMPARISON_MOCK_DATA: IncidentRow[] = [
  { key: '1', agency: 'สทช. 1 (ปทุมธานี)', accident: 12, breakdown: 8, shoulder: 15, construction: 5, blocked: 3, wrongWay: 2, rightLane: 4, speeding: 20, congestion: 10, total: 79 },
  { key: '1-1', agency: 'สทช. 1 (ปทุมธานี)', accident: 12, breakdown: 8, shoulder: 15, construction: 5, blocked: 3, wrongWay: 2, rightLane: 4, speeding: 20, congestion: 10, total: 79, isChild: true },
  { key: '1-2', agency: 'ขทช.ปทุมธานี', accident: 7, breakdown: 5, shoulder: 9, construction: 3, blocked: 2, wrongWay: 1, rightLane: 2, speeding: 12, congestion: 6, total: 47, isChild: true },
  { key: '1-3', agency: 'ขทช.นนทบุรี', accident: 5, breakdown: 3, shoulder: 6, construction: 2, blocked: 1, wrongWay: 1, rightLane: 2, speeding: 8, congestion: 4, total: 32, isChild: true },
  { key: '2', agency: 'สทช. 2 (สระบุรี)', accident: 9, breakdown: 6, shoulder: 11, construction: 8, blocked: 2, wrongWay: 1, rightLane: 3, speeding: 15, congestion: 7, total: 62 },
  { key: '2-1', agency: 'สทช. 2 (สระบุรี)', accident: 9, breakdown: 6, shoulder: 11, construction: 8, blocked: 2, wrongWay: 1, rightLane: 3, speeding: 15, congestion: 7, total: 62, isChild: true },
  { key: '2-2', agency: 'ขทช.สระบุรี', accident: 5, breakdown: 3, shoulder: 6, construction: 4, blocked: 1, wrongWay: 1, rightLane: 2, speeding: 9, congestion: 4, total: 35, isChild: true },
  { key: '2-3', agency: 'ขทช.นครราชสีมา', accident: 4, breakdown: 3, shoulder: 5, construction: 4, blocked: 1, wrongWay: 0, rightLane: 1, speeding: 6, congestion: 3, total: 27, isChild: true },
  { key: '3', agency: 'สทช. 9 (พิษณุโลก)', accident: 11, breakdown: 8, shoulder: 13, construction: 5, blocked: 4, wrongWay: 2, rightLane: 4, speeding: 19, congestion: 9, total: 75 },
  { key: '3-1', agency: 'สทช. 9 (พิษณุโลก)', accident: 11, breakdown: 8, shoulder: 13, construction: 5, blocked: 4, wrongWay: 2, rightLane: 4, speeding: 19, congestion: 9, total: 75, isChild: true },
  { key: '3-2', agency: 'ขทช.พิษณุโลก', accident: 6, breakdown: 5, shoulder: 7, construction: 3, blocked: 2, wrongWay: 1, rightLane: 2, speeding: 11, congestion: 5, total: 42, isChild: true },
  { key: '3-3', agency: 'ขทช.เพชรบูรณ์', accident: 5, breakdown: 3, shoulder: 6, construction: 2, blocked: 2, wrongWay: 1, rightLane: 2, speeding: 8, congestion: 4, total: 33, isChild: true },
  { key: '4', agency: 'สทช. 10 (เชียงใหม่)', accident: 20, breakdown: 13, shoulder: 25, construction: 11, blocked: 6, wrongWay: 4, rightLane: 8, speeding: 35, congestion: 16, total: 138 },
  { key: '4-1', agency: 'สทช. 10 (เชียงใหม่)', accident: 20, breakdown: 13, shoulder: 25, construction: 11, blocked: 6, wrongWay: 4, rightLane: 8, speeding: 35, congestion: 16, total: 138, isChild: true },
  { key: '4-2', agency: 'ขทช.เชียงใหม่', accident: 9, breakdown: 6, shoulder: 11, construction: 5, blocked: 3, wrongWay: 2, rightLane: 3, speeding: 16, congestion: 7, total: 62, isChild: true },
  { key: '4-3', agency: 'ขทช.ลำปาง', accident: 7, breakdown: 4, shoulder: 9, construction: 4, blocked: 2, wrongWay: 1, rightLane: 3, speeding: 12, congestion: 6, total: 48, isChild: true },
  { key: '4-4', agency: 'ขทช.เชียงราย', accident: 4, breakdown: 3, shoulder: 5, construction: 2, blocked: 1, wrongWay: 1, rightLane: 2, speeding: 7, congestion: 3, total: 28, isChild: true },
]

const INCIDENT_SUMMARY_BADGES: SummaryBadge[] = [
  { label: '45 หน่วยงาน', color: '#B2FF00' },
  { label: '750 จุดติดตั้ง', color: '#66AEFF' },
  { label: '30,284 เหตุการณ์', color: '#05F2DB' },
]

const INCIDENT_CARDS: StatCard[] = [
  { borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF', value: '599', unit: 'จุดติดตั้ง', sub: 'ภาคกลาง (75.6%)' },
  { borderColor: '#05F2DB', icon: '/images/statistics/cs2.png', label: 'เหตุการณ์ทั้งหมด', labelColor: '#05F2DB', value: '67', unit: 'เหตุการณ์', sub: 'สทช. 6 (ขอนแก่น) (37.2%)' },
  { borderColor: '#B2FF00', icon: '/images/statistics/cs3.png', label: 'หน่วยงานที่มีเหตุการณ์', labelColor: '#B2FF00', value: '45', unit: 'หน่วยงาน', sub: 'แขวงทางหลวงชนบทขอนแก่น (1,081 เหตุการณ์)' },
  { borderColor: '#FCD116', icon: '/images/statistics/cs4.png', label: 'ประเภทเหตุการณ์ที่พบบ่อย', labelColor: '#FCD116', value: 'รถจอดไหล่ทาง', sub: '3,580 เหตุการณ์ (59.6%)' },
]

const IncidentSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentTab } = useStatisticsContext()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)', paddingBottom: 40 }}>
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
          detailUrl="/admin/statistics/detail/incident"
          hideCount
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={INCIDENT_CARDS}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable data={COMPARISON_MOCK_DATA as unknown as import('./shared').ComparisonRecord[]} summaryBadges={INCIDENT_SUMMARY_BADGES} columns={INCIDENT_COMPARISON_COLUMNS as unknown as ColumnsType<import('./shared').ComparisonRecord>} />
      )}
    </div>
  )
}

export default React.memo(IncidentSection)
