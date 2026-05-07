"use client"
import React from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type WeightStatusType = 'น้ำหนักปกติ' | 'น้ำหนักเกิน'
type FinalStatusType = 'น้ำหนักปกติ' | 'ยอมรับน้ำหนัก' | 'ดำเนินคดี'

interface DailyWeightRecord {
  key: string
  no: number
  date: string
  time: string
  plate: string
  vehicleType: string
  actualWeight: number
  stdWeight: number
  overweight: number
  vehicleImage: string
  slipImage: string
  statusWeight: WeightStatusType
  statusAxle: WeightStatusType
  status: FinalStatusType
}

const WEIGHT_STATUS_CLASS: Record<WeightStatusType, string> = {
  'น้ำหนักปกติ': 'border-(--yellow) text-(--yellow)',
  'น้ำหนักเกิน': 'border-orange-500 text-orange-500',
}

const FINAL_STATUS_CLASS: Record<FinalStatusType, string> = {
  'น้ำหนักปกติ': 'border-(--yellow) text-(--yellow)',
  'ยอมรับน้ำหนัก': 'border-teal-400 text-teal-400',
  'ดำเนินคดี': 'border-pink-500 text-pink-500',
}

const mockData: DailyWeightRecord[] = [
  {
    key: '1', no: 1,
    date: '20 เม.ย. 2569', time: '15:27:56 น.',
    plate: '82-9960 ร้อยเอ็ด',
    vehicleType: 'ประเภท 16 : รถพ่วง 6 เพลา 20 เส้น',
    actualWeight: 49.25, stdWeight: 50.00, overweight: 0.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักปกติ', statusAxle: 'น้ำหนักเกิน', status: 'ยอมรับน้ำหนัก',
  },
  {
    key: '2', no: 2,
    date: '20 เม.ย. 2569', time: '15:18:52 น.',
    plate: '81-8980 ร้อยเอ็ด',
    vehicleType: 'ประเภท 2 : 2 เพลา 6 เส้น',
    actualWeight: 13.60, stdWeight: 15.00, overweight: 0.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักปกติ', statusAxle: 'น้ำหนักปกติ', status: 'น้ำหนักปกติ',
  },
  {
    key: '3', no: 3,
    date: '20 เม.ย. 2569', time: '15:04:50 น.',
    plate: '70-3202 มุกดาหาร',
    vehicleType: 'ประเภท 11/4 : กึ่งพ่วง 6 เพลา 22 เส้น (KingPin 8)',
    actualWeight: 55.50, stdWeight: 50.50, overweight: 5.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักเกิน', statusAxle: 'น้ำหนักเกิน', status: 'ดำเนินคดี',
  },
  {
    key: '4', no: 4,
    date: '20 เม.ย. 2569', time: '14:44:03 น.',
    plate: '82-6556 ร้อยเอ็ด',
    vehicleType: 'ประเภท 5 : พ่วง 3 เพลา 10 เส้น',
    actualWeight: 22.65, stdWeight: 25.00, overweight: 0.00,
    vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    slipImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg',
    statusWeight: 'น้ำหนักปกติ', statusAxle: 'น้ำหนักปกติ', status: 'น้ำหนักปกติ',
  },
]

const StatusBadge = ({ label, cls }: { label: string; cls: string }) => (
  <span className={`inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border ${cls}`}>
    {label}
  </span>
)

const TableMobileDailyWeight: React.FC<Props> = () => {
  const columns: ColumnsType<DailyWeightRecord> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 70,
      fixed: 'left',
    },
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      align: 'center',
      width: 150,
      render: (_, record) => (
        <div>
          <p className='mb-0'>{record.date}</p>
          <p className='mb-0 text-white/60'>{record.time}</p>
        </div>
      ),
    },
    {
      title: 'ทะเบียนรถ',
      dataIndex: 'plate',
      key: 'plate',
      align: 'center',
      width: 150,
    },
    {
      title: 'ประเภทรถบรรทุก',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      align: 'center',
      width: 240,
    },
    {
      title: 'น้ำหนักที่ชั่งได้',
      dataIndex: 'actualWeight',
      key: 'actualWeight',
      align: 'center',
      width: 140,
      render: (value: number) => `${value.toFixed(2)} ตัน`,
    },
    {
      title: 'น้ำหนักตามกำหนด',
      dataIndex: 'stdWeight',
      key: 'stdWeight',
      align: 'center',
      width: 160,
      render: (value: number) => (
        <span className='text-(--yellow)'>{value.toFixed(2)} ตัน</span>
      ),
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'overweight',
      key: 'overweight',
      align: 'center',
      width: 130,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>
          {value.toFixed(2)} ตัน
        </span>
      ),
    },
    {
      title: 'ภาพรถบรรทุก',
      dataIndex: 'vehicleImage',
      key: 'vehicleImage',
      align: 'center',
      width: 130,
      render: (src: string) => (
        <Image src={src} width={100} height={60} className='rounded object-cover' alt='vehicle' />
      ),
    },
    {
      title: 'สลิปน้ำหนัก',
      dataIndex: 'slipImage',
      key: 'slipImage',
      align: 'center',
      width: 130,
      render: (src: string) => (
        <Image src={src} width={100} height={60} className='rounded object-cover' alt='slip' />
      ),
    },
    {
      title: 'สถานะน้ำหนักรวม',
      dataIndex: 'statusWeight',
      key: 'statusWeight',
      align: 'center',
      width: 150,
      render: (val: WeightStatusType) => (
        <StatusBadge label={val} cls={WEIGHT_STATUS_CLASS[val]} />
      ),
    },
    {
      title: 'สถานะเพลา',
      dataIndex: 'statusAxle',
      key: 'statusAxle',
      align: 'center',
      width: 140,
      render: (val: WeightStatusType) => (
        <StatusBadge label={val} cls={WEIGHT_STATUS_CLASS[val]} />
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (val: FinalStatusType) => (
        <StatusBadge label={val} cls={FINAL_STATUS_CLASS[val]} />
      ),
    },
  ]

  return (
    <Table<DailyWeightRecord>
      columns={columns}
      dataSource={mockData}
      pagination={false}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableMobileDailyWeight)
