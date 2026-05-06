"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type StatusType = 'เปิดปกติ' | 'ระบบขัดข้อง' | 'ไม่ส่งข้อมูล'

interface VehicleDataRecord {
  key: string
  no: number
  date: string
  wim: string
  totalVehicles: number
  overweight: number
  overweight10: number
  status: StatusType
}

const STATUS_CLASS: Record<StatusType, string> = {
  'เปิดปกติ':     'border-(--default-blue) text-(--default-blue)',
  'ระบบขัดข้อง':  'border-(--yellow) text-(--yellow)',
  'ไม่ส่งข้อมูล': 'border-red-500 text-red-500',
}

const mockData: VehicleDataRecord[] = [
  { key: '1', no: 1, date: '20 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 2206, overweight: 18, overweight10: 12, status: 'เปิดปกติ' },
  { key: '2', no: 2, date: '19 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 1937, overweight: 3,  overweight10: 1,  status: 'เปิดปกติ' },
  { key: '3', no: 3, date: '18 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 0,    overweight: 0,  overweight10: 0,  status: 'ระบบขัดข้อง' },
  { key: '4', no: 4, date: '17 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 0,    overweight: 0,  overweight10: 0,  status: 'ระบบขัดข้อง' },
  { key: '5', no: 5, date: '16 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 4834, overweight: 27, overweight10: 20, status: 'เปิดปกติ' },
  { key: '6', no: 6, date: '15 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 2826, overweight: 10, overweight10: 0,  status: 'เปิดปกติ' },
  { key: '7', no: 7, date: '14 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 2927, overweight: 12, overweight10: 4,  status: 'เปิดปกติ' },
  { key: '8', no: 8, date: '13 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 0,    overweight: 0,  overweight10: 0,  status: 'ไม่ส่งข้อมูล' },
  { key: '9', no: 9, date: '12 เม.ย. 2569', wim: 'ชม.3035', totalVehicles: 0,    overweight: 0,  overweight10: 0,  status: 'ระบบขัดข้อง' },
]

const TableVehicleData: React.FC<Props> = () => {
  const columns: ColumnsType<VehicleDataRecord> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 80,
    },
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      width: 160,
    },
    {
      title: 'Weight in Motion (WIM)',
      dataIndex: 'wim',
      key: 'wim',
      align: 'center',
      width: 220,
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      align: 'center',
      width: 180,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน',
      dataIndex: 'overweight',
      key: 'overweight',
      align: 'center',
      width: 200,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{value}</span>
      ),
    },
    {
      title: 'จำนวนรถน้ำหนักเกิน 10%',
      dataIndex: 'overweight10',
      key: 'overweight10',
      align: 'center',
      width: 210,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{value}</span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 150,
      fixed: 'right',
      render: (status: StatusType) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border ${STATUS_CLASS[status]}`}>
          {status}
        </span>
      ),
    },
  ]

  return (
    <Table<VehicleDataRecord>
      columns={columns}
      dataSource={mockData}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableVehicleData)
