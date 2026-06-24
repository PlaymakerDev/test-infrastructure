import React, { useMemo } from 'react'
import DisplayTableData from './DisplayTableData'
import routeScheduleData from '@/mock/route-schedule.json'
import { APIResponseVMSSettingByRoad } from '@/types/control-vms/display-api'
import { Empty } from 'antd'

interface Props {
  data?: APIResponseVMSSettingByRoad
}

export interface VMSScheduleRecord {
  key: string
  location: string
  category: string
  contentType: string
  startDate: string
  endDate: string
  duration: string
  isOnline: boolean
}

export interface RouteSchedule {
  id: string
  routeCode: string
  district: string
  region: string
  startDate: string
  endDate: string
  color: string
  schedules: VMSScheduleRecord[]
}

const DisplayTableList: React.FC<Props> = (props) => {
  const { data } = props
  // const data = useMemo(() => routeScheduleData as RouteSchedule[], [])

  const renderTableList = useMemo(() => {
    if (!data?.length) return <Empty description="ไม่พบข้อมูล" />

    return data.map((route, index) => (
      <div key={index} className='bg-(--dark-black) rounded-lg p-5'>
        <div className='mb-4'>
          <h3 className='mb-0.5 text-(--yellow)'>{route.road_code || '-'}</h3>
          <p className='fs-12 text-gray-400 mb-0'>
            {route.department_short_name || '-'}
          </p>
        </div>
        <DisplayTableData
          data={route.settings || []}
        />
      </div>
    ))
  }, [data])

  return (
    <div className='flex flex-col gap-6'>
      {renderTableList}
    </div>
  )
}

export default React.memo<Props>(DisplayTableList)
