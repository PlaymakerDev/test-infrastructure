"use client"
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { useRouter, useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import SwapButton from '@/components/swap-button/SwapButton'
import { useNotificationsSummary } from '@/hooks/queries/manage'
import type { NotificationSummaryItem } from '@/types/manage/notification-api'
import { useStatisticsContext } from '../context'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard } from './shared'
import { useLiveStatusRouteItems, type LiveStatusSummary } from '../../data/useLiveStatusRouteItems'

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

// `/vms/settings/departments` only takes a single `?since=` lower-bound (no
// upper bound) — same PERIOD_OPTIONS as the button row above, mapped to that
// one param. 'ALL' has no real "since the beginning of time" value on the
// backend (it defaults to today when omitted), so pass a date far enough
// back to include everything in practice.
const periodToSince = (period: string): string | undefined => {
  const now = new Date()
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'TODAY':
      return fmt(today)
    case 'LAST_7_DAYS': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return fmt(start)
    }
    case 'THIS_MONTH':
      return fmt(new Date(now.getFullYear(), now.getMonth(), 1))
    case 'THIS_YEAR':
      return fmt(new Date(now.getFullYear(), 0, 1))
    case 'LAST_YEAR':
      return fmt(new Date(now.getFullYear() - 1, 0, 1))
    case 'ALL':
      return '2000-01-01'
    default:
      return undefined
  }
}

// Matches OverviewSection.tsx's own periodToRange/pct exactly — the "หมวดหมู่
// ยอดนิยม" card here mirrors that page's VMS card, which is also backed by
// GET /manage/notifications/summary (start_date/end_date, not `?since=`).
const ALL_TIME_START = '2000-01-01'
const DATE_FORMAT = 'YYYY-MM-DD'

const periodToRange = (period: string): { startDate: string; endDate: string } => {
  const now = dayjs()
  switch (period) {
    case 'TODAY':
      return { startDate: now.format(DATE_FORMAT), endDate: now.format(DATE_FORMAT) }
    case 'LAST_7_DAYS':
      return { startDate: now.subtract(6, 'day').format(DATE_FORMAT), endDate: now.format(DATE_FORMAT) }
    case 'THIS_MONTH':
      return { startDate: now.startOf('month').format(DATE_FORMAT), endDate: now.format(DATE_FORMAT) }
    case 'THIS_YEAR':
      return { startDate: now.startOf('year').format(DATE_FORMAT), endDate: now.format(DATE_FORMAT) }
    case 'LAST_YEAR': {
      const lastYear = now.subtract(1, 'year')
      return { startDate: lastYear.startOf('year').format(DATE_FORMAT), endDate: lastYear.endOf('year').format(DATE_FORMAT) }
    }
    case 'ALL':
    default:
      return { startDate: ALL_TIME_START, endDate: now.format(DATE_FORMAT) }
  }
}

const pct = (part: number, total: number) => (total > 0 ? ((part / total) * 100).toFixed(1) : '0.0')

const COMPARISON_MOCK_DATA: ComparisonRecord[] = [
  { key: '1', agency: 'สทช. 1 (กรุงเทพ)', installations: 5, online: 4, offline: 1, newCmdWeb: 3, newCmdApp: 2 },
  { key: '1-1', agency: 'สทช. 1 (กรุงเทพ)', installations: 3, online: 3, offline: 0, newCmdWeb: 2, newCmdApp: 1, isChild: true },
  { key: '1-2', agency: 'ขทช.สมุทรปราการ', installations: 2, online: 1, offline: 1, newCmdWeb: 1, newCmdApp: 1, isChild: true },
  { key: '2', agency: 'สทช. 2 (สระบุรี)', installations: 8, online: 7, offline: 1, newCmdWeb: 2, newCmdApp: 1 },
  { key: '2-1', agency: 'สทช. 2 (สระบุรี)', installations: 5, online: 5, offline: 0, newCmdWeb: 1, newCmdApp: 1, isChild: true },
  { key: '2-2', agency: 'ขทช.นครราชสีมา', installations: 3, online: 2, offline: 1, newCmdWeb: 1, newCmdApp: 0, isChild: true },
  { key: '3', agency: 'สทช. 10 (เชียงใหม่)', installations: 15, online: 12, offline: 3, newCmdWeb: 8, newCmdApp: 6 },
  { key: '3-1', agency: 'สทช. 10 (เชียงใหม่)', installations: 8, online: 7, offline: 1, newCmdWeb: 5, newCmdApp: 3, isChild: true },
  { key: '3-2', agency: 'ขทช.ลำปาง', installations: 4, online: 3, offline: 1, newCmdWeb: 2, newCmdApp: 2, isChild: true },
  { key: '3-3', agency: 'ขทช.เชียงราย', installations: 3, online: 2, offline: 1, newCmdWeb: 1, newCmdApp: 1, isChild: true },
]

