"use client"
import React from 'react'
import { Empty, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbBulb, TbBulbOff, TbLink, TbUnlink } from 'react-icons/tb'
import { LAMP_FAULT_COLOR, LAMP_WORKING_COLOR } from '../data/mockLampData'
import type { LampRow } from '../data/lampRows'

interface Props {
  rows: LampRow[]
  loading?: boolean
  isError?: boolean
}

/** A lamp point runs to 414 lamps — page them like the IoT Monitor table. */
const PAGE_SIZE = 50

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

/** ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง — one row per lamp, from
 *  `/lighting/solutions/{solution_id}`. A column the API has no figure for —
 *  per-lamp status, connection, current, none sent yet — is left out rather
 *  than filled with dashes; it shows again once `lampRowsFromDevices` fills it. */
const LampEquipmentTable: React.FC<Props> = ({ rows, loading = false, isError = false }) => {
  const has = (field: 'isWorking' | 'isConnected' | 'current') => rows.some((row) => row[field] != null)
  const columns: ColumnsType<LampRow> = [
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
    // A lamp's own node id (a LoRa DevEUI) — not an IMEI, which only a
    // cabinet has.
    { title: 'รหัสอุปกรณ์', dataIndex: 'code', key: 'code', width: 180 },
    ...(has('isWorking') ? [{
      title: 'สถานะโคมไฟ', dataIndex: 'isWorking', key: 'isWorking', width: 170,
      render: (isWorking: boolean | null) => isWorking == null ? '-' : (
        <StatusPill
          ok={isWorking}
          label={isWorking ? 'ทำงาน' : 'ไม่ทำงาน'}
          icon={isWorking ? <TbBulb size={20} /> : <TbBulbOff size={20} />}
        />
      ),
    }] : []),
    ...(has('isConnected') ? [{
      title: 'การเชื่อมต่อ', dataIndex: 'isConnected', key: 'isConnected', width: 180,
      render: (isConnected: boolean | null) => isConnected == null ? '-' : (
        <StatusPill
          ok={isConnected}
          label={isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
          icon={isConnected ? <TbLink size={20} /> : <TbUnlink size={20} />}
        />
      ),
    }] : []),
    ...(has('current') ? [{
      title: 'กระแสไฟฟ้า (A)', dataIndex: 'current', key: 'current', width: 160,
      render: (current: number | null) => current == null ? '-' : current.toFixed(2),
    }] : []),
    { title: 'อัพเดตล่าสุด', dataIndex: 'updatedAt', key: 'updatedAt', width: 220 },
  ]

  return (
    <section className='mt-4 pb-5 flex flex-col gap-3'>
      <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
        ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง
      </h3>
      {rows.length === 0 ? (
        <div className='min-h-[220px] rounded-[20px] bg-[#191919] flex items-center justify-center'>
          {loading ? <Spin /> : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={isError ? 'โหลดข้อมูลรายโคมไม่สำเร็จ' : 'ยังไม่มีข้อมูลรายโคมจาก API'}
            />
          )}
        </div>
      ) : (
        <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
          <Table<LampRow>
            rowKey='key'
            columns={columns}
            dataSource={rows}
            pagination={rows.length > PAGE_SIZE ? { pageSize: PAGE_SIZE, showSizeChanger: false } : false}
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
