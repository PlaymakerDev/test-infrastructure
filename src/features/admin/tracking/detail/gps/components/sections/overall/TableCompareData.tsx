"use client"
import React from 'react'
import { Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { AnalyticProvinceTrafficData } from '@/types/tracking/detail-gps-api'
import { fmtNumber } from '@/utils/formatNumber'
import { getProvinceRegion } from '@/utils/getProvinceRegion'

interface Props {
  data?: AnalyticProvinceTrafficData[]
  isLoading?: boolean
  isError?: boolean
}

const TableCompareData: React.FC<Props> = (props) => {
  const { data, isLoading, isError } = props

  const columns: ColumnsType<AnalyticProvinceTrafficData> = [
    {
      title: 'ลำดับ',
      dataIndex: 'rank',
      key: 'rank',
      align: 'left',
      width: 80,
      render: (_, __, index) => index + 1
    },
    {
      title: 'จังหวัด',
      dataIndex: 'province',
      key: 'province',
      align: 'left',
      width: 180,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ภาค',
      dataIndex: 'province',
      key: 'region',
      align: 'left',
      width: 220,
      render: (item) => {
        return getProvinceRegion(item) ?? '-'
      }
    },
    {
      title: 'สายทาง',
      dataIndex: 'road_count',
      key: 'road_count',
      align: 'left',
      width: 100,
      render: (item) => {
        if (item) return fmtNumber(item)
        return '-'
      }
    },
    {
      title: 'รถวิ่งผ่านรวม',
      dataIndex: 'total_vehicles',
      key: 'total_vehicles',
      align: 'left',
      width: 150,
      render: (item) => {
        if (item) return <p className='fs-12 text-(--yellow)'>{fmtNumber(item)}</p>
        return '-'
      }
    },
    {
      title: 'เฉลี่ยต่อวัน',
      dataIndex: 'avg_per_road_day',
      key: 'avg_per_road_day',
      align: 'left',
      width: 130,
      render: (item) => {
        if (item) return <p className='fs-12 text-(--default-blue)'>{fmtNumber(item)}</p>
        return '-'
      }
    },
  ]

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" className="mt-10" />

  return (
    <Table<AnalyticProvinceTrafficData>
      columns={columns}
      dataSource={data}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ y: 240 }}
      loading={isLoading}
    />
  )
}

export default React.memo(TableCompareData)
