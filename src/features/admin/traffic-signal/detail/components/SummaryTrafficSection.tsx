"use client"
import React from 'react'
import {
  FormSearchSummaryTraffic,
  Perf7DayChartsSummaryTraffic,
  DailyVolumeCardsSummaryTraffic,
  TableSummaryTraffic,
} from '../components'

interface Props { }

const SummaryTrafficSection: React.FC<Props> = () => {
  return (
    <div className='flex flex-col gap-6'>
      <section>
        <FormSearchSummaryTraffic />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>
          เปรียบเทียบประสิทธิภาพการทำงานของระบบย้อนหลัง 7 วัน
        </h3>
        <Perf7DayChartsSummaryTraffic />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>เปรียบเทียบปริมาณจราจรย้อนหลัง 7 วัน</h3>
        <DailyVolumeCardsSummaryTraffic />
      </section>

      <section>
        <h3 className='text-(--yellow) mb-4'>ตารางข้อมูลแยกจราจรย้อนหลัง 7 วัน</h3>
        <TableSummaryTraffic />
      </section>
    </div>
  )
}

export default React.memo<Props>(SummaryTrafficSection)
