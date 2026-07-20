"use client"
import React, { useState, useCallback, useMemo } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { useRouter, useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import SwapButton from '@/components/swap-button/SwapButton'
import { useNotificationsSummary } from '@/hooks/queries/manage'
import type { NotificationSummaryItem } from '@/types/manage/notification-api'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard, SummaryBadge } from './shared'
import { useLiveStatusRouteItems, type LiveStatusSummary } from '../../data/useLiveStatusRouteItems'
import useIsMobile from '@/utils/hooks/useIsMobile'
import type { ColumnsType } from 'antd/es/table'

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'OVERVIEW' },
  { label: 'ตารางเปรียบเทียบสถานะ', value: 'COMPARISON' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ตั้งแต่ปีที่ผ่านมา', value: 'LAST_YEAR' },
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
      return { startDate: lastYear.startOf('year').format(DATE_FORMAT), endDate: now.format(DATE_FORMAT) }
    }
    case 'ALL':
    default:
      return { startDate: ALL_TIME_START, endDate: now.format(DATE_FORMAT) }
  }
}

const pct = (part: number, total: number) => (total > 0 ? ((part / total) * 100).toFixed(1) : '0.0')

const STATUS_COMPARISON_COLUMNS: ColumnsType<ComparisonRecord> = [
  {
    title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 300,
    render: (value: string, record: ComparisonRecord) => (
      <span style={{ color: record.isChild ? '#FFFFFF' : '#FCD116', fontWeight: record.isChild ? 400 : 600, paddingLeft: 12 }}>
        {value}
      </span>
    ),
  },
  { title: 'จุดติดตั้ง', dataIndex: 'installations', key: 'installations', align: 'center', width: 140 },
  { title: 'ออนไลน์', dataIndex: 'online', key: 'online', align: 'center', width: 120 },
  { title: 'ออฟไลน์', dataIndex: 'offline', key: 'offline', align: 'center', width: 120 },
]

// There's no "incident category" concept in the VMS data model (unlike
// Alert/Incident's real backend), so these cards use the truthful VMS
// notification-log terminology backed by `noti_count`. The 4th card mirrors
// OverviewSection.tsx's VMS "หมวดหมู่ยอดนิยม"
// detail exactly — same source (GET /manage/notifications/summary,
// source_type=vms_setting), same most_type/most_count/count fields.
const buildStatusCards = (
  summary: LiveStatusSummary,
  vmsNotificationSummary: NotificationSummaryItem | undefined,
  vmsNotificationLoading: boolean,
  routeDataUnavailable: boolean,
): StatCard[] => [
    {
      borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF',
      value: routeDataUnavailable ? '-' : String(summary.totalInstallPoints), unit: 'จุดติดตั้ง',
      sub: !routeDataUnavailable && summary.topBureauByInstall ? `${summary.topBureauByInstall.name} (${summary.topBureauByInstall.percentage.toFixed(1)}%)` : '-',
    },
    {
      borderColor: '#666BFF', icon: '/images/statistics/c2.png', label: 'การแจ้งเตือนทั้งหมด', labelColor: '#666BFF',
      value: routeDataUnavailable ? '-' : String(summary.totalNotiCount), unit: 'การแจ้งเตือน',
      sub: !routeDataUnavailable && summary.topBureauByNoti ? `${summary.topBureauByNoti.name} (${summary.topBureauByNoti.percentage.toFixed(1)}%)` : '-',
    },
    {
      borderColor: '#C300FF', icon: '/images/statistics/c3.png', label: 'หน่วยงานที่มีการแจ้งเตือน', labelColor: '#C300FF',
      value: routeDataUnavailable ? '-' : String(summary.departmentsWithNoti), unit: 'หน่วยงาน',
      sub: !routeDataUnavailable && summary.topSubDepartmentByNoti ? `${summary.topSubDepartmentByNoti.name} (${summary.topSubDepartmentByNoti.count} การแจ้งเตือน)` : '-',
    },
    {
      borderColor: '#FC1691', icon: '/images/statistics/c4.png', label: 'หมวดหมู่ยอดนิยม', labelColor: '#FC1691',
      value: vmsNotificationLoading ? '-' : (vmsNotificationSummary?.most_type?.name ?? '-'),
      sub: vmsNotificationLoading || !vmsNotificationSummary?.most_type
        ? '-'
        : `${vmsNotificationSummary.most_count.toLocaleString()} การแจ้งเตือน (${pct(vmsNotificationSummary.most_count, vmsNotificationSummary.count)}%)`,
    },
  ]

const StatusSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')
  const {
    routeItems,
    markerItems,
    summary,
    isLoading: routesLoading,
    isFetching: routesFetching,
    isError: routesError,
  } = useLiveStatusRouteItems(activeSubTab === 'OVERVIEW' ? periodToSince(activePeriod) : undefined)

  const { startDate, endDate } = useMemo(() => periodToRange(activePeriod), [activePeriod])
  const { data: notificationsSummary, isLoading: notificationsLoading } = useNotificationsSummary(startDate, endDate)
  const vmsNotificationSummary = useMemo(
    () => notificationsSummary?.find((item) => item.source_type === 'vms_setting'),
    [notificationsSummary],
  )

  const statusCards = useMemo(
    () => buildStatusCards(summary, vmsNotificationSummary, notificationsLoading, routesLoading || routesError),
    [summary, vmsNotificationSummary, notificationsLoading, routesLoading, routesError],
  )

  const comparisonData = useMemo<ComparisonRecord[]>(() => routeItems.map((item) => {
    const children = item.sub3.map((department, index) => {
      const online = department.detail.reduce((total, detail) => {
        const connected = typeof detail === 'string'
          ? department.connected
          : (detail.is_online ?? detail.connected ?? department.connected)
        return total + (connected ? 1 : 0)
      }, 0)
      const installations = department.detail.length
      return {
        key: `${item.id ?? item.name}-${index}-${department.label}`,
        agency: department.label,
        installations,
        online,
        offline: installations - online,
        isChild: true,
      }
    })
    const installations = children.reduce((total, row) => total + row.installations, 0)
    const online = children.reduce((total, row) => total + row.online, 0)
    return {
      key: String(item.id ?? item.name),
      agency: item.name,
      installations,
      online,
      offline: installations - online,
      children: children.length > 0 ? children : undefined,
    }
  }), [routeItems])

  const comparisonBadges = useMemo<SummaryBadge[]>(() => [
    { label: `${routeItems.reduce((total, item) => total + item.sub3.length, 0).toLocaleString()} หน่วยงาน`, color: '#B2FF00' },
    { label: `${summary.totalInstallPoints.toLocaleString()} จุดติดตั้ง`, color: '#66AEFF' },
    { label: `${(summary.totalInstallPoints - summary.onlineCount).toLocaleString()} ออฟไลน์`, color: '#E94C4C' },
  ], [routeItems, summary])

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
          loading={routesLoading}
          error={routesError}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable
          data={comparisonData}
          summaryBadges={routesLoading || routesError ? [] : comparisonBadges}
          columns={STATUS_COMPARISON_COLUMNS}
          useArrowExpand
          showPeriodSelector={false}
          loading={routesFetching}
          error={routesError}
        />
      )}
    </div>
  )
}

export default React.memo(StatusSection)
