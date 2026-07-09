"use client"
import React from 'react'
import { Empty } from 'antd'
import { useDailyTable } from '@/features/admin/tracking/detail/wim/hooks'
import QueryBoundary from '@/components/common/QueryBoundary'
import { TableLatestStation, TableLatestWIM } from '../../../components'

interface Props {
  stationId: string[] | string | number | undefined;
  stationType: string | null | undefined;
}

const TableOverallWeight: React.FC<Props> = (props) => {
  const { stationId, stationType } = props

  const result = useDailyTable(stationId as string | number | undefined, stationType)

  const renderTableData = () => {
    if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description="ไม่พบข้อมูล" />
    return (
      <QueryBoundary isLoading={result.isLoading} isError={result.isError}>
        {result.kind === 'STATION'
          ? <TableLatestStation data={result.data} />
          : <TableLatestWIM data={result.data} />}
      </QueryBoundary>
    )
  }

  return (
    <div>
      <h3 className='text-(--yellow) mb-5'>ตารางข้อมูลรถเข้าชั่งน้ำหนัก 7 วันย้อนหลัง</h3>
      {renderTableData()}
    </div>
  )
}

export default React.memo<Props>(TableOverallWeight)
