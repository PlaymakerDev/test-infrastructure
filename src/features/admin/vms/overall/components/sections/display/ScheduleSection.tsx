import React, { useMemo } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ScheduleList from '@/components/list/ScheduleList'
import MOCK_DATA from '@/mock/display-schedule.json'

const ScheduleSection: React.FC = () => {
  const totalLocations = useMemo(
    () => new Set(MOCK_DATA.map((i) => i.installation_point)).size,
    []
  )
  const totalSchedules = MOCK_DATA.length

  return (
    <div>
      <section className='flex flex-wrap items-center justify-between gap-2'>
        <h4 className='text-(--yellow) mb-0'>ตารางเวลาเดือนนี้</h4>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-emerald-500 text-emerald-500'>
            {totalLocations} จุดติดตั้ง
          </span>
          <span className='inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-yellow-500 text-yellow-500'>
            {totalSchedules} คำสั่ง
          </span>
          <Button type='primary' size='middle' shape='round' icon={<PlusOutlined />}>
            <p className='fs-12'>เพิ่มคำสั่ง</p>
          </Button>
        </div>
      </section>
      <section className='mt-5'>
        <ScheduleList
          data={MOCK_DATA}
          cols={{
            default: 1,
            sm: 1,
            md: 2,
            lg: 3,
            xl: 4,
            xxl: 1
          }}
        />
      </section>
    </div>
  )
}

export default React.memo(ScheduleSection)
