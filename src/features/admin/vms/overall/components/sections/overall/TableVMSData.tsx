"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface Props {}

type GuaranteeType = 'ไม่ค้ำ' | 'หมดค้ำ'
type StatusType = 'ออนไลน์' | 'ออฟไลน์'

interface VMSEntry {
  id: string
  bureau: string
  roadCode: string
  projectName: string
  contractNo: string
  guarantee: GuaranteeType
  installPoint: string
  status: StatusType
  totalSigns: number
  onlineCount: number
  offlineCount: number
}

const rawData: VMSEntry[] = [
  {
    id: 'kk1001-1',
    bureau: 'ส่วนกลาง',
    roadCode: 'กค.1001',
    projectName: 'โครงการปรับปรุงสะพานเพื่อความปลอดภัย ถนนสาย กค.1001 จำนวน 1 แห่ง',
    contractNo: 'สอ.5/2567',
    guarantee: 'ไม่ค้ำ',
    installPoint: 'กค.1001 - จุดที่ 3 กม.6+300 กันหน้าขึ้น',
    status: 'ออนไลน์',
    totalSigns: 4,
    onlineCount: 4,
    offlineCount: 0,
  },
  {
    id: 'kk1001-2',
    bureau: 'ส่วนกลาง',
    roadCode: 'กค.1001',
    projectName: 'โครงการก่อสร้างปรับปรุงถนนสาย กค.1001 จุดที่ 2 แห่ง',
    contractNo: 'สอ.6/2567',
    guarantee: 'ไม่ค้ำ',
    installPoint: 'กค.1001 - จุดที่ 2 กม.5+800 กันโครงการ',
    status: 'ออฟไลน์',
    totalSigns: 2,
    onlineCount: 0,
    offlineCount: 2,
  },
  {
    id: 'kk1001-3',
    bureau: 'ส่วนกลาง',
    roadCode: 'กค.1001(ต่อพฤทธิ์)',
    projectName: 'โครงการปรับปรุงสาย กค.1001 แยกทางหลวง หมายเลข 3344 – ถนนสุนุวิก อ.เมือง จ.สมุทรปราการ',
    contractNo: '2566',
    guarantee: 'หมดค้ำ',
    installPoint: 'ก.หัลพฤทธิ์: มาจาก ก.นนทบุรีบริหาร',
    status: 'ออนไลน์',
    totalSigns: 6,
    onlineCount: 6,
    offlineCount: 0,
  },
  {
    id: 'pt3010-1',
    bureau: 'สทช.1 ปทุมธานี',
    roadCode: 'ปน.3017',
    projectName: 'โครงการพัฒนาประสิทธิภาพการบริหารจัดการระบบประมาณ สัจรรยาตรวจสอบรถจักรยานยนต์ ปน.3010',
    contractNo: 'คค 0709/32/2567',
    guarantee: 'ไม่ค้ำ',
    installPoint: 'VMS >> ปน.3017',
    status: 'ออนไลน์',
    totalSigns: 3,
    onlineCount: 3,
    offlineCount: 0,
  },
  {
    id: 'su2001-1',
    bureau: 'สทช.1 ปทุมธานี',
    roadCode: 'สบ.2001',
    projectName: 'โครงการปรับปรุงสาย สบ.2001 แยกทางหลวงหมายเลข 34 – บ้านลาดกระบัง อำเภอบางพลี จังหวัดสมุทรปราการ',
    contractNo: 'คค 0709/29/2567',
    guarantee: 'หมดค้ำ',
    installPoint: 'VMS >> สบ.2001 กม.0+020',
    status: 'ออฟไลน์',
    totalSigns: 2,
    onlineCount: 0,
    offlineCount: 2,
  },
]

const TOTAL_COLS = 9

type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'entry'; id: string; entry: VMSEntry; roadCodeRowSpan: number }

const buildRows = (entries: VMSEntry[]): Row[] => {
  const groups = new Map<string, VMSEntry[]>()
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
      while (i + span < items.length && items[i + span].roadCode === currentCode) span++
      for (let j = 0; j < span; j++) {
        rows.push({
          kind: 'entry',
          id: items[i + j].id,
          entry: items[i + j],
          roadCodeRowSpan: j === 0 ? span : 0,
        })
      }
      i += span
    }
  }
  return rows
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

const TableVMSData: React.FC<Props> = () => {
  const data = useMemo(() => buildRows(rawData), [])
  const router = useRouter()

  const columns: ColumnsType<Row> = useMemo(
    () => [
      {
        title: 'รหัสสายทาง',
        key: 'roadCode',
        width: 130,
        onCell: (row) =>
          row.kind === 'bureau'
            ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
            : { rowSpan: row.roadCodeRowSpan },
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
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? row.entry.projectName : null,
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
              <TbInfoSquareRoundedFilled
                size={18}
                className='text-white/50 cursor-pointer hover:text-(--yellow)'
              />
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
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? <GuaranteePill guarantee={row.entry.guarantee} /> : null,
      },
      {
        title: 'จุดติดตั้ง',
        key: 'installPoint',
        width: 260,
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? row.entry.installPoint : null,
      },
      {
        title: 'สถานะ',
        key: 'status',
        width: 140,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? <StatusPill status={row.entry.status} /> : null,
      },
      {
        title: 'ป้ายทั้งหมด',
        key: 'totalSigns',
        width: 120,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? (
            <span className='font-semibold'>{row.entry.totalSigns}</span>
          ) : null,
      },
      {
        title: 'ออนไลน์',
        key: 'onlineCount',
        width: 110,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? (
            <CountBadge
              value={row.entry.onlineCount}
              color='#66AEFF'
            />
          ) : null,
      },
      {
        title: 'ออฟไลน์',
        key: 'offlineCount',
        width: 110,
        align: 'center',
        onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
        render: (_: unknown, row: Row) =>
          row.kind === 'entry' ? (
            <CountBadge
              value={row.entry.offlineCount}
              color='#E94C4C'
            />
          ) : null,
      },
    ],
    [],
  )

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      scroll={{ x: 1400 }}
      onRow={() => ({
        onClick: () => router.push('/admin/vms/detail/EXAMPLE_VMS_ID'),
        className: 'cursor-pointer',
      })}
    />
  )
}

export default React.memo<Props>(TableVMSData)
