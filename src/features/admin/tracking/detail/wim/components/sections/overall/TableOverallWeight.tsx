"use client"
import React from 'react'
import { Empty } from 'antd'
import dayjs from 'dayjs'
import { useDailyTable } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import QueryBoundary from '@/components/common/QueryBoundary'
import { TableLatestStation, TableLatestWIM } from '../../../components'

interface Props {

}

const TableOverallWeight: React.FC<Props> = () => {
  const { id: stationId, stationType } = useWIMContext()

  const result = useDailyTable(stationId as string | number | undefined, stationType, {
    startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  })

  const renderTableData = React.useMemo(() => {
    if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description="ไม่พบข้อมูล" />
    return (
      <QueryBoundary isLoading={result.isLoading} isError={result.isError}>
        {result.kind === 'STATION'
          ? <TableLatestStation data={result.data} />
          : <TableLatestWIM data={result.data} />}
      </QueryBoundary>
    )
  }, [stationType, result])

  return (
    <div>
      <h3 className='text-(--yellow) font-normal! mb-5'>ตารางข้อมูลรถเข้าชั่งน้ำหนัก 7 วันย้อนหลัง</h3>
      {renderTableData}
    </div>
  )
}

export default React.memo<Props>(TableOverallWeight)
