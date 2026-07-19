"use client"
import React, { useMemo, useState } from 'react'
import { Button, ConfigProvider, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbBulb, TbBulbOff, TbLink, TbLinkOff, TbPrinter } from 'react-icons/tb'
import type { LampConnection, LampEquipmentRow, LampEquipStatus } from '../data/lampEquipment'
import { LAMP_EQUIPMENT_ROWS } from '../data/lampEquipment'

type FilterKey = 'all' | 'up' | 'down'

const SUMMARY_STATS = [
  { key: 'all' as const, label: 'ทั้งหมด', color: '#FCD116', variant: 'filled' as const },
  { key: 'up' as const, label: 'UP', color: '#66AEFF', variant: 'outlined' as const },
  { key: 'down' as const, label: 'DOWN', color: '#E94C4C', variant: 'outlined' as const },
]

const StatusPill = ({
  color,
  icon,
  label,
}: {
  color: string
  icon: React.ReactNode
  label: string
}) => (
  <span
    className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {label}
  </span>
)

const LampStatusBadge = ({ status }: { status: LampEquipStatus }) => {
  const isUp = status === 'up'
  const color = isUp ? '#66AEFF' : '#E94C4C'
  return (
    <StatusPill
      color={color}
      icon={isUp ? <TbBulb size={14} /> : <TbBulbOff size={14} />}
      label={isUp ? 'ทำงาน' : 'ไม่ทำงาน'}
    />
  )
}

const ConnectionBadge = ({ connection }: { connection: LampConnection }) => {
  const isConnected = connection === 'connected'
  const color = isConnected ? '#66AEFF' : '#E94C4C'
  return (
    <StatusPill
      color={color}
      icon={isConnected ? <TbLink size={14} /> : <TbLinkOff size={14} />}
      label={isConnected ? 'เชื่อมต่อ' : 'ไม่เชื่อมต่อ'}
    />
  )
}

const LampEquipmentTable: React.FC = () => {
  const [filter, setFilter] = useState<FilterKey>('all')

  const counts = useMemo(() => ({
    all: LAMP_EQUIPMENT_ROWS.length,
    up: LAMP_EQUIPMENT_ROWS.filter((r) => r.lampStatus === 'up').length,
    down: LAMP_EQUIPMENT_ROWS.filter((r) => r.lampStatus === 'down').length,
  }), [])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return LAMP_EQUIPMENT_ROWS
    return LAMP_EQUIPMENT_ROWS.filter((r) => r.lampStatus === filter)
  }, [filter])

  const columns: ColumnsType<LampEquipmentRow> = useMemo(
    () => [
      {
        title: 'ลำดับโคม',
        dataIndex: 'no',
        key: 'no',
        align: 'center',
        width: 100,
        render: (v: number) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'IMEI',
        dataIndex: 'imei',
        key: 'imei',
        align: 'center',
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
      {
        title: 'สถานะโคมไฟ',
        dataIndex: 'lampStatus',
        key: 'lampStatus',
        align: 'center',
        width: 140,
        render: (s: LampEquipStatus) => <LampStatusBadge status={s} />,
      },
      {
        title: 'การเชื่อมต่อ',
        dataIndex: 'connection',
        key: 'connection',
        align: 'center',
        width: 140,
        render: (c: LampConnection) => <ConnectionBadge connection={c} />,
      },
      {
        title: 'กระแสไฟฟ้า (A)',
        dataIndex: 'amp',
        key: 'amp',
        align: 'center',
        width: 120,
        render: (v: number | null) => (
          <span className='text-white'>{v != null ? v.toFixed(2) : '-'}</span>
        ),
      },
      {
        title: 'อัปเดตล่าสุด',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        align: 'center',
        width: 200,
        render: (v: string) => <span className='text-white'>{v}</span>,
      },
    ],
    [],
  )

  return (
    <section className='mt-4 pb-5 flex flex-col gap-3'>
      <h3 className='text-[#FCD116] text-base sm:text-lg font-bold m-0'>
        ตารางข้อมูลอุปกรณ์แต่ละจุดติดตั้ง
      </h3>

      <div className='flex flex-row flex-wrap items-center gap-2'>
        {SUMMARY_STATS.map((stat) => {
          const isActive = filter === stat.key
          const filled = isActive
          return (
            <button
              key={stat.key}
              type='button'
              onClick={() => setFilter(stat.key)}
              className='box-border flex flex-row items-center justify-between rounded-[10px] px-2 w-[calc(50%-4px)] min-w-[110px] max-w-[130px] sm:w-[130px] h-[46px] cursor-pointer'
              style={{
                ...(filled
                  ? { background: stat.color, border: `2px solid ${stat.color}` }
                  : { background: 'transparent', border: `2px solid ${stat.color}` }),
              }}
            >
              <span
                className='text-[12px] font-normal m-0 leading-none shrink-0'
                style={{ color: filled ? '#212121' : stat.color }}
              >
                {stat.label}
              </span>
              <span
                className='flex items-center justify-center text-[14px] font-normal m-0 leading-none shrink-0 rounded-[5px]'
                style={{
                  width: 50,
                  height: 30,
                  ...(filled
                    ? { background: '#212121', color: stat.color }
                    : { background: stat.color, color: '#212121' }),
                }}
              >
                {counts[stat.key]}
              </span>
            </button>
          )
        })}

        <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
          <Button
            type='primary'
            size='small'
            icon={<TbPrinter />}
            onClick={() => alert('TODO: นำออกเอกสาร')}
            className='w-[130px]! h-[27px]! rounded-[88px]! px-2! text-xs! inline-flex! items-center! justify-center! ml-auto'
          >
            นำออกเอกสาร
          </Button>
        </ConfigProvider>
      </div>

      <div className='w-full min-w-0 overflow-x-auto overflow-y-hidden'>
        <Table<LampEquipmentRow>
          rowKey='key'
          columns={columns}
          dataSource={filteredRows}
          pagination={false}
          size='middle'
          className='bridge-projects-table lamp-equipment-table'
          locale={{ emptyText: 'ไม่พบข้อมูล' }}
        />
      </div>
    </section>
  )
}

export default React.memo(LampEquipmentTable)
