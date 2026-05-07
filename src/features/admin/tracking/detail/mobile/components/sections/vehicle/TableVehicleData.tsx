"use client"
import React from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type StatusType = 'เปิดด่าน' | 'ปิดด่าน'

interface VehicleDataRecord {
  key: string
  no: number
  date: string
  startTime: string | null
  endTime: string | null
  integration: string | null
  totalVehicles: number
  overweightTotal: number
  overweightAxle: number
  acceptCount: number
  prosecuteCount: number
  status: StatusType
}

const STATUS_CLASS: Record<StatusType, string> = {
  'เปิดด่าน': 'border-blue-400 text-blue-400',
  'ปิดด่าน':  'border-red-500 text-red-500',
}

const NA = <span className="text-white/30">ไม่ระบุ</span>

const mockData: VehicleDataRecord[] = [
  { key: '1', no: 1, date: '20 เม.ย. 2569', startTime: '14:44:03 น.', endTime: '20:44:03 น.', integration: null,  totalVehicles: 4,  overweightTotal: 0, overweightAxle: 2,  acceptCount: 1,  prosecuteCount: 1, status: 'เปิดด่าน' },
  { key: '2', no: 2, date: '19 เม.ย. 2569', startTime: '14:50:23 น.', endTime: '15:42:56 น.', integration: 'กช.', totalVehicles: 6,  overweightTotal: 0, overweightAxle: 4,  acceptCount: 4,  prosecuteCount: 0, status: 'เปิดด่าน' },
  { key: '3', no: 3, date: '18 เม.ย. 2569', startTime: '10:25:46 น.', endTime: '16:11:04 น.', integration: null,  totalVehicles: 24, overweightTotal: 2, overweightAxle: 15, acceptCount: 17, prosecuteCount: 0, status: 'เปิดด่าน' },
  { key: '4', no: 4, date: '17 เม.ย. 2569', startTime: '13:09:43 น.', endTime: '19:09:43 น.', integration: 'กช.', totalVehicles: 6,  overweightTotal: 0, overweightAxle: 4,  acceptCount: 4,  prosecuteCount: 0, status: 'เปิดด่าน' },
  { key: '5', no: 5, date: '16 เม.ย. 2569', startTime: '12:14:49 น.', endTime: '18:50:13 น.', integration: 'กช.', totalVehicles: 14, overweightTotal: 2, overweightAxle: 8,  acceptCount: 10, prosecuteCount: 0, status: 'เปิดด่าน' },
  { key: '6', no: 6, date: '15 เม.ย. 2569', startTime: null,           endTime: null,           integration: null,  totalVehicles: 0,  overweightTotal: 0, overweightAxle: 0,  acceptCount: 0,  prosecuteCount: 0, status: 'ปิดด่าน' },
  { key: '7', no: 7, date: '14 เม.ย. 2569', startTime: null,           endTime: null,           integration: null,  totalVehicles: 0,  overweightTotal: 0, overweightAxle: 0,  acceptCount: 0,  prosecuteCount: 0, status: 'ปิดด่าน' },
  { key: '8', no: 8, date: '13 เม.ย. 2569', startTime: null,           endTime: null,           integration: null,  totalVehicles: 0,  overweightTotal: 0, overweightAxle: 0,  acceptCount: 0,  prosecuteCount: 0, status: 'ปิดด่าน' },
  { key: '9', no: 9, date: '12 เม.ย. 2569', startTime: null,           endTime: null,           integration: null,  totalVehicles: 0,  overweightTotal: 0, overweightAxle: 0,  acceptCount: 0,  prosecuteCount: 0, status: 'ปิดด่าน' },
]

const TableVehicleData: React.FC<Props> = () => {
  const columns: ColumnsType<VehicleDataRecord> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 70,
      fixed: 'left',
    },
    {
      title: 'วันที่',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      width: 140,
    },
    {
      title: 'เวลาจัดตั้ง',
      dataIndex: 'startTime',
      key: 'startTime',
      align: 'center',
      width: 130,
      render: (val: string | null) => val ?? NA,
    },
    {
      title: 'เวลาสิ้นสุด',
      dataIndex: 'endTime',
      key: 'endTime',
      align: 'center',
      width: 130,
      render: (val: string | null) => val ?? NA,
    },
    {
      title: 'ร่วมบูรณาการ',
      dataIndex: 'integration',
      key: 'integration',
      align: 'center',
      width: 140,
      render: (val: string | null) => val ?? NA,
    },
    {
      title: 'จำนวนรถเข้าชั่ง',
      dataIndex: 'totalVehicles',
      key: 'totalVehicles',
      align: 'center',
      width: 160,
    },
    {
      title: 'จำนวนรถน้ำหนักรวมเกิน',
      dataIndex: 'overweightTotal',
      key: 'overweightTotal',
      align: 'center',
      width: 200,
      render: (val: number) => (
        <span className={val > 0 ? 'text-orange-500' : 'text-white/25'}>{val}</span>
      ),
    },
    {
      title: 'จำนวนรถน้ำหนักเพลาเกิน',
      dataIndex: 'overweightAxle',
      key: 'overweightAxle',
      align: 'center',
      width: 210,
      render: (val: number) => (
        <span className={val > 0 ? 'text-orange-500' : 'text-white/25'}>{val}</span>
      ),
    },
    {
      title: 'จำนวนการยอมรับน้ำหนัก',
      dataIndex: 'acceptCount',
      key: 'acceptCount',
      align: 'center',
      width: 200,
      render: (val: number) => (
        <span className={val > 0 ? 'text-teal-400' : 'text-white/25'}>{val}</span>
      ),
    },
    {
      title: 'จำนวนการดำเนินคดี',
      dataIndex: 'prosecuteCount',
      key: 'prosecuteCount',
      align: 'center',
      width: 180,
      render: (val: number) => (
        <span className={val > 0 ? 'text-pink-500' : 'text-white/25'}>{val}</span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 120,
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
