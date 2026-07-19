"use client"
import React, { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useTopPowerRoads } from '@/hooks/queries/lighting'
import { useNotificationsSummary } from '@/hooks/queries/manage'
import { useVMSSettingLatest } from '@/features/admin/control-vms/overall/hooks/useVMSSettingLatest'
import type { NotificationSourceType, NotificationSummaryItem } from '@/types/manage/notification-api'

dayjs.extend(buddhistEra)
dayjs.extend(customParseFormat)

// dept_id=0 is the "all departments" aggregate — confirmed against the live
// API (its top result matches this card's original mock road, ฉช.3001).
const TOP_POWER_ROADS_DEPT_ID = 0

// Matches TitleSection.tsx's PERIOD_OPTIONS values exactly — that's the
// component actually driving the `?period=` URL param this section reads.
// Both card APIs require start_date/end_date, so "ALL" needs real (very wide)
// bounds rather than omitted params.
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

// "line_check" (the only literal the API sends for source_type=lighting) → "Line Check".
const formatTypeName = (name: string) =>
  name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const BASE_CARDS = [
  {
    id: 1, src: '/images/statistics/Frame1.png', imageBg: true, value: '-',
    label: 'Incident Detection', glowColor: '#66AEFF',
    detail1: { img: '/images/statistics/Frame1.1.png', title: 'ประเภทเหตุการณ์ที่พบบ่อย', subtitle: '-', summary: '-' },
    detail2: { img: '/images/statistics/Frame1.2.png', title: 'หน่วยงานที่มีเหตุการณ์มากที่สุด', subtitle: '-', summary: '-' },
  },
  {
    id: 2, src: '/images/statistics/Frame2.png', imageBg: true, value: '-',
    label: 'Traffic Lighting', glowColor: '#66FFCA',
    detail1: { img: '/images/statistics/Frame2.1.png', title: 'สายทางที่ใช้ไฟมากที่สุด', subtitle: '-', summary: '-' },
    detail2: { img: '/images/statistics/Frame2.2.png', title: 'ประเภทการแจ้งเตือนมากที่สุด', subtitle: '-', summary: '-' },
  },
  {
    id: 3, src: '/images/statistics/Frame3.png', imageBg: true, value: '-',
    label: 'VMS', glowColor: '#BDFF66',
    detail1: { img: '/images/statistics/Frame3.1.png', title: 'หมวดหมู่ยอดนิยม', subtitle: '-', summary: '-' },
    detail2: { img: '/images/statistics/Frame3.2.png', title: 'ชุดคำสั่งล่าสุด', subtitle: '-', summary: '-' },
  },
]

