import React, { useCallback, useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { APIResponseStationDaily, StationDailyData } from '@/types/tracking/detail-api'
import dayjs from 'dayjs'
import { fmtNumber } from '@/utils/formatNumber'

interface Props {
  data?: APIResponseStationDaily
}

type StatusType = 'เปิดปกติ' | 'ระบบขัดข้อง' | 'ไม่ส่งข้อมูล'

const STATUS_CLASS: Record<StatusType, string> = {
  'เปิดปกติ': 'border-(--default-blue) text-(--default-blue)',
  'ระบบขัดข้อง': 'border-(--yellow) text-(--yellow)',
  'ไม่ส่งข้อมูล': 'border-red-500 text-red-500',
}

const TableLatestStation: React.FC<Props> = (props) => {
  const { data } = props

  const sortedData = useMemo(() => {
    return [...(data?.data ?? [])].sort((a, b) =>
      dayjs(b.date_time, 'DD/MM/BBBB').valueOf() - dayjs(a.date_time, 'DD/MM/BBBB').valueOf()
    )
  }, [data?.data])

  const getStatus = useCallback((remark: string, total: number) => {
    if (total > 0) return 'เปิดปกติ'
    if (remark === 'OFF' && total === 0) return 'ด่านมีปัญหา'
    if (remark === 'ON' && total === 0) return 'ไม่ส่งข้อมูล'
    return 'ไม่ทราบสถานะ'
  }, [])

  const columns: ColumnsType<StationDailyData> = [
    {
      title: 'วันที่',
      dataIndex: 'date_time',
      key: 'date_time',
      align: 'left',
      width: 180,
      className: 'col-road-code',
      render: (value) => {
        if (value) return dayjs(value, 'DD/MM/BBBB').format('DD MMM BBBB')
        return '-'
      }
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'total',
      key: 'total',
      align: 'center',
      width: 200,
      render: (value) => {
        if (value) return fmtNumber(value)
        return '-'
      }
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'total_over',
      key: 'total_over',
      align: 'center',
      width: 180,
      render: (value) => {
        if (value) return <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{fmtNumber(value)}</span>
        return '-'
      }
    },
    {
      title: 'รถน้ำหนักเกิน 10%',
      dataIndex: 'isover_10percent',
      key: 'isover_10percent',
      align: 'center',
      width: 200,
      render: (value) => {
        if (value) return <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{fmtNumber(value)}</span>
        return '-'
      }
    },
    {
      title: 'สถานะ',
      dataIndex: 'remark',
      key: 'remark',
      align: 'center',
      width: 160,
      fixed: 'right',
      render: (value, record) => {
        const status = getStatus(value, record.total)
        return (
          <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border ${STATUS_CLASS[status as StatusType]}`}>
            {status}
          </span>
        )
      },
    },
  ]

  return (
    <Table<StationDailyData>
      columns={columns}
      dataSource={sortedData}
      pagination={false}
      size="middle"
      rowKey={(record) => `${record.station_id}-${record.date_time}`}
      scroll={{
        x: 'max-content',
        y: 300
      }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableLatestStation)
