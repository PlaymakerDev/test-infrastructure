"use client"
import React from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type EventType = 'รถฝ่าฝืนสัญญาณไฟทางข้าม' | 'คนฝ่าฝืนสัญญาณไฟทางข้าม'

interface ViolationRecord {
  key: string
  no: number
  date: string
  time: string
  eventType: EventType
  camera: string
  ipAddress: string
  image: string
}

const EVENT_CLASS: Record<EventType, string> = {
  'รถฝ่าฝืนสัญญาณไฟทางข้าม': 'border-orange-500 text-orange-500',
  'คนฝ่าฝืนสัญญาณไฟทางข้าม': 'border-red-500 text-red-500',
}

const PLACEHOLDER = 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg'

const mockData: ViolationRecord[] = [
  { key: '1', no: 1, date: '20 เม.ย. 2569', time: '18:14:21 น.', eventType: 'รถฝ่าฝืนสัญญาณไฟทางข้าม', camera: '67FTD-SPK2001-F002จุดที่2-กม.1+020-มุ่งหน้าบางบา-ตราด', ipAddress: '10.101.27.2', image: PLACEHOLDER },
  { key: '2', no: 2, date: '20 เม.ย. 2569', time: '12:48:02 น.', eventType: 'คนฝ่าฝืนสัญญาณไฟทางข้าม', camera: '67FTD-SPK2001-F004-จุดที่2-กม.1+020-มุ่งหน้าลาดกระบัง', ipAddress: '10.101.27.4', image: PLACEHOLDER },
  { key: '3', no: 3, date: '20 เม.ย. 2569', time: '12:10:58 น.', eventType: 'คนฝ่าฝืนสัญญาณไฟทางข้าม', camera: '67FTD-SPK2001-F005-จุดที่2-กม.1+020-มุ่งหน้าบางบา-ตราด', ipAddress: '10.101.27.3', image: PLACEHOLDER },
  { key: '4', no: 4, date: '20 เม.ย. 2569', time: '12:07:01 น.', eventType: 'รถฝ่าฝืนสัญญาณไฟทางข้าม', camera: '67FTD-SPK2001-F002จุดที่2-กม.1+020-มุ่งหน้าบางบา-ตราด', ipAddress: '10.101.27.2', image: PLACEHOLDER },
]

const TableViolationData: React.FC<Props> = () => {
  const columns: ColumnsType<ViolationRecord> = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      align: 'center',
      width: 80,
    },
    {
      title: 'วันที่และเวลา',
      key: 'datetime',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <div>
          <p className='mb-0'>{record.date}</p>
          <p className='mb-0 text-white/60'>{record.time}</p>
        </div>
      ),
    },
    {
      title: 'ประเภทเหตุการณ์',
      dataIndex: 'eventType',
      key: 'eventType',
      align: 'center',
      width: 240,
      render: (type: EventType) => (
        <span className={`inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border ${EVENT_CLASS[type]}`}>
          {type}
        </span>
      ),
    },
    {
      title: 'กล้อง',
      dataIndex: 'camera',
      key: 'camera',
      width: 400,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      align: 'center',
      width: 140,
    },
    {
      title: 'ภาพเหตุการณ์',
      dataIndex: 'image',
      key: 'image',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (src: string) => (
        <Image src={src} width={100} height={60} className='rounded object-cover' alt='event' />
      ),
    },
  ]

  return (
    <Table<ViolationRecord>
      columns={columns}
      dataSource={mockData}
      pagination={{ pageSize: 10, total: 61, showTotal: (total, range) => `${range[1] - range[0] + 1} จาก ${total}` }}
      size="middle"
      rowKey="key"
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableViolationData)
