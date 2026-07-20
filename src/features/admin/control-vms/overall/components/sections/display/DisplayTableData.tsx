"use client"
import React from 'react'
import { Table, Badge } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { SettingByRoad } from '@/types/control-vms/display-api'
import dayjs from 'dayjs'
import StatusPill from '@/features/admin/vms-command-center/components/StatusPill'

interface Props {
  data: SettingByRoad[];
}

const columns: ColumnsType<SettingByRoad> = [
  {
    title: 'จุดติดตั้ง',
    dataIndex: 'solution_name',
    key: 'solution_name',
    width: 260,
    render: (value) => {
      if (value) return value
      return '-'
    }
  },
  {
    title: 'หมวดหมู่',
    dataIndex: 'setting_type_name',
    key: 'setting_type_name',
    align: 'center',
    width: 130,
    render: (value) => {
      if (value) return value
      return '-'
    }
  },
  {
    title: 'ประเภทเนื้อหา',
    dataIndex: 'settings_content',
    key: 'settings_content',
    align: 'center',
    width: 140,
    render: (value) => {
      if (value) return value
      return '-'
    }
  },
  {
    title: 'วันที่เริ่มต้น',
    dataIndex: 'start_date',
    key: 'start_date',
    align: 'center',
    width: 170,
    render: (value: string) => {
      if (value) return <span className='whitespace-pre-line'>{dayjs(value).format('DD MMM BBBB')}</span>
      return '-'
    },
  },
  {
    title: 'วันที่สิ้นสุด',
    dataIndex: 'end_date',
    key: 'end_date',
    align: 'center',
    width: 170,
    render: (value: string) => {
      if (value) return <span className='whitespace-pre-line'>{dayjs(value).format('DD MMM BBBB')}</span>
      return '-'
    },
  },
  {
    title: 'แสดงผล',
    dataIndex: 'display_hour',
    key: 'display_hour',
    align: 'center',
    width: 120,
    render: (value: string) => {
      if (value) return <span className='text-(--yellow)'>{value}</span>
      return '-'
    },
  },
  {
    title: 'สถานะการแสดงผล',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: 150,
    render: (_: unknown, record: SettingByRoad) => {
      if (record?.status != null) return <StatusPill status={record.status} size='sm' />
      return '-'
    },
  },
  {
    title: 'การเชื่อมต่อ',
    dataIndex: 'is_online',
    key: 'is_online',
    align: 'center',
    width: 130,
    fixed: 'right',
    render: (_: unknown, record: SettingByRoad) => {
      if (record) return (
        <span
          className={`inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border ${record.is_online ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}
          title='สถานะการเชื่อมต่อของฮาร์ดแวร์ป้าย (คนละอันกับสถานะการแสดงผล)'
        >
          {record.is_online ? <TbWifi /> : <TbWifiOff />}
          {record.is_online ? 'ออนไลน์' : 'ออฟไลน์'}
          <Badge color={record.is_online ? 'green' : 'red'} />
        </span>
      )
      return '-'
    },
  },
]

const DisplayTableData: React.FC<Props> = (props) => {
  const { data } = props

  return (
    <Table<SettingByRoad>
      columns={columns}
      dataSource={data}
      pagination={false}
      size="middle"
      rowKey={(record) => `${record.solution_name ?? ''}-${record.start_date ?? ''}-${record.end_date ?? ''}-${record.display_hour ?? ''}-${record.settings_content ?? ''}-${data.indexOf(record)}`}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(DisplayTableData)
