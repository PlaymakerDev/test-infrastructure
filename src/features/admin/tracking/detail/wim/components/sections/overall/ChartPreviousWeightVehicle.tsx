"use client"
import React, { useMemo, useState } from 'react'
import LineChart from '@/components/chart/LineChart'
import { TbCalendarMonth } from 'react-icons/tb'
import { useLast7Days } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import QueryBoundary from '@/components/common/QueryBoundary'
import { thaiDateBE, THAI_MONTHS } from '@/utils/thaiDate'
import { thaiDayName, thaiDayShort } from '@/utils/formatDate'
import dayjs from 'dayjs';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {

}

type Period = 'วันนี้' | 'เดือน' | 'ปี'
type DateType = 'day' | 'month' | 'year'

const PERIOD_DATE_TYPE: Record<Period, DateType> = {
  'วันนี้': 'day',
  'เดือน': 'month',
  'ปี': 'year',
}

// index = dayjs().day() (0=Sunday..6=Saturday) — used to derive the actual
// calendar date + English weekday name for each Thai short label the day-view
// API response returns. Kept independent of dayjs' locale (set to 'th' above
// for BBBB/MMM formatting elsewhere in this file) so this lookup stays
// correct even if the active locale ever changes.
const EN_DAY_BY_INDEX = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const LINES = [
  { dataKey: 'current', color: '#66AEFF', label: 'รถเข้าชั่งทั้งหมด' },
  { dataKey: 'previous', color: '#E94C4C', label: 'รถเข้าชั่งทั้งหมด' },
]

const ChartPreviousWeightVehicle: React.FC<Props> = () => {
  const { id: stationId } = useWIMContext()
  const [period, setPeriod] = useState<Period>('วันนี้')
  const dateType = PERIOD_DATE_TYPE[period]

  // Endpoint is enabled for WIM stations only — mirrors the pre-existing
  // behavior for this component (not yet confirmed for STATION by backend).
  // const enabled = stationType === 'WIM'

  const currentReferenceDate = dayjs().format('YYYY-MM-DD')
  // "previous" window is the same length, ending exactly one window before the current one.
  const previousReferenceDate = dayjs().subtract(7, dateType).format('YYYY-MM-DD')

  const {
    data: current,
    isLoading: isCurrentLoading,
    isError: isCurrentError,
  } = useLast7Days({
    station_id: stationId as string,
    date_type: dateType,
    reference_date: currentReferenceDate,
  })

  const {
    data: previous,
    isLoading: isPreviousLoading,
    isError: isPreviousError,
  } = useLast7Days({
    station_id: stationId as string,
    date_type: dateType,
    reference_date: previousReferenceDate,
  })

  const isLoading = isCurrentLoading || isPreviousLoading
  const isError = isCurrentError || isPreviousError

  const chartData = useMemo(() => {
    const columns = current?.data.column ?? []
    const previousColumns = previous?.data.column ?? []

    // "day" columns are a Thai weekday name that recurs every week, so the
    // current/previous windows share the same 7 labels — pair by matching
    // label. "month"/"year" columns are actual unique date/month strings from
    // two non-overlapping windows (e.g. this month's 30 days vs. the 30 days
    // from 7 months ago) — there's no shared label to match, so pair by
    // position instead (point i of the current window vs. point i of the
    // previous one).
    const rows = columns.map((label, index) => {
      const previousValue = dateType === 'day'
        ? (() => {
          const previousIndex = previousColumns.indexOf(label)
          return previousIndex >= 0 ? previous?.data.total[previousIndex] ?? 0 : 0
        })()
        : previous?.data.total[index] ?? 0

      return {
        label,
        current: current?.data.total[index] ?? 0,
        previous: previousValue,
      }
    })

    // Give every point a tooltip `dateText` matching what it actually
    // represents, so hovering shows date/month/year context instead of just
    // repeating the bare x-axis label.
    if (dateType === 'month') {
      // `label` is already an ISO date ("YYYY-MM-DD") — reformat the x-axis
      // to Thai BE (e.g. "23 มิ.ย. 2569") instead of the raw ISO string.
      return rows.map((row) => {
        const d = dayjs(row.label, 'YYYY-MM-DD')
        return {
          ...row,
          label: d.isValid() ? d.format('DD MMM BBBB') : row.label,
          dateText: d.isValid()
            ? `${thaiDateBE(row.label)} (${thaiDayName(EN_DAY_BY_INDEX[d.day()])})`
            : row.label,
        }
      })
    }

    if (dateType === 'year') {
      // `label` is "YYYY-MM" — reformat the x-axis to Thai month + BE year
      // (e.g. "ส.ค. 2568") instead of the raw "YYYY-MM" string.
      return rows.map((row) => {
        const d = dayjs(row.label, 'YYYY-MM')
        return {
          ...row,
          label: d.isValid() ? d.format('MMM BBBB') : row.label,
          dateText: d.isValid() ? `${THAI_MONTHS[d.month()]} ${d.year() + 543}` : row.label,
        }
      })
    }

    // dateType === 'day' — attach the real calendar date (e.g.
    // "21 เม.ย. 2569 (พฤหัสบดี)") and always order Monday(จ.) → Sunday(อา.),
    // regardless of the order `column` comes back in — the API only returns
    // a Thai weekday name per point, not a date.
    const today = dayjs(currentReferenceDate)
    const slotByLabel = new Map<string, { date: dayjs.Dayjs; order: number }>()
    for (let i = 0; i < 7; i++) {
      const date = today.subtract(i, 'day')
      const enDay = EN_DAY_BY_INDEX[date.day()]
      // Monday(1)→0 ... Sunday(0)→6 so a plain ascending sort reads Mon..Sun.
      const order = (date.day() + 6) % 7
      // The API returns the FULL Thai weekday name (e.g. "จันทร์"), not the
      // short form — but key both, since a mismatch here silently no-ops the
      // sort (every row falls back to order 0 and keeps the API's original,
      // non-Monday-first order).
      slotByLabel.set(thaiDayName(enDay), { date, order })
      slotByLabel.set(thaiDayShort(enDay), { date, order })
    }

    return rows
      .map((row) => {
        const slot = slotByLabel.get(row.label)
        return {
          ...row,
          dateText: slot
            ? `${thaiDateBE(slot.date.toDate())} (${thaiDayName(EN_DAY_BY_INDEX[slot.date.day()])})`
            : row.label,
          _order: slot?.order ?? 0,
        }
      })
      .sort((a, b) => a._order - b._order)
  }, [current?.data, previous?.data, dateType, currentReferenceDate])

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} skeletonRows={10}>
      <LineChart
        title='เปรียบเทียบรถเข้าชั่งน้ำหนัก'
        subtitle='แนวโน้มย้อนหลัง 7 วัน'
        subtitleSize={16}
        subtitleColor='var(--yellow)'
        icon={<TbCalendarMonth className='fs-22' />}
        iconCircle={false}
        // accentColor='#FCD116'
        // cardBackground='#00000080'
        cardBorderColor='transparent'
        showGlow={false}
        data={chartData}
        lines={LINES}
        periods={['วันนี้', 'เดือน', 'ปี']}
        activePeriod={period}
        onPeriodChange={(p) => setPeriod(p as Period)}
        tooltipDateKey='dateText'
        tooltipSimpleHeader
        fillHeight
      />
    </QueryBoundary>
  )
}

export default React.memo(ChartPreviousWeightVehicle)