const OverviewSection: React.FC = () => {
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || 'ALL'
  const { startDate, endDate } = useMemo(() => periodToRange(period), [period])
  const { data: topPowerRoads, isLoading: topPowerRoadsLoading } = useTopPowerRoads(TOP_POWER_ROADS_DEPT_ID, startDate, endDate, 1)
  const topRoad = topPowerRoads?.[0]

  const { data: notificationsSummary, isLoading: notificationsLoading } = useNotificationsSummary(startDate, endDate)
  const bySource = useMemo(() => {
    const map = {} as Record<NotificationSourceType, NotificationSummaryItem>
    for (const item of notificationsSummary ?? []) map[item.source_type] = item
    return map
  }, [notificationsSummary])

  const { data: vmsLatestRes, isLoading: vmsLatestLoading } = useVMSSettingLatest()
  const vmsLatest = vmsLatestRes?.data.res_data?.[0]

  const CARDS = useMemo(() => BASE_CARDS.map((card) => {
    if (card.id === 1) {
      // Incident Detection
      const s = bySource.analytic
      return {
        ...card,
        value: notificationsLoading ? '-' : (s?.count.toLocaleString() ?? '0'),
        detail1: {
          ...card.detail1,
          subtitle: notificationsLoading ? '-' : (s?.most_type?.name ?? '-'),
          summary: notificationsLoading || !s?.most_type
            ? '-'
            : `${s.most_count.toLocaleString()} เหตุการณ์ (${pct(s.most_count, s.count)}%)`,
        },
        detail2: {
          ...card.detail2,
          subtitle: notificationsLoading ? '-' : (s?.most_department?.department_short_name ?? '-'),
          summary: notificationsLoading || !s?.most_department
            ? '-'
            : `${s.most_department.count.toLocaleString()} เหตุการณ์ (${pct(s.most_department.count, s.count)}%)`,
        },
      }
    }
    if (card.id === 2) {
      // Traffic Lighting — detail1 already wired to top-power-roads above.
      const s = bySource.lighting
      return {
        ...card,
        value: notificationsLoading ? '-' : (s?.count.toLocaleString() ?? '0'),
        detail1: {
          ...card.detail1,
          subtitle: topPowerRoadsLoading ? '-' : (topRoad?.road.code_name ?? '-'),
          summary: topPowerRoadsLoading || !topRoad
            ? '-'
            : `${topRoad.install_points} จุดติดตั้ง (${topRoad.total_kw.toFixed(1)} kW)`,
        },
        detail2: {
          ...card.detail2,
          subtitle: notificationsLoading ? '-' : (s?.most_type ? formatTypeName(s.most_type.name) : '-'),
          summary: notificationsLoading || !s?.most_department
            ? '-'
            : `${s.most_department.department_short_name} ${s.most_department.count.toLocaleString()} เหตุการณ์ (${pct(s.most_department.count, s.count)}%)`,
        },
      }
    }
    // VMS
    const s = bySource.vms_setting
    return {
      ...card,
      value: notificationsLoading ? '-' : (s?.count.toLocaleString() ?? '0'),
      detail1: {
        ...card.detail1,
        subtitle: notificationsLoading ? '-' : (s?.most_type?.name ?? '-'),
        summary: notificationsLoading || !s?.most_type
          ? '-'
          : `${s.most_count.toLocaleString()} จุดติดตั้ง (${pct(s.most_count, s.count)}%)`,
      },
      detail2: {
        ...card.detail2,
        // No dedicated "latest command" endpoint exists — this is the most
        // recently connected VMS sign instead (see getVMSSettingLatestAPI).
        subtitle: vmsLatestLoading ? '-' : (vmsLatest?.solution_name ?? '-'),
        summary: vmsLatestLoading || !vmsLatest?.last_connected
          ? '-'
          // Backend sends last_connected pre-formatted as Buddhist-era
          // DD/MM/BBBB HH:mm:ss (e.g. "18/07/2569 15:21:54"), not ISO.
          : dayjs(vmsLatest.last_connected, 'DD/MM/BBBB HH:mm:ss').format('DD MMM BBBB HH:mm'),
      },
    }
  }), [topPowerRoadsLoading, topRoad, notificationsLoading, bySource, vmsLatestLoading, vmsLatest])

  return (
    <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
      {CARDS.map(card => (
        <div
          key={card.id}
          className="relative rounded-2xl overflow-hidden w-full h-auto min-h-115 sm:min-h-145 lg:min-h-175"
          style={{ backgroundColor: '#191919' }}
        >
          {card.imageBg && (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 translate-y-[30px] sm:translate-y-[45px] lg:translate-y-[60px] w-[180px] sm:w-[240px] lg:w-[310px] h-[180px] sm:h-[240px] lg:h-[310px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${card.glowColor}1A 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />
          )}
          {card.src && (
            <div className="mx-auto mt-[40px] sm:mt-[60px] lg:mt-[80px] flex flex-col items-center justify-center px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.src}
                alt={`overview-card-${card.id}`}
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] lg:w-[150px] lg:h-[150px]"
              />
              <p className="mt-3 sm:mt-4 text-center text-2xl sm:text-3xl lg:text-[40px] font-bold text-white">{card.value}</p>
              <p className="mt-1 sm:mt-2 text-center text-lg sm:text-2xl lg:text-[32px] font-bold" style={{ color: card.glowColor }}>{card.label}</p>
              <p className="mt-1 sm:mt-2 text-center text-xs sm:text-sm lg:text-base text-[#979797]">จำนวนการแจ้งเตือน</p>
              <div className="flex flex-col gap-2 sm:gap-[10px] mt-6 sm:mt-8 lg:mt-10 w-full">
                <div
                  className="flex items-center mx-auto rounded-2xl border-2 border-solid px-3 sm:px-5 w-full sm:w-[400px] md:w-[460px] lg:w-[500px] h-[95px] sm:h-[115px] md:h-[135px]"
                  style={{ borderColor: card.glowColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail1.img} alt="detail-1" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] md:w-[60px] md:h-[60px] shrink-0" />
                  <div className="ml-2 sm:ml-3 md:ml-4 self-start mt-2 sm:mt-[14px] md:mt-[18px] min-w-0">
                    <p className="text-xs sm:text-sm md:text-base font-bold truncate" style={{ color: card.glowColor }}>{card.detail1.title}</p>
                    <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-2xl font-bold text-white truncate">{card.detail1.subtitle}</p>
                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-[#979797] truncate">{card.detail1.summary}</p>
                  </div>
                </div>
                <div
                  className="flex items-center mx-auto rounded-2xl border-2 border-solid px-3 sm:px-5 w-full sm:w-[400px] md:w-[460px] lg:w-[500px] h-[95px] sm:h-[115px] md:h-[135px]"
                  style={{ borderColor: card.glowColor }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.detail2.img} alt="detail-2" className="w-[36px] h-[36px] sm:w-[48px] sm:h-[48px] md:w-[60px] md:h-[60px] shrink-0" />
                  <div className="ml-2 sm:ml-3 md:ml-4 self-start mt-2 sm:mt-[14px] md:mt-[18px] min-w-0">
                    <p className="text-xs sm:text-sm md:text-base font-bold truncate" style={{ color: card.glowColor }}>{card.detail2.title}</p>
                    <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg md:text-2xl font-bold text-white truncate">{card.detail2.subtitle}</p>
                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm text-[#979797] truncate">{card.detail2.summary}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default React.memo(OverviewSection)
