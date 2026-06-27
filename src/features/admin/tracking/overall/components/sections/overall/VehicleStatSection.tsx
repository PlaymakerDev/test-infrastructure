import { getTrackingDailySumAPI, getTrackingTotalStationAPI } from '@/services/routes/TrackingService'
import { fmtNumber } from '@/utils/formatNumber'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Empty, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

interface Props { }

const VehicleStatSection: React.FC<Props> = (props) => {
  const { } = props

  const { data: dailySumData, isLoading: isDailySumLoading, isError: isDailySumError } = useQuery({
    queryKey: ['daily_sum'],
    queryFn: () => getTrackingDailySumAPI({
      date: dayjs().format('YYYY-MM-DD')
    }),
    placeholderData: keepPreviousData
  })

  const { data: totalStationData, isLoading: isTotalStationLoading, isError: isTotalStationError } = useQuery({
    queryKey: ['total_station'],
    queryFn: () => getTrackingTotalStationAPI({
      date: dayjs().format('YYYY-MM-DD')
    }),
    placeholderData: keepPreviousData
  })

  const renderVehicleStat = useMemo(() => {
    if (isDailySumLoading || isTotalStationLoading) return <Skeleton loading={isDailySumLoading || isTotalStationLoading} active paragraph={{ rows: 10 }} />
    if (isDailySumError || isTotalStationError) return <Empty description="ไม่พบข้อมูล" />

    const station = dailySumData?.data.data.items.find(item => item.station_type === 1)
    const wim = dailySumData?.data.data.items.find(item => item.station_type === 3)
    const spot = dailySumData?.data.data.items.find(item => item.station_type === 2)
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        {/* f1 — xs: border-b | sm: border-b + border-r | lg: border-r only */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--yellow)/50 border-b sm:border-r lg:border-b-0'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>รวมรถเข้าชั่งวันนี้</h3>
            <p className='text-xs text-gray-400'>รวมรถเข้าชั่งวันนี้</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>{fmtNumber(Number(dailySumData?.data.data.all_sum.total || 0))}</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>{fmtNumber(Number(dailySumData?.data.data.all_sum.over || 0))}</h2>
            </div>
          </section>
        </figure>

        {/* f2 — xs: border-b | sm: border-b (rightmost, no border-r) | lg: border-b-0 + border-r */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--yellow)/50 border-b lg:border-b-0 lg:border-r'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>สถานีตรวจสอบน้ำหนัก</h3>
            <p className='text-xs text-gray-400'>เปิดใช้งาน <span className='text-(--yellow)'>{fmtNumber(Number(totalStationData?.data.station.open || 0))}</span> / {fmtNumber(Number(totalStationData?.data.station.total || 0))}</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>{fmtNumber(Number(station?.total || 0))}</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>{fmtNumber(Number(station?.over || 0))}</h2>
            </div>
          </section>
        </figure>

        {/* f3 — xs: border-b | sm: border-b-0 + border-r | lg: border-r */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--yellow)/50 border-b sm:border-b-0 sm:border-r'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>WIM (Weight-In-Motion)</h3>
            <p className='text-xs text-gray-400'>เปิดใช้งาน <span className='text-(--yellow)'>{fmtNumber(Number(totalStationData?.data.wim.open || 0))}</span> / {fmtNumber(Number(totalStationData?.data.wim.total || 0))}</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>{fmtNumber(Number(wim?.total || 0))}</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>{fmtNumber(Number(wim?.over || 0))}</h2>
            </div>
          </section>
        </figure>

        {/* f4 — last item, no border needed at any breakpoint */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>หน่วยตรวจสอบน้ำหนักเคลื่อนที่</h3>
            <p className='text-xs text-gray-400'>เปิดใช้งาน <span className='text-(--yellow)'>{fmtNumber(Number(totalStationData?.data.mobile.open || 0))}</span> / {fmtNumber(Number(totalStationData?.data.mobile.total || 0))}</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>{fmtNumber(Number(spot?.total || 0))}</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>{fmtNumber(Number(spot?.over || 0))}</h2>
            </div>
          </section>
        </figure>
      </div>
    )
  }, [dailySumData, isDailySumLoading, isDailySumError, totalStationData, isTotalStationLoading, isTotalStationError])

  return (
    <div className='border-2 rounded-lg border-(--default-blue) p-5'>
      {renderVehicleStat}
    </div>
  )
}

export default React.memo<Props>(VehicleStatSection)