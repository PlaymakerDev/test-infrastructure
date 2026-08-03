"use client"
import React from 'react'
import { Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbBulb, TbBulbOff, TbLink, TbUnlink } from 'react-icons/tb'
import {
  LAMP_FAULT_COLOR,
  LAMP_WORKING_COLOR,
  type MockLampRow,
} from '../data/mockLampData'

interface Props {
  rows: MockLampRow[]
}

/** Outlined pill used by both status columns — icon + label in the state
 *  colour, matching the 27px-high rounded tags in the design. */
const StatusPill: React.FC<{ ok: boolean; label: string; icon: React.ReactNode }> = ({ ok, label, icon }) => {
  const color = ok ? LAMP_WORKING_COLOR : LAMP_FAULT_COLOR
  return (
    <span
      className='inline-flex items-center justify-center gap-[3px] whitespace-nowrap'
      style={{
        height: 27,
        padding: '4px 10px',
        border: `1px solid ${color}`,
        borderRadius: 88,
        color,
      }}
    >
      {icon}
      {label}
    </span>
  )
}

/** ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง — one row per lamp. Rows come from
 *  `mockLampData`; see the warning there before shipping. */
const LampEquipmentTable: React.FC<Props> = ({ rows }) => {
  const columns: ColumnsType<MockLampRow> = [
    {
      title: 'ลำดับโคม',
      dataIndex: 'order',
      key: 'order',
      width: 120,
      // Keep the heading and row values aligned, but inset them a little more
      // from the left edge of this narrow column.
      onHeaderCell: () => ({ style: { paddingLeft: 28 } }),
      onCell: () => ({ style: { paddingLeft: 28 } }),
    },
    { title: 'IMEI', dataIndex: 'code', key: 'code', width: 160 },
    {
      title: 'สถานะโคมไฟ', dataIndex: 'isWorking', key: 'isWorking', width: 170,
      render: (isWorking: boolean) => (
        <StatusPill
          ok={isWorking}
          label={isWorking ? 'ทำงาน' : 'ไม่ทำงาน'}
          icon={isWorking ? <TbBulb size={20} /> : <TbBulbOff size={20} />}
        />
      ),
    },
    {
      title: 'การเชื่อมต่อ', dataIndex: 'isConnected', key: 'isConnected', width: 180,
      render: (isConnected: boolean) => (
        <StatusPill
          ok={isConnected}
          label={isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
          icon={isConnected ? <TbLink size={20} /> : <TbUnlink size={20} />}
        />
      ),
    },
    {
      title: 'กระแสไฟฟ้า (A)', dataIndex: 'current', key: 'current', width: 160,
      render: (current: number) => current.toFixed(2),
    },
    { title: 'อัพเดตล่าสุด', dataIndex: 'updatedAt', key: 'updatedAt', width: 220 },
  ]

  return (
    <section className='mt-4 pb-5 flex flex-col gap-3'>
      <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
        ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง
      </h3>
      {rows.length === 0 ? (
        <div className='min-h-[220px] rounded-[20px] bg-[#191919] flex items-center justify-center'>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='ยังไม่มีข้อมูลรายโคมจาก API'
          />
        </div>
      ) : (
        <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
          <Table<MockLampRow>
            rowKey='key'
            columns={columns}
            dataSource={rows}
            pagination={false}
            size='middle'
            tableLayout='fixed'
            className='bridge-projects-table event-log-table incident-event-log-table'
          />
        </div>
      )}
    </section>
  )
}

export default React.memo(LampEquipmentTable)
