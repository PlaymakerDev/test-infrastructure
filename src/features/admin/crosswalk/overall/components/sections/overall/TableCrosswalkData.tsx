"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface Props { }

type GuaranteeType = 'ไม่ค้ำ' | 'หมดค้ำ'
type StatusType = 'ออนไลน์' | 'ออฟไลน์'

interface CrosswalkEntry {
  id: string
  bureau: string
  roadCode: string
  projectName: string
  contractNo: string
  guarantee: GuaranteeType
  installPoint: string
  status: StatusType
  totalCameras: number
  onlineCount: number
  offlineCount: number
}

const rawData: CrosswalkEntry[] = [
  {
    id: 'sp2001-1', bureau: 'ส่วนกลาง', roadCode: 'สป.2001',
    projectName: 'โครงการงานบำรุงรักษาสาย สป.2001 แยกทางหลวงหมายเลข 34 - บ้านลาดกระบัง อำเภอบางพลี,บางเสาธง จังหวัดสมุทรปราการ จำนวน 1 แห่ง',
    contractNo: 'คค 0709/29/2567', guarantee: 'ไม่ค้ำ',
    installPoint: 'ทางข้าม >> สป.2001 กม.1+020', status: 'ออนไลน์',
    totalCameras: 4, onlineCount: 4, offlineCount: 0,
  },
  {
    id: 'sp2001-2', bureau: 'ส่วนกลาง', roadCode: 'สป.2001',
    projectName: 'โครงการงานบำรุงรักษาสาย สป.2001 แยกทางหลวงหมายเลข 34 - บ้านลาดกระบัง อำเภอบางพลี,บางเสาธง จังหวัดสมุทรปราการ จำนวน 1 แห่ง',
    contractNo: 'คค 0809/29/2567', guarantee: 'ไม่ค้ำ',
    installPoint: 'ทางข้าม >> สป.2001 กม.1+447', status: 'ออนไลน์',
    totalCameras: 4, onlineCount: 4, offlineCount: 0,
  },
  {
    id: 'sp4009-1', bureau: 'ส่วนกลาง', roadCode: 'สป.4009',
    projectName: 'โครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย สป.4009 แยกทางหลวงหมายเลข 3344 – ถนนสุนุวิก อ.เมือง จ.สมุทรปราการ 1 แห่ง',
    contractNo: 'สอ.26/2567', guarantee: 'หมดค้ำ',
    installPoint: 'ทางข้าม >> สป.4009 จุดที่ 1', status: 'ออฟไลน์',
    totalCameras: 4, onlineCount: 4, offlineCount: 0,
  },
  {
    id: 'cn1003-1', bureau: 'สทช.3 ชลบุรี', roadCode: 'ชน.1003',
    projectName: 'โครงการปรับปรุงงาน งานบำรุงรักษาสาย ชน.1003 แยกทางหลวงหมายเลข เลย 3 – บ้านเขาชีธรรม อำเภอสัตหีบ จังหวัดชลบุรี จำนวน 1 แห่ง',
    contractNo: '42/2566', guarantee: 'หมดค้ำ',
    installPoint: 'ทางข้าม >> ชน.1003 กม.5+420', status: 'ออฟไลน์',
    totalCameras: 2, onlineCount: 0, offlineCount: 2,
  },
  {
    id: 'cn1032-1', bureau: 'สทช.3 ชลบุรี', roadCode: 'ชน.1032',
    projectName: 'โครงการปรับปรุงงาน งานบำรุงรักษาสาย ชน.1003 แยกทางหลวงหมายเลข เลย 3 – บ้านเขาชีธรรม อำเภอสัตหีบ จังหวัดชลบุรี จำนวน 1 แห่ง',
    contractNo: 'WO2024080041', guarantee: 'หมดค้ำ',
    installPoint: 'ทางข้าม >> ชน.1032', status: 'ออฟไลน์',
    totalCameras: 4, onlineCount: 0, offlineCount: 4,
  },
  {
    id: 'cc3001-1', bureau: 'สทช.13 ฉะเชิงเทรา', roadCode: 'ฉช.3001',
    projectName: 'จ้างก่อสร้างปรับปรุงงาน งานบำรุงรักษาสาย ฉช.3001 แยกทางหลวงหมายเลข 314 – บ้านลาดกระบัง (ตอนสมุทรปราการ) อ.บางน้ำ อ.สมุทรปราการ',
    contractNo: 'ขทช.สป.19/2567', guarantee: 'ไม่ค้ำ',
    installPoint: 'ทางข้าม >> ฉช.3001', status: 'ออนไลน์',
    totalCameras: 10, onlineCount: 6, offlineCount: 4,
  },
]

