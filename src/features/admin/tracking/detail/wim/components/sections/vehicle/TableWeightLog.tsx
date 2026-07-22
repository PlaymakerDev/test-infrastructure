"use client"
import React, { useEffect, useState } from 'react'
import { Empty, Table } from 'antd'
import { useDailyWeightLogList } from '@/features/admin/tracking/detail/wim/hooks'
import type { DailyWeightLogRow } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import { getDailyWeightLogColumns } from '@/features/admin/tracking/detail/wim/data/dailyWeightLogColumns'

interface Props {
  isOverWeight?: 'Y' | 'N';
  /** Reports the rows currently visible on this table's page (pagination is
   *  internal) so the parent's export dialog can offer a หน้าปัจจุบัน scope. */
  onPageRowsChange?: (rows: DailyWeightLogRow[]) => void;
}

const DEFAULT_PAGE_SIZE = 10

const TableWeightLog: React.FC<Props> = (props) => {
  const { isOverWeight, onPageRowsChange } = props
  const { openWeightLogModal } = useWIMContext()
  const { stationId, stationType, date } = openWeightLogModal
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevIsOverWeight, setPrevIsOverWeight] = useState(isOverWeight)
  if (isOverWeight !== prevIsOverWeight) {
    setPrevIsOverWeight(isOverWeight)
    setPage(1)
  }

  const { data, meta, isLoading } = useDailyWeightLogList(
    stationId as string | number | undefined,
    stationType,
    page,
    pageSize,
    isOverWeight,
    date
  )

  useEffect(() => {
    onPageRowsChange?.(data)
  }, [data, onPageRowsChange])

  const columns = getDailyWeightLogColumns({ showImages: false, hideSpeed: stationType === 'STATION' })

  if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description='ไม่พบข้อมูล' />

  return (
    <Table<DailyWeightLogRow>
      columns={columns}
      dataSource={data}
      loading={isLoading}
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
  )
}

export default React.memo<Props>(TableWeightLog)
