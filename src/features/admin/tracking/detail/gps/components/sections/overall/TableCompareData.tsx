"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface TrafficRankRecord {
  key: string
  rank: number
  province: string
  region: string
  route: number
  totalTraffic: number
  dailyAverage: number
}

const mockData: TrafficRankRecord[] = [
  { key: '1', rank: 1, province: 'ชลบุรี', region: 'ภาคตะวันออก', route: 60, totalTraffic: 153934, dailyAverage: 382 },
  { key: '2', rank: 2, province: 'นครราชสีมา', region: 'ภาคตะวันออกเฉียงเหนือ', route: 81, totalTraffic: 82345, dailyAverage: 250 },
  { key: '3', rank: 3, province: 'พระนครศรีอยุธยา', region: 'ภาคกลาง', route: 52, totalTraffic: 68247, dailyAverage: 188 },
  { key: '4', rank: 4, province: 'สมุทรปราการ', region: 'ภาคกลาง', route: 12, totalTraffic: 67281, dailyAverage: 830 },
  { key: '5', rank: 5, province: 'สระบุรี', region: 'ภาคกลาง', route: 52, totalTraffic: 44967, dailyAverage: 181 },
  { key: '6', rank: 6, province: 'ปทุมธานี', region: 'ภาคกลาง', route: 34, totalTraffic: 38521, dailyAverage: 102 },
  { key: '7', rank: 7, province: 'นนทบุรี', region: 'ภาคกลาง', route: 28, totalTraffic: 35890, dailyAverage: 95 },
  { key: '8', rank: 8, province: 'นครปฐม', region: 'ภาคกลาง', route: 45, totalTraffic: 29134, dailyAverage: 78 },
]

const columns: ColumnsType<TrafficRankRecord> = [
  {
    title: 'ลำดับ',
    dataIndex: 'rank',
    key: 'rank',
    align: 'center',
    width: 80,
  },
  {
    title: 'จังหวัด',
    dataIndex: 'province',
    key: 'province',
    align: 'center',
    width: 180,
  },
  {
    title: 'ภาค',
    dataIndex: 'region',
    key: 'region',
    align: 'center',
    width: 220,
  },
  {
    title: 'สายทาง',
    dataIndex: 'route',
    key: 'route',
    align: 'center',
    width: 100,
  },
  {
    title: 'รถวิ่งผ่านรวม',
    dataIndex: 'totalTraffic',
    key: 'totalTraffic',
    align: 'center',
    width: 150,
    render: (value: number) => (
      <span className="text-(--yellow)">{value.toLocaleString()}</span>
    ),
  },
  {
    title: 'เฉลี่ยต่อวัน',
    dataIndex: 'dailyAverage',
    key: 'dailyAverage',
    align: 'center',
    width: 130,
    render: (value: number) => (
      <span className="text-blue-400">{value.toLocaleString()}</span>
    ),
  },
]

const TableCompareData = () => {
  return (
    <Table<TrafficRankRecord>
      columns={columns}
      dataSource={mockData}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ y: 240 }}
    />
  )
}

export default React.memo(TableCompareData)
