"use client"
import React from 'react'
import { Table, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { VMSScheduleRecord } from './DisplayTableList'

interface Props {
  data: VMSScheduleRecord[];
}

const columns: ColumnsType<VMSScheduleRecord> = [
  {
    title: 'จุดติดตั้ง',
    dataIndex: 'location',
    key: 'location',
    width: 260,
  },
  {
    title: 'หมวดหมู่',
    dataIndex: 'category',
    key: 'category',
    align: 'center',
    width: 130,
  },
  {
    title: 'ประเภทเนื้อหา',
    dataIndex: 'contentType',
    key: 'contentType',
    align: 'center',
    width: 140,
  },
  {
    title: 'วันที่และเวลาเริ่มต้น',
    dataIndex: 'startDate',
    key: 'startDate',
    align: 'center',
    width: 170,
    render: (value: string) => (
      <span className='whitespace-pre-line'>{value}</span>
    ),
  },
  {
    title: 'วันที่และเวลาสิ้นสุด',
    dataIndex: 'endDate',
    key: 'endDate',
    align: 'center',
    width: 170,
    render: (value: string) => (
      <span className='whitespace-pre-line'>{value}</span>
    ),
  },
  {
    title: 'แสดงผล',
    dataIndex: 'duration',
    key: 'duration',
    align: 'center',
    width: 120,
    render: (value: string) => (
      <span className='text-(--yellow)'>{value}</span>
    ),
  },
  {
    title: 'สถานะ',
    key: 'status',
    align: 'center',
    width: 130,
    fixed: 'right',
    render: (_: unknown, record: VMSScheduleRecord) => (
      <span className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${record.isOnline ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
        {record.isOnline ? <TbWifi /> : <TbWifiOff />}
        {record.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
        <Badge color={record.isOnline ? 'green' : 'red'} />
      </span>
    ),
  },
]

const DisplayTableData: React.FC<Props> = (props) => {
  const { data } = props

  return (
    <Table<VMSScheduleRecord>
      columns={columns}
      dataSource={data}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(DisplayTableData)
