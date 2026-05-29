"use client"
import React from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props {}

type EventType = 'ขับรถย้อนศร' | 'รถจอดกีดขวาง' | 'อุบัติเหตุ'

interface EventRecord {
  key: string; no: number; date: string; time: string
  eventType: EventType; camera: string; ipAddress: string; image: string
}

const EVENT_CLASS: Record<EventType, string> = {
  'ขับรถย้อนศร': 'border-red-500 text-red-500',
  'รถจอดกีดขวาง': 'border-orange-500 text-orange-500',
  'อุบัติเหตุ': 'border-yellow-500 text-yellow-500',
}

const PLACEHOLDER = 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg'

const mockData: EventRecord[] = [
  { key: '1', no: 1, date: '20 เม.ย. 2569', time: '18:14:21 น.', eventType: 'ขับรถย้อนศร', camera: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550', ipAddress: '10.12.7.3', image: PLACEHOLDER },
  { key: '2', no: 2, date: '20 เม.ย. 2569', time: '12:48:02 น.', eventType: 'รถจอดกีดขวาง', camera: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850', ipAddress: '10.12.2.1', image: PLACEHOLDER },
  { key: '3', no: 3, date: '20 เม.ย. 2569', time: '12:10:58 น.', eventType: 'รถจอดกีดขวาง', camera: '68SET-CCO4050-FAI012-จุดที่8-กม.10+550', ipAddress: '10.12.7.3', image: PLACEHOLDER },
  { key: '4', no: 4, date: '20 เม.ย. 2569', time: '10:22:15 น.', eventType: 'อุบัติเหตุ', camera: '68FTD-NPM3015-FAI052-จุดที่26-กม.13+850', ipAddress: '10.12.2.1', image: PLACEHOLDER },
]

const TableEventData: React.FC<Props> = () => {
  const columns: ColumnsType<EventRecord> = [
    { title: 'ลำดับ', dataIndex: 'no', key: 'no', align: 'center', width: 80 },
    { title: 'วันที่และเวลา', key: 'datetime', align: 'center', width: 160, render: (_, r) => <div><p className='mb-0'>{r.date}</p><p className='mb-0 text-white/60'>{r.time}</p></div> },
    { title: 'ประเภทเหตุการณ์', dataIndex: 'eventType', key: 'eventType', align: 'center', width: 200, render: (t: EventType) => <span className={`inline-block py-0.5 px-3 rounded-full text-xs whitespace-nowrap border ${EVENT_CLASS[t]}`}>{t}</span> },
    { title: 'กล้อง', dataIndex: 'camera', key: 'camera', width: 400 },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', align: 'center', width: 140 },
    { title: 'ภาพเหตุการณ์', dataIndex: 'image', key: 'image', align: 'center', width: 140, fixed: 'right', render: (src: string) => <Image src={src} width={100} height={60} className='rounded object-cover' alt='event' /> },
  ]

  return <Table<EventRecord> columns={columns} dataSource={mockData} pagination={{ pageSize: 10, total: 77, showTotal: (total, range) => `${range[1] - range[0] + 1} จาก ${total}` }} size='middle' rowKey='key' scroll={{ x: 'max-content' }} />
}

export default React.memo<Props>(TableEventData)
