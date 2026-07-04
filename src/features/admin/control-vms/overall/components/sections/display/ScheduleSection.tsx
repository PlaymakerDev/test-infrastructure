import React, { useMemo } from 'react'
import { Button, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import ScheduleList from '@/components/list/ScheduleList'
import { APIResponseVMSScheduleByDate } from '@/types/control-vms/display-api'
import { useControlVMSContext } from '../../../context'

interface Props {
  data?: APIResponseVMSScheduleByDate
}

const ScheduleSection: React.FC<Props> = (props) => {
  const { data } = props
  const { setUpdateScheduleState, scheduleDay } = useControlVMSContext()

  const totalLocations = useMemo(
    () => new Set(Object.values(data ?? {}).flat().map(d => d.solution_name)).size,
    [data]
  )
  const totalSchedules = Object.values(data ?? {}).flat().length

  // FILTER TO THE SELECTED CALENDAR DAY (e.g. "05") ACROSS ALL DATE KEYS THIS MONTH
  const filteredSchedules = useMemo(() => {
    const entries = Object.entries(data ?? {})
    const matched = scheduleDay
      ? entries.filter(([dateKey]) => dayjs(dateKey).format('DD') === scheduleDay)
      : entries
    return matched.flatMap(([, items]) => items)
  }, [data, scheduleDay])

  const renderSchdeuleList = useMemo(() => {
    if (!filteredSchedules.length) return <Empty description="ไม่พบข้อมูล" />
    return (
      <ScheduleList
        data={filteredSchedules}
        cols={{
          default: 1,
          sm: 1,
          md: 2,
          lg: 3,
          xl: 4,
          xxl: 1
        }}
        onUpdateClick={{
          onEdit: (item) => setUpdateScheduleState({ open: true, id: item.setting_id, type: 'EDIT', vmsOption: item }),
          onDelete: (item) => setUpdateScheduleState({ open: true, id: item.setting_id, type: 'DELETE', vmsOption: item })
        }}
      />
    )
  }, [filteredSchedules, setUpdateScheduleState])

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
          <Button
            type='primary'
            size='middle'
            shape='round'
            icon={<PlusOutlined />}
            onClick={() => setUpdateScheduleState({ open: true, id: null, type: 'CREATE' })}
          >
            <p className='fs-12'>เพิ่มคำสั่ง</p>
          </Button>
        </div>
      </section>
      <section className='mt-5'>
        {renderSchdeuleList}
      </section>
    </div>
  )
}

export default React.memo(ScheduleSection)
