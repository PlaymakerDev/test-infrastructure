"use client"
import React, { useMemo } from 'react'
import { Empty, Skeleton, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query';
import { getTrackingStationDailyAPI, getTrackingWIMDailyAPI } from '@/services/routes/TrackingDetailService';
import dayjs from 'dayjs';
import { TableLatestStation, TableLatestWIM } from '../../../components'

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
}

const TableOverallWeight: React.FC<Props> = (props) => {
  const { stationId, stationType } = props

  const {
    data: station,
    isLoading: isStationLoading,
    isError: isStationError
  } = useQuery({
    queryKey: ['station_daily', stationId, stationType],
    queryFn: () => getTrackingStationDailyAPI({
      start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
      end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
      station_id: stationId as string,
    }),
    enabled: !!stationId && stationType === 'STATION',
  })

  const {
    data: wim,
    isLoading: isWimLoading,
    isError: isWimError
  } = useQuery({
    queryKey: ['wim_daily', stationId, stationType],
    queryFn: () => getTrackingWIMDailyAPI({
      start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
      end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
      station_id: stationId as string,
    }),
    enabled: !!stationId && stationType === 'WIM',
  })

  const renderStationDaily = useMemo(() => {
    if (isStationLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isStationError) return <Empty description="ไม่พบข้อมูล" />
    return <TableLatestStation data={station?.data} />
  }, [isStationLoading, isStationError, station?.data])

  const renderWimDaily = useMemo(() => {
    if (isWimLoading) return <Skeleton active paragraph={{ rows: 4 }} />
    if (isWimError) return <Empty description="ไม่พบข้อมูล" />
    return <TableLatestWIM data={wim?.data} />
  }, [isWimLoading, isWimError, wim?.data])

  const renderTableData = useMemo(() => {
    if (stationType === 'STATION') return renderStationDaily
    if (stationType === 'WIM') return renderWimDaily
    return <Empty description="ไม่พบข้อมูล" />
  }, [stationType, renderStationDaily, renderWimDaily])

  return (
    <div>
      <h3 className='text-(--yellow) mb-5'>ตารางข้อมูลรถเข้าชั่งน้ำหนัก 7 วันย้อนหลัง</h3>
      {renderTableData}
    </div>
  )
}

export default React.memo<Props>(TableOverallWeight)
