import React, { useMemo } from 'react'
import {
  VehicleDetail,
  VehicleRoute,
} from '@/features/admin/tracking/detail/gps/components'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Empty, Skeleton } from 'antd'
import { getTrackingGPSTopActiveTruckAPI, getTrackingGPSVehicleHistoryAPI } from '@/services/routes/TrackingGPSService'

interface Props {

}

const VehicleHistory: React.FC<Props> = (props) => {
  const { } = props

  const {
    data: topActiveTruck,
    isLoading: isLoadingTopActiveTruck,
    isError: isErrorTopActiveTruck
  } = useQuery({
    queryKey: ['vehicle_history'],
    queryFn: () => getTrackingGPSTopActiveTruckAPI({
      limit: 10
    }),
  })

  const latestUnitId = useMemo(() => {
    const list = topActiveTruck?.data.data ?? []
    if (!list.length) return undefined
    return [...list].sort((a, b) => dayjs(b.last_updated_at).valueOf() - dayjs(a.last_updated_at).valueOf())[0].unit_id
  }, [topActiveTruck])

  const {
    data: vehicleHistory,
    isLoading: isLoadingVehicleHistory,
    isError: isErrorVehicleHistory
  } = useQuery({
    queryKey: ['vehicle_history_detail', latestUnitId],
    queryFn: () => getTrackingGPSVehicleHistoryAPI({
      unit_id: latestUnitId
    }),
    enabled: !!latestUnitId,
  })

  // ยังไม่มี unit_id ให้ยิงต่อ ต้องรอ topActiveTruck โหลดเสร็จก่อน — enabled: false
  // ทำให้ isLoadingVehicleHistory เป็น false เสมอในช่วงนี้ (ไม่ใช่ isLoading จริง)
  const isLoading = isLoadingTopActiveTruck || (!!latestUnitId && isLoadingVehicleHistory)
  const isError = isErrorTopActiveTruck || isErrorVehicleHistory
  const isEmpty = !isLoadingTopActiveTruck && !isErrorTopActiveTruck && !latestUnitId

  const renderContent = useMemo(() => {
    if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />
    if (isEmpty) return <Empty description="ไม่พบข้อมูลรถ" />
    return (
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-0'>
        <VehicleDetail
          data={vehicleHistory?.data.data}
        />
        <VehicleRoute
          data={vehicleHistory?.data.data}
          unitId={latestUnitId}
        />
      </div>
    )
  }, [isLoading, isEmpty, vehicleHistory, latestUnitId])

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return renderContent
}

export default React.memo<Props>(VehicleHistory)
