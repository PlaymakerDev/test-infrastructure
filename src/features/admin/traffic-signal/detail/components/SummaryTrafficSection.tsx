"use client"
import React, { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  FormSearchSummaryTraffic,
  Perf7DayChartsSummaryTraffic,
  DailyVolumeCardsSummaryTraffic,
  TableSummaryTraffic,
} from '../components'

interface Props { }

const SummaryTrafficSection: React.FC<Props> = () => {
  // Tab 2 uses a fixed 7-day window so the cards / charts / table all stay
  // aligned by construction. The user picks ONE anchor date (treated as the
  // end of the window); start = anchor − 6 days (inclusive).
  const [anchor, setAnchor] = useState<Dayjs>(() => dayjs())
  const endDate = anchor.format('YYYY-MM-DD')
  const startDate = anchor.subtract(6, 'day').format('YYYY-MM-DD')

  return (
    <div className='flex flex-col gap-6'>
      <section>
        <FormSearchSummaryTraffic value={anchor} onChange={setAnchor} />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>
          เปรียบเทียบประสิทธิภาพการทำงานของระบบย้อนหลัง 7 วัน
        </h3>
        <Perf7DayChartsSummaryTraffic endDate={endDate} />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>เปรียบเทียบปริมาณจราจรย้อนหลัง 7 วัน</h3>
        <DailyVolumeCardsSummaryTraffic endDate={endDate} />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>ตารางข้อมูลแยกจราจรย้อนหลัง 7 วัน</h3>
        <TableSummaryTraffic startDate={startDate} endDate={endDate} />
      </section>
    </div>
  )
}

export default React.memo<Props>(SummaryTrafficSection)
