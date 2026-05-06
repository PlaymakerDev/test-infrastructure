"use client"
import React from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type StatusType = 'น้ำหนักปกติ' | 'น้ำหนักเกิน'

interface DailyWeightRecord {
  key: string
  date: string
  time: string
  plate: string
  vehicleType: string
  actualWeight: number
  stdWeight: number
  overweight: number
  speed: number
  plateImage: string
  vehicleImage: string
  status: StatusType
}

const STATUS_CLASS: Record<StatusType, string> = {
  'น้ำหนักปกติ': 'border-(--yellow) text-(--yellow)',
  'น้ำหนักเกิน': 'border-red-500 text-red-500',
}

const mockData: DailyWeightRecord[] = [
  { key: '1', date: '22 มี.ค. 2569', time: '12:56:27 น.', plate: 'ยอ8299 เชียงใหม่', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 7.800, stdWeight: 9.500, overweight: 0.000, speed: 59.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '2', date: '22 มี.ค. 2569', time: '12:53:13 น.', plate: 'งบ5682 เชียงใหม่', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 2.200, stdWeight: 9.500, overweight: 0.000, speed: 85.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '3', date: '22 มี.ค. 2569', time: '12:52:48 น.', plate: 'ผอ9711 เชียงใหม่', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 1.900, stdWeight: 9.500, overweight: 0.000, speed: 67.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '4', date: '22 มี.ค. 2569', time: '12:50:21 น.', plate: '835174 เชียงใหม่', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 4.200, stdWeight: 9.500, overweight: 0.000, speed: 81.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '5', date: '22 มี.ค. 2569', time: '12:48:12 น.', plate: '831267 เชียงใหม่', vehicleType: 'ประเภท 16 : รถพ่วง 6 เพลา 20 เส้น', actualWeight: 53.000, stdWeight: 50.500, overweight: 2.500, speed: 56.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักเกิน' },
  { key: '6', date: '22 มี.ค. 2569', time: '12:43:29 น.', plate: '818338 แพร่', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 10.000, stdWeight: 9.500, overweight: 0.500, speed: 55.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักเกิน' },
  { key: '7', date: '22 มี.ค. 2569', time: '12:40:49 น.', plate: 'ผน3784 เชียงใหม่', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 2.200, stdWeight: 9.500, overweight: 0.000, speed: 56.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '8', date: '22 มี.ค. 2569', time: '12:38:58 น.', plate: '307283 เชียงใหม่', vehicleType: 'ประเภท 2 : 2 เพลา 6 เส้น', actualWeight: 15.000, stdWeight: 10.000, overweight: 0.000, speed: 86.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '9', date: '22 มี.ค. 2569', time: '12:33:02 น.', plate: 'โยค9504 กรุงเทพมหานคร', vehicleType: 'ประเภท 1 : 2 เพลา 4 เส้น', actualWeight: 1.600, stdWeight: 9.500, overweight: 0.000, speed: 101.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
  { key: '10', date: '22 มี.ค. 2569', time: '12:30:47 น.', plate: '818817 แพร่', vehicleType: 'ประเภท 10 : กึ่งพ่วง 5 เพลา 18 เส้น', actualWeight: 37.000, stdWeight: 45.000, overweight: 0.000, speed: 66.00, plateImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', vehicleImage: 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg', status: 'น้ำหนักปกติ' },
]

const TableOverallDailyWeight: React.FC<Props> = () => {
  const columns: ColumnsType<DailyWeightRecord> = [
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      align: 'center',
      width: 140,
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
      width: 160,
    },
    {
      title: 'ประเภทรถ',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      align: 'center',
      width: 220,
    },
    {
      title: 'น้ำหนักที่ชั่งได้',
      dataIndex: 'actualWeight',
      key: 'actualWeight',
      align: 'center',
      width: 140,
      render: (value: number) => `${value.toFixed(3)} ตัน`,
    },
    {
      title: 'น้ำหนักตามกำหนด',
      dataIndex: 'stdWeight',
      key: 'stdWeight',
      align: 'center',
      width: 160,
      render: (value: number) => (
        <span className='text-(--yellow)'>{value.toFixed(3)} ตัน</span>
      ),
    },
    {
      title: 'น้ำหนักเกิน',
      dataIndex: 'overweight',
      key: 'overweight',
      align: 'center',
      width: 130,
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : 'text-white/25'}>{value.toFixed(3)} ตัน</span>
      ),
    },
    {
      title: 'ความเร็ว',
      dataIndex: 'speed',
      key: 'speed',
      align: 'center',
      width: 120,
      render: (value: number) => `${value.toFixed(2)} กม./ชม.`,
    },
    {
      title: 'ภาพป้ายทะเบียน',
      dataIndex: 'plateImage',
      key: 'plateImage',
      align: 'center',
      width: 130,
      render: (src: string) => (
        <Image src={src} width={100} height={60} className='rounded object-cover' alt='plate' />
      ),
    },
    {
      title: 'ภาพลักษณะรถ',
      dataIndex: 'vehicleImage',
      key: 'vehicleImage',
      align: 'center',
      width: 130,
      render: (src: string) => (
        <Image src={src} width={100} height={60} className='rounded object-cover' alt='vehicle' />
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 130,
      fixed: 'right',
      render: (status: StatusType) => (
        <span className={`inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border ${STATUS_CLASS[status]}`}>
          {status}
        </span>
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

export default React.memo<Props>(TableOverallDailyWeight)
