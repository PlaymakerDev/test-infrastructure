"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, ConfigProvider, Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { fmtNumber } from '@/utils/formatNumber'
import { useDailyTable } from '@/features/admin/tracking/detail/wim/hooks'
import { useWIMContext } from '@/features/admin/tracking/detail/wim/context'
import type { StationDailyData } from '@/types/tracking/detail-api'

interface Props {
  /** Reports the raw rows currently visible on this table's page + the meta
   *  total (pagination is internal) so the parent's export dialog can offer a
   *  ทั้งหมด/หน้าปัจจุบัน scope. WIM rows are a structural superset of
   *  StationDailyData, so one row type covers both station types. */
  onPageRowsChange?: (rows: StationDailyData[], total: number, page: number, pageSize: number) => void
}

type StatusType = 'เปิดปกติ' | 'ระบบขัดข้อง' | 'ไม่ส่งข้อมูล'

interface VehicleDataRecord {
  key: string
  no: number
  date: string
  dateISO?: string
  station_id: number
  wim: string
  totalVehicles: number
  overweight: number
  overweight10: number
  status: StatusType
}

// const STATUS_CLASS: Record<StatusType, string> = {
//   'เปิดปกติ': 'border-(--default-blue) text-(--default-blue)',
//   'ระบบขัดข้อง': 'border-(--yellow) text-(--yellow)',
//   'ไม่ส่งข้อมูล': 'border-red-500 text-red-500',
// }

const STATUS_COLOR: Record<StatusType, string> = {
  "เปิดปกติ": "#66AEFF",
  "ระบบขัดข้อง": "#FCD116",
  "ไม่ส่งข้อมูล": "#E94C4C"
}

const DEFAULT_PAGE_SIZE = 10

const TableVehicleData: React.FC<Props> = ({ onPageRowsChange }) => {
  const { id, stationType, vehicleSearchParams, setOpenWeightLogModal } = useWIMContext()
  const { start_date: startDate, end_date: endDate, station_status: stationStatus } = vehicleSearchParams
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const [prevDateFilter, setPrevDateFilter] = useState({ startDate, endDate, stationStatus })
  if (prevDateFilter.startDate !== startDate || prevDateFilter.endDate !== endDate || prevDateFilter.stationStatus !== stationStatus) {
    setPrevDateFilter({ startDate, endDate, stationStatus })
    setPage(1)
  }

  const result = useDailyTable(id as string | number | undefined, stationType, { page, pageSize, startDate, endDate, stationStatus })

  const resultPayload = result.data
  useEffect(() => {
    // page/pageSize ride along so the export's หน้าปัจจุบัน scope can print
    // the same continuing ลำดับ numbers this table shows ((page-1)*size+i+1).
    onPageRowsChange?.(resultPayload?.data ?? [], resultPayload?.meta?.total ?? 0, page, pageSize)
  }, [resultPayload, onPageRowsChange, page, pageSize])

  const getStatus = useCallback((remark: string, total: number): StatusType => {
    if (total > 0) return 'เปิดปกติ'
    if (remark === 'ON' && total === 0) return 'ไม่ส่งข้อมูล'
    return 'ระบบขัดข้อง'
  }, [])

  const dataSource = useMemo<VehicleDataRecord[]>(() => {
    const rows = result.data?.data ?? []
    return rows.map((item, index) => ({
      key: `${item.station_id}-${item.date_time}`,
      no: (page - 1) * pageSize + index + 1,
      date: item.date_time ? dayjs(item.date_time, 'DD/MM/BBBB').format('DD MMM BBBB') : '-',
      dateISO: item.date_time ? dayjs(item.date_time, 'DD/MM/BBBB').format('YYYY-MM-DD') : undefined,
      station_id: item.station_id,
      wim: item.station_name,
      totalVehicles: item.total,
      overweight: item.total_over,
      overweight10: item.isover_10percent,
      status: getStatus(item.remark, item.total),
    }))
  }, [result.data, getStatus, page, pageSize])

  const columns: ColumnsType<VehicleDataRecord> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'left',
      width: 80,
      className: 'col-road-code',
    },
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      align: 'left',
      width: 160,
    },
    {
      title: stationType === 'WIM' ? 'Weight in Motion (WIM)' : 'สถานี',
      dataIndex: 'wim',
      key: 'wim',
      align: 'left',
      width: 220,
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      align: 'center',
      width: 180,
      render: (value: number) => fmtNumber(value),
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน',
      dataIndex: 'overweight',
      key: 'overweight',
      align: 'center',
      width: 200,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{fmtNumber(value)}</span>
      ),
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน 10%',
      dataIndex: 'overweight10',
      key: 'overweight10',
      align: 'center',
      width: 210,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{fmtNumber(value)}</span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: (status: StatusType, record) => {
        const color = STATUS_COLOR[status] || '#66AEFF'
        return (
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: color,
                colorTextLightSolid: 'black'
              }
            }}
          >
            <Button
              type="primary"
              shape="round"
              onClick={() => setOpenWeightLogModal({
                open: true,
                stationId: record.station_id,
                stationType: stationType,
                stationName: record.wim,
                date: record.dateISO
              })}
            >
              <p className='fs-12'>{status}</p>
            </Button>
          </ConfigProvider>
        )
      },
    },
  ]

  if (stationType !== 'STATION' && stationType !== 'WIM') return <Empty description="ไม่พบข้อมูล" />

  return (
    <Table<VehicleDataRecord>
      columns={columns}
      dataSource={dataSource}
      loading={result.isLoading}
      className='bridge-projects-table'
      pagination={{
        current: page,
        pageSize,
        total: result.data?.meta?.total ?? 0,
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

export default React.memo<Props>(TableVehicleData)
