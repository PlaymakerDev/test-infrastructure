"use client"
import React, { useEffect, useState } from 'react'
import { Empty, Table } from 'antd'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import type { DailyWeightLogRow } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import { getDailyWeightLogColumns } from '@/features/admin/tracking/detail/wim/data/dailyWeightLogColumns'
import QueryBoundary from '@/components/common/QueryBoundary'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  isOverWeight?: 'Y' | 'N';
  /** Reports the rows currently visible on this table's page + the current
   *  page/pageSize (pagination is internal) so the parent's export dialog can
   *  offer a หน้าปัจจุบัน scope that matches the on-screen continuing ลำดับ. */
  onPageRowsChange?: (rows: DailyWeightLogRow[], page: number, pageSize: number) => void;
}

const DEFAULT_PAGE_SIZE = 10

const TableOverallDailyWeight: React.FC<Props> = (props) => {
  const { isOverWeight, onPageRowsChange } = props
  const { id: stationId, stationType } = useWIMContext()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevIsOverWeight, setPrevIsOverWeight] = useState(isOverWeight)
  if (isOverWeight !== prevIsOverWeight) {
    setPrevIsOverWeight(isOverWeight)
    setPage(1)
  }

  const { data, meta, isLoading, isError } = useDailyWeightLogList(
    stationId as string | number | undefined,
    stationType,
    page,
    pageSize,
    isOverWeight
  )

  useEffect(() => {
    onPageRowsChange?.(data, page, pageSize)
  }, [data, onPageRowsChange, page, pageSize])

  const columns = getDailyWeightLogColumns({ hideSpeed: stationType === 'STATION', page, pageSize })

  if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description='ไม่พบข้อมูล' />

  return (
    <QueryBoundary isLoading={isLoading} isError={isError}>
      <Table<DailyWeightLogRow>
        columns={columns}
        dataSource={data}
        className='bridge-projects-table'
        pagination={{
          current: page,
          pageSize,
          total: meta?.total ?? 0,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage)
            setPageSize(nextPageSize)
          },
          locale: { items_per_page: '/ หน้า' },
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (t, range) => `${range[1] - range[0] + 1} จาก ${t}`,
        }}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description='ไม่พบข้อมูล' /> }}
      />
    </QueryBoundary>
  )
}

export default React.memo<Props>(TableOverallDailyWeight)
