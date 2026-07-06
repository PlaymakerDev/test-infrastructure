import React, { useMemo } from 'react'
import { Button, Empty } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import ScheduleList from '@/components/list/ScheduleList'
import { APIResponseVMSScheduleByDate } from '@/types/control-vms/display-api'
import { useControlVMSContext } from '../../../context'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  data?: APIResponseVMSScheduleByDate
}

const ScheduleSection: React.FC<Props> = (props) => {
  const { data } = props
  const { setUpdateScheduleState, scheduleDay } = useControlVMSContext()

  // FILTER TO THE SELECTED CALENDAR DAY (e.g. "05") ACROSS ALL DATE KEYS THIS MONTH
  const filteredSchedules = useMemo(() => {
    const entries = Object.entries(data ?? {})
    const matched = scheduleDay
      ? entries.filter(([dateKey]) => dayjs(dateKey).format('DD') === scheduleDay)
      : entries
    return matched.flatMap(([, items]) => items)
  }, [data, scheduleDay])

  // COUNTS DERIVE FROM THE FILTERED (VISIBLE) LIST, NOT THE WHOLE MONTH — KEEPS THE BADGE IN SYNC WITH THE LIST BELOW IT
  const totalLocations = useMemo(
    () => new Set(filteredSchedules.map(d => d.solution_name)).size,
    [filteredSchedules]
  )
  const totalSchedules = filteredSchedules.length

  const headerTitle = filteredSchedules[0]?.date
    ? `ตารางเวลาวันที่ ${dayjs(filteredSchedules[0].date).format('DD MMM BBBB')}`
    : 'ตารางเวลาเดือนนี้'

  const renderScheduleList = useMemo(() => {
    if (!filteredSchedules.length) {
      return <Empty description={scheduleDay ? 'ไม่มีคำสั่งในวันที่เลือก' : 'ไม่พบข้อมูล'} />
    }
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
  }, [filteredSchedules, scheduleDay, setUpdateScheduleState])

  return (
    <div>
      <section className='flex flex-wrap items-center justify-between gap-2'>
        <h4 className='text-(--yellow) mb-0'>{headerTitle}</h4>
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
        {renderScheduleList}
      </section>
    </div>
  )
}

export default React.memo(ScheduleSection)
