import React, { useMemo } from 'react'
import DisplayTableData from './DisplayTableData'
import routeScheduleData from '@/mock/route-schedule.json'

interface Props {

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
  const { } = props
  const data = useMemo(() => routeScheduleData as RouteSchedule[], [])

  const renderTableList = useMemo(() => {
    if (!data.length) return

    return data.map((route) => (
      <div key={route.id} className='bg-(--dark-black) rounded-lg p-5'>
        <div className='mb-4'>
          <h3 className='mb-0.5 text-(--yellow)'>{route.routeCode}</h3>
          <p className='fs-12 text-gray-400 mb-0'>
            {route.district} &bull; {route.region} &bull; {route.startDate} - {route.endDate}
          </p>
        </div>
        <DisplayTableData
          data={route.schedules}
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
