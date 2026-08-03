"use client"
import React from 'react'
import { Image, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Props { }

type ActionType = 'เปลี่ยนข้อความ' | 'ข้อผิดพลาด'

export interface ControlRecord {
  key: string
  no: number
  date: string
  time: string
  actionType: ActionType
  signName: string
  message: string
  ipAddress: string
  image: string
}

const ACTION_CLASS: Record<ActionType, string> = {
  'เปลี่ยนข้อความ': 'border-yellow-500 text-yellow-500',
  'ข้อผิดพลาด': 'border-red-500 text-red-500',
}

const PLACEHOLDER = 'https://static.beebom.com/wp-content/uploads/2026/02/Sparkle-and-Sparxie-relation-explained.jpg'

// Exported so the parent ControlSection can feed the SAME rows the table
// renders into the นำออกเอกสาร (PDF/Excel) export — still mock data for now.
export const CONTROL_MOCK_ROWS: ControlRecord[] = [
  {
    key: '1',
    no: 1,
    date: '20 เม.ย. 2569',
    time: '18:14:21 น.',
    actionType: 'เปลี่ยนข้อความ',
    signName: 'CAM-F03B-VMS-กม.6+300',
    message: 'ระวังอุบัติเหตุ ลดความเร็ว',
    ipAddress: '10.101.27.1',
    image: PLACEHOLDER,
  },
  {
    key: '2',
    no: 2,
    date: '20 เม.ย. 2569',
    time: '12:48:02 น.',
    actionType: 'เปลี่ยนข้อความ',
    signName: 'CAM-B01-VMS-กม.6+300',
    message: 'ทางปิด โปรดใช้เส้นทางอื่น',
    ipAddress: '10.101.27.2',
    image: PLACEHOLDER,
  },
  {
    key: '3',
    no: 3,
    date: '20 เม.ย. 2569',
    time: '12:10:58 น.',
    actionType: 'ข้อผิดพลาด',
    signName: '68SET-PKT3033-B001-กม.1+400',
    message: 'Connection timeout',
    ipAddress: '10.101.27.3',
    image: PLACEHOLDER,
  },
  {
    key: '4',
    no: 4,
    date: '20 เม.ย. 2569',
    time: '12:07:01 น.',
    actionType: 'เปลี่ยนข้อความ',
    signName: 'CAM-F03B-VMS-กม.6+300',
    message: 'ระวังรถบรรทุกขนาดใหญ่',
    ipAddress: '10.101.27.1',
    image: PLACEHOLDER,
  },
]

const TableControlData: React.FC<Props> = () => {
  const columns: ColumnsType<ControlRecord> = [
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
      render: (_, r) => (
        <div>
          <p className='mb-0'>{r.date}</p>
          <p className='mb-0 text-white/60'>{r.time}</p>
        </div>
      ),
    },
    {
      title: 'ประเภทการดำเนินการ',
      dataIndex: 'actionType',
      key: 'actionType',
      align: 'center',
      width: 220,
      render: (t: ActionType) => (
        <span className={`inline-block py-0.5 px-3 rounded-full fs-12 whitespace-nowrap border ${ACTION_CLASS[t]}`}>
          {t}
        </span>
      ),
    },
    {
      title: 'ชื่อป้าย',
      dataIndex: 'signName',
      key: 'signName',
      width: 300,
    },
    {
      title: 'ข้อความ/รายละเอียด',
      dataIndex: 'message',
      key: 'message',
      width: 240,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      align: 'center',
      width: 140,
    },
    {
      title: 'ภาพ',
      dataIndex: 'image',
      key: 'image',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (src: string) => (
        <Image
          src={src}
          width={100}
          height={60}
          className='rounded object-cover'
          alt='vms'
        />
      ),
    },
  ]

  return (
    <Table<ControlRecord>
      columns={columns}
      dataSource={CONTROL_MOCK_ROWS}
      pagination={{
        pageSize: 10,
        total: 31,
        showTotal: (total, range) => `${range[1] - range[0] + 1} จาก ${total}`,
      }}
      size='middle'
      rowKey='key'
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableControlData)