// There's no "incident category" concept in the VMS data model (unlike
// Alert/Incident's real backend), so `เหตุการณ์`/`หน่วยงานที่มีเหตุการณ์` are
// backed by the closest real equivalent — `noti_count` (VMS notification
// logs). The 4th card mirrors OverviewSection.tsx's VMS "หมวดหมู่ยอดนิยม"
// detail exactly — same source (GET /manage/notifications/summary,
// source_type=vms_setting), same most_type/most_count/count fields.
const buildStatusCards = (
  summary: LiveStatusSummary,
  vmsNotificationSummary: NotificationSummaryItem | undefined,
  vmsNotificationLoading: boolean,
): StatCard[] => [
  {
    borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF',
    value: String(summary.totalInstallPoints), unit: 'จุดติดตั้ง',
    sub: summary.topBureauByInstall ? `${summary.topBureauByInstall.name} (${summary.topBureauByInstall.percentage.toFixed(1)}%)` : '-',
  },
  {
    borderColor: '#666BFF', icon: '/images/statistics/c2.png', label: 'เหตุการณ์ทั้งหมด', labelColor: '#666BFF',
    value: String(summary.totalNotiCount), unit: 'เหตุการณ์',
    sub: summary.topBureauByNoti ? `${summary.topBureauByNoti.name} (${summary.topBureauByNoti.percentage.toFixed(1)}%)` : '-',
  },
  {
    borderColor: '#C300FF', icon: '/images/statistics/c3.png', label: 'หน่วยงานที่มีเหตุการณ์', labelColor: '#C300FF',
    value: String(summary.departmentsWithNoti), unit: 'หน่วยงาน',
    sub: summary.topSubDepartmentByNoti ? `${summary.topSubDepartmentByNoti.name} (${summary.topSubDepartmentByNoti.count} เหตุการณ์)` : '-',
  },
  {
    borderColor: '#FC1691', icon: '/images/statistics/c4.png', label: 'หมวดหมู่ยอดนิยม', labelColor: '#FC1691',
    value: vmsNotificationLoading ? '-' : (vmsNotificationSummary?.most_type?.name ?? '-'),
    sub: vmsNotificationLoading || !vmsNotificationSummary?.most_type
      ? '-'
      : `${vmsNotificationSummary.most_count.toLocaleString()} จุดติดตั้ง (${pct(vmsNotificationSummary.most_count, vmsNotificationSummary.count)}%)`,
  },
]

const StatusSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentTab } = useStatisticsContext()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')
  const { routeItems, markerItems, summary } = useLiveStatusRouteItems(periodToSince(activePeriod))

  const { startDate, endDate } = useMemo(() => periodToRange(activePeriod), [activePeriod])
  const { data: notificationsSummary, isLoading: notificationsLoading } = useNotificationsSummary(startDate, endDate)
  const vmsNotificationSummary = useMemo(
    () => notificationsSummary?.find((item) => item.source_type === 'vms_setting'),
    [notificationsSummary],
  )

  const statusCards = useMemo(
    () => buildStatusCards(summary, vmsNotificationSummary, notificationsLoading),
    [summary, vmsNotificationSummary, notificationsLoading],
  )

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="px-3 sm:px-10">
        <section className="flex items-start gap-3">
          <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
          <div>
            <h1 className="text-(--yellow)">สถานะและการปรับเปลี่ยนข้อความ</h1>
            <p className="text-(--yellow)">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
          </div>
        </section>
        <section className="mt-5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SwapButton
            options={SUB_TAB_OPTIONS}
            defaultActive={activeSubTab}
            setLabelValue={(value) => router.push(`/admin/statistics?status&subtab=${value.toLowerCase()}`)}
            size={isMobile ? 'middle' : 'large'}
          />
        </section>
        {activeSubTab === 'OVERVIEW' && (
          <section className="mt-4">
            <div className='flex flex-wrap gap-1 rounded-xl border border-(--yellow) p-1 w-fit'>
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = activePeriod === opt.value
                return (
                  <button
                    key={opt.value}
                    type='button'
                    onClick={() => setActivePeriod(opt.value)}
                    className='px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-medium cursor-pointer transition-colors whitespace-nowrap'
                    style={isActive
                      ? { background: 'var(--yellow)', color: '#212121' }
                      : { background: 'transparent', color: 'var(--yellow)' }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>
      {activeSubTab === 'OVERVIEW' && (
        <StatisticsMapPanel
          markerColorFn={() => '#B2FF00'}
          markerLabelFn={(_item, index) => index + 1}
          badgeColorFn={() => '#FCD116'}
          useModernMarkers
          routeItems={routeItems}
          markerItems={markerItems}
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={statusCards}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable data={COMPARISON_MOCK_DATA} />
      )}
    </div>
  )
}

export default React.memo(StatusSection)