const CountBadge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  if (value === 0) return <span className='text-white/30'>{value}</span>
  return (
    <span
      className='inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded font-semibold'
      style={{ background: color, color: '#212121' }}
    >
      {value}
    </span>
  )
}

const GuaranteePill: React.FC<{ guarantee: GuaranteeType }> = ({ guarantee }) => {
  const color = guarantee === 'ไม่ค้ำ' ? '#05F2DB' : '#979797'
  return (
    <span
      className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {guarantee}
    </span>
  )
}

const StatusPill: React.FC<{ status: StatusType }> = ({ status }) => {
  const isOnline = status === 'ออนไลน์'
  const color = isOnline ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
      {status}
    </span>
  )
}

type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'entry'; id: string; entry: CrosswalkEntry; roadCodeRowSpan: number }

const TOTAL_COLS = 9

const buildRows = (entries: CrosswalkEntry[]): Row[] => {
  const groups = new Map<string, CrosswalkEntry[]>()
  for (const e of entries) {
    const list = groups.get(e.bureau) ?? []
    list.push(e)
    groups.set(e.bureau, list)
  }
  const rows: Row[] = []
  for (const [bureau, items] of groups) {
    rows.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })
    let i = 0
    while (i < items.length) {
      const currentCode = items[i].roadCode
      let span = 1
      while (i + span < items.length && items[i + span].roadCode === currentCode) {
        span++
      }
      for (let j = 0; j < span; j++) {
        rows.push({ kind: 'entry', id: items[i + j].id, entry: items[i + j], roadCodeRowSpan: j === 0 ? span : 0 })
      }
      i += span
    }
  }
  return rows
}

const TableCrosswalkData: React.FC<Props> = () => {
  const data = useMemo(() => buildRows(rawData), [])
  const router = useRouter()

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      width: 130,
      onCell: (row) => {
        if (row.kind === 'bureau') return { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
        return { rowSpan: row.roadCodeRowSpan }
      },
      render: (_: unknown, row: Row) => {
        if (row.kind === 'bureau') {
          return (
            <div className='flex items-center gap-3'>
              <span className='text-white font-bold'>{row.bureau}</span>
              <span
                className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
                style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}
              >
                {row.count} โครงการ
              </span>
            </div>
          )
        }
        return <span className='font-medium'>{row.entry.roadCode}</span>
      },
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => row.kind === 'entry' ? row.entry.projectName : null,
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 200,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.kind !== 'entry') return null
        return (
          <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            {row.entry.contractNo}
            <TbInfoSquareRoundedFilled size={18} className='text-white/50 cursor-pointer hover:text-(--yellow)' />
          </span>
        )
      },
    },
    {
      title: 'การค้ำประกัน',
      key: 'guarantee',
      width: 130,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => row.kind === 'entry' ? <GuaranteePill guarantee={row.entry.guarantee} /> : null,
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 260,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => row.kind === 'entry' ? row.entry.installPoint : null,
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 140,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => row.kind === 'entry' ? <StatusPill status={row.entry.status} /> : null,
    },
    {
      title: 'กล้องทั้งหมด',
      key: 'totalCameras',
      width: 120,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'entry' ? <span className='font-semibold'>{row.entry.totalCameras}</span> : null,
    },
    {
      title: 'ออนไลน์',
      key: 'onlineCount',
      width: 110,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'entry' ? <CountBadge value={row.entry.onlineCount} color='#66AEFF' /> : null,
    },
    {
      title: 'ออฟไลน์',
      key: 'offlineCount',
      width: 110,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'entry' ? <CountBadge value={row.entry.offlineCount} color='#E94C4C' /> : null,
    },
  ], [])

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      scroll={{ x: 1400 }}
      onRow={() => {
        return {
          onClick: () => router.push(`/admin/crosswalk/detail/EXAMPLE_CROSSWALK_ID`),
          className: 'cursor-pointer',
        }
      }}
    />
  )
}

export default React.memo<Props>(TableCrosswalkData)
