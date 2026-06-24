"use client"
import React, { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import FilterBarAnalytic from '../analyticvolume/FilterBarAnalytic'
import StackedHourlyBarChart from './StackedHourlyBarChart'
import PeakHourCards from './PeakHourCards'
import HourlyDataTable from './HourlyDataTable'

interface Props {}

/** Tab content for "สถิติรายชั่วโมงแยกตามประเภท". Layout per design:
 *  • TOP    — date picker + camera selector + export (shared toolbar).
 *  • CHART  — stacked hourly bar chart by vehicle type.
 *  • PEAKS  — 5 peak-hour cards.
 *  • TABLE  — hourly counts table by vehicle type. */
const StatHourVolume: React.FC<Props> = () => {
  // Date filter — hoisted so the chart, the peak cards, and the table all
  // share the same selected date.
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const dateStr = date ? date.format('YYYY-MM-DD') : undefined

  return (
    <div className='flex flex-col gap-6'>
      <FilterBarAnalytic
        defaultDate={date ?? undefined}
        onDateChange={setDate}
      />
      <StackedHourlyBarChart date={dateStr} />
      <PeakHourCards date={dateStr} />
      <HourlyDataTable date={dateStr} />
    </div>
  )
}

export default React.memo<Props>(StatHourVolume)
