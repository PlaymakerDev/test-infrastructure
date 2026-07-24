import React, { useMemo, useState } from 'react'
import { Button, ConfigProvider, Empty, Skeleton } from 'antd'
import { VehicleHistoryData } from '@/types/tracking/detail-gps-api'
import dayjs from 'dayjs'
import { fmtNumber } from '@/utils/formatNumber'
import { useQuery } from '@tanstack/react-query'
import { getTrackingGPSVehicleRouteHistoryAPI } from '@/services/routes/TrackingGPSService'

interface Props {
  data?: VehicleHistoryData
  unitId?: string
}

type FilterOption = 'วันนี้' | '3 วัน' | '7 วัน'
const FILTER_OPTIONS: FilterOption[] = ['วันนี้', '3 วัน', '7 วัน']

const VehicleRoute: React.FC<Props> = (props) => {
  const { data, unitId: latestUnitId } = props
  const [activeFilter, setActiveFilter] = useState<FilterOption>('วันนี้')

  const days = activeFilter === '3 วัน' ? 3 : activeFilter === '7 วัน' ? 7 : undefined

  const {
    data: vehicleRouteHistory,
    isLoading: isLoadingVehicleRouteHistory,
    isError: isErrorVehicleRouteHistory
  } = useQuery({
    queryKey: ['vehicle_route_history_detail', latestUnitId, days],
    queryFn: () => getTrackingGPSVehicleRouteHistoryAPI({
      unit_id: latestUnitId,
      days
    }),
    enabled: !!latestUnitId && !!days,
  })

  const renderOptionButton = useMemo(() => {
    return FILTER_OPTIONS.map((item) => (
      <ConfigProvider
        key={item}
        theme={{
          token: {
            colorPrimary: '#212121',
          }
        }}
      >
        <Button
          shape='round'
          type={activeFilter === item ? 'primary' : 'text'}
          size='medium'
          onClick={() => {
            setActiveFilter(item)
          }}
        >
          <p className={`fs-12 ${activeFilter === item ? 'text-(--yellow)' : 'text-white'}`}>{item}</p>
        </Button>
      </ConfigProvider>
    ))
  }, [activeFilter])

  const renderLogTimeline = useMemo(() => {
    if (isLoadingVehicleRouteHistory) return <Skeleton loading={isLoadingVehicleRouteHistory} active paragraph={{ rows: 6 }} />
    if (isErrorVehicleRouteHistory) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />
    // if (Object.keys(vehicleRouteHistory?.data.data.events_by_date || {}).length === 0) return <Empty description="ไม่พบข้อมูลเส้นทาง" />

    return Object.entries(vehicleRouteHistory?.data.data.events_by_date || {}).map(([date, events]) => {
      if (events.length === 0) {
        return (
          <figure key={date} className='block m-auto'>
            <Empty key={date} description="ไม่พบข้อมูลเส้นทาง" />
          </figure>
        )
      }
      return events.map((item, index) => {
        return (
          <div key={`${date}-${item.event_time}-${item.road_id}-${index}`} className='rounded-lg px-5 py-3 bg-(--dark-black)'>
            <h4>{item.road_name || '-'}</h4>
            <p className='fs-12 text-gray-400'>{item.event_time ? dayjs(item.event_time).format('DD MMM BBBB HH:mm:ss') : '-'}</p>
            <p className='fs-12 text-(--yellow)'>ความเร็ว : {fmtNumber(Number(item.speed)) || 0} กม./ชม.</p>
          </div>
        )
      })
    })
  }, [isLoadingVehicleRouteHistory, isErrorVehicleRouteHistory, vehicleRouteHistory])

  const renderCurrentTimeline = useMemo(() => {
    if (!data?.route_events?.length) {
      return (
        <figure className='block m-auto'>
          <Empty description="ไม่พบข้อมูลเส้นทาง" />
        </figure>
      )
    }
    return data?.route_events.map((item) => {
      return (
        <div key={item.id} className='rounded-lg px-5 py-3 bg-(--dark-black)'>
          <h4>{item.road_name || '-'}</h4>
          <p className='fs-12 text-gray-400'>{item.event_time ? dayjs(item.event_time).format('DD MMM BBBB HH:mm:ss') : '-'}</p>
          <p className='fs-12 text-(--yellow)'>ความเร็ว : {fmtNumber(Number(item.speed)) || 0} กม./ชม.</p>
        </div>
      )
    })
  }, [data?.route_events])

  const renderTimelineMode = useMemo(() => {
    switch (activeFilter) {
      case 'วันนี้':
        return renderCurrentTimeline
      case '3 วัน':
        return renderLogTimeline
      case '7 วัน':
        return renderLogTimeline
      default:
        return null
    }
  }, [activeFilter, renderCurrentTimeline, renderLogTimeline])

  return (
    <div className='rounded-2xl p-5 bg-(--gray)'>
      <section>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h4 className='font-normal! text-(--yellow) leading-tight'>เส้นทางการเคลื่อนที่</h4>
          <div className='bg-[#A2A2A233] rounded-3xl p-1.5 flex items-center'>
            {renderOptionButton}
          </div>
        </div>
      </section>
      <section className='mt-5 '>
        <div className='h-100 3xl:h-80 flex flex-col gap-3 overflow-y-auto'>
          {renderTimelineMode}
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleRoute)
