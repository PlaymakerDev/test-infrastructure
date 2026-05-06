"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type StatusType = 'เปิดปกติ' | 'ระบบขัดข้อง' | 'ไม่ส่งข้อมูล'

interface OverallWeightRecord {
  key: string
  date: string
  totalVehicles: number
  overweight: number
  overweight10: number
  status: StatusType
}

const STATUS_CLASS: Record<StatusType, string> = {
  'เปิดปกติ': 'border-(--default-blue) text-(--default-blue)',
  'ระบบขัดข้อง': 'border-(--yellow) text-(--yellow)',
  'ไม่ส่งข้อมูล': 'border-red-500 text-red-500',
}

const mockData: OverallWeightRecord[] = [
  { key: '1', date: '22 มี.ค. 2569', totalVehicles: 10, overweight: 2, overweight10: 0, status: 'เปิดปกติ' },
  { key: '2', date: '23 มี.ค. 2569', totalVehicles: 2648, overweight: 10, overweight10: 2, status: 'เปิดปกติ' },
  { key: '3', date: '24 มี.ค. 2569', totalVehicles: 2543, overweight: 17, overweight10: 8, status: 'เปิดปกติ' },
  { key: '4', date: '25 มี.ค. 2569', totalVehicles: 0, overweight: 0, overweight10: 0, status: 'ระบบขัดข้อง' },
  { key: '5', date: '26 มี.ค. 2569', totalVehicles: 0, overweight: 0, overweight10: 0, status: 'ไม่ส่งข้อมูล' },
  { key: '6', date: '27 มี.ค. 2569', totalVehicles: 2448, overweight: 20, overweight10: 2, status: 'เปิดปกติ' },
  { key: '7', date: '28 มี.ค. 2569', totalVehicles: 2645, overweight: 22, overweight10: 15, status: 'เปิดปกติ' },
]

const TableOverallWeight: React.FC<Props> = () => {
  const columns: ColumnsType<OverallWeightRecord> = [
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      width: 180,
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      align: 'center',
      width: 200,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'overweight',
      key: 'overweight',
      align: 'center',
      width: 180,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{value}</span>
      ),
    },
    {
      title: 'รถน้ำหนักเกิน 10%',
      dataIndex: 'overweight10',
      key: 'overweight10',
      align: 'center',
      width: 200,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{value}</span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 160,
      fixed: 'right',
      render: (status: StatusType) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border ${STATUS_CLASS[status]}`}>
          {status}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h3 className='text-yellow-500 mb-5'>ตารางข้อมูลรถเข้าชั่งน้ำหนัก 7 วันย้อนหลัง</h3>
      <Table<OverallWeightRecord>
        columns={columns}
        dataSource={mockData}
        pagination={false}
        size="middle"
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}

export default React.memo<Props>(TableOverallWeight)
