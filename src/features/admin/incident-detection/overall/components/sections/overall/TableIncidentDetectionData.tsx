"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbShield, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface Props {}

type GuaranteeType = 'ไม่ค้ำ' | 'หมดค้ำ'
type StatusType = 'ออนไลน์' | 'ออฟไลน์'

interface IDEntry {
  id: string; bureau: string; roadCode: string; projectName: string
  contractNo: string; guarantee: GuaranteeType; installPoint: string
  analysisCameras: number; events: number; license: number
  status: StatusType; onlineCount: number; offlineCount: number
}

const rawData: IDEntry[] = [
  { id: 'nu3021-1', bureau: 'ส่วนกลาง', roadCode: 'นบ.3021', projectName: 'โครงการงานบำรุงรักษาสาย นบ.3021 กมน.ราษฎร์บูรณะ อ.เมือง จ.นนทบุรีจำนวน 1 แห่ง', contractNo: 'สอ.47/2567', guarantee: 'ไม่ค้ำ', installPoint: 'นบ.3021 กม.33+200 – 35+510', analysisCameras: 2, events: 77, license: 0, status: 'ออนไลน์', onlineCount: 2, offlineCount: 0 },
  { id: 'nu3021-2', bureau: 'ส่วนกลาง', roadCode: 'นบ.3021', projectName: 'โครงการงานบำรุงรักษาสาย นบ.3021 กมน.ราษฎร์บูรณะ อ.เมือง จ.นนทบุรีจำนวน 1 แห่ง', contractNo: 'สอ.6/2567', guarantee: 'ไม่ค้ำ', installPoint: 'นบ.3021 กม.29+400 – 42+200', analysisCameras: 128, events: 0, license: 0, status: 'ออนไลน์', onlineCount: 128, offlineCount: 0 },
  { id: 'cc3017-1', bureau: 'สทช.13 ฉะเชิงเทรา', roadCode: 'ฉช.3017', projectName: 'งานบำรุงรักษาถนน ถนนสาย ฉช.3017 แยกทางหลวงหมายเลข 331 – บ้านน้ำอ้อม ต.สาบน้ำ อ.พนมสารคาม สทช.ฉะเชิงเทรา', contractNo: 'กทจ.13/67/2565', guarantee: 'ไม่ค้ำ', installPoint: 'ฉช.3017 กม.0+450', analysisCameras: 2, events: 0, license: 0, status: 'ออนไลน์', onlineCount: 2, offlineCount: 0 },
  { id: 'cc3017-2', bureau: 'สทช.13 ฉะเชิงเทรา', roadCode: 'ฉช.3017', projectName: 'งานบำรุงรักษาถนน ถนนสาย ฉช.3017 แยกทางหลวงหมายเลข 331 – บ้านน้ำอ้อม ต.สาบน้ำ อ.พนมสารคาม สทช.ฉะเชิงเทรา', contractNo: 'กทจ.13/67/2565', guarantee: 'ไม่ค้ำ', installPoint: 'ฉช.3017 กม.2+650', analysisCameras: 3, events: 4, license: 0, status: 'ออนไลน์', onlineCount: 3, offlineCount: 0 },
  { id: 'cc4023-1', bureau: 'สทช.13 ฉะเชิงเทรา', roadCode: 'ฉช.4023', projectName: 'ว่าจ้างก่อสร้างโครงการปรับปรุงสะพาน ถนนสาย ฉช.4023 แยกทางหลวงหมายเลข 3200 – บ้านหนองขันหมาก อ.สนามชัยเขต จ.ฉะเชิงเทรา', contractNo: 'สอ.67/2568', guarantee: 'ไม่ค้ำ', installPoint: 'ฉช.4023 จุด 6 กม.5+680', analysisCameras: 8, events: 0, license: 0, status: 'ออฟไลน์', onlineCount: 0, offlineCount: 8 },
]

const TOTAL_COLS = 11

type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'entry'; id: string; entry: IDEntry; roadCodeRowSpan: number }

const buildRows = (entries: IDEntry[]): Row[] => {
  const groups = new Map<string, IDEntry[]>()
  for (const e of entries) { const list = groups.get(e.bureau) ?? []; list.push(e); groups.set(e.bureau, list) }
  const rows: Row[] = []
  for (const [bureau, items] of groups) {
    rows.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })
    let i = 0
    while (i < items.length) {
      const currentCode = items[i].roadCode; let span = 1
      while (i + span < items.length && items[i + span].roadCode === currentCode) span++
      for (let j = 0; j < span; j++) rows.push({ kind: 'entry', id: items[i + j].id, entry: items[i + j], roadCodeRowSpan: j === 0 ? span : 0 })
      i += span
    }
  }
  return rows
}

const GuaranteePill: React.FC<{ g: GuaranteeType }> = ({ g }) => {
  const color = g === 'ไม่ค้ำ' ? '#05F2DB' : '#979797'
  return <span className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap' style={{ border: `1px solid ${color}`, color }}>{g}</span>
}

const StatusPill: React.FC<{ s: StatusType }> = ({ s }) => {
  const isOnline = s === 'ออนไลน์'; const color = isOnline ? '#66AEFF' : '#E94C4C'
  return <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap' style={{ border: `1px solid ${color}`, color }}>{isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}{s}</span>
}

const TableIncidentDetectionData: React.FC<Props> = () => {
  const data = useMemo(() => buildRows(rawData), [])
  const router = useRouter()

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'รหัสสายทาง', key: 'roadCode', width: 130,
      onCell: (row) => row.kind === 'bureau' ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } } : { rowSpan: row.roadCodeRowSpan },
      render: (_: unknown, row: Row) => {
        if (row.kind === 'bureau') return <div className='flex items-center gap-3'><span className='text-white font-bold'>{row.bureau}</span><span className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs' style={{ border: '1px solid var(--yellow)', color: 'var(--yellow)' }}>{row.count} โครงการ</span></div>
        return <span className='font-medium'>{row.entry.roadCode}</span>
      },
    },
    { title: 'ชื่อโครงการ', key: 'projectName', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? r.entry.projectName : null },
    { title: 'เลขที่สัญญา', key: 'contractNo', width: 180, onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind !== 'entry' ? null : <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>{r.entry.contractNo}<TbInfoSquareRoundedFilled size={18} className='text-white/50 cursor-pointer hover:text-(--yellow)' /></span> },
    { title: 'การค้ำประกัน', key: 'guarantee', width: 120, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <GuaranteePill g={r.entry.guarantee} /> : null },
    { title: 'จุดติดตั้ง', key: 'installPoint', width: 220, onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? r.entry.installPoint : null },
    { title: 'กล้องวิเคราะห์', key: 'analysisCameras', width: 120, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className='font-semibold'>{r.entry.analysisCameras}</span> : null },
    { title: 'เหตุการณ์', key: 'events', width: 100, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className='font-semibold'>{r.entry.events}</span> : null },
    { title: 'License', key: 'license', width: 100, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className='font-semibold'>{r.entry.license}</span> : null },
    { title: 'สถานะ', key: 'status', width: 140, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <StatusPill s={r.entry.status} /> : null },
    {
      title: 'Stream', key: 'stream', width: 110, align: 'center',
      onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {},
      render: (_: unknown, r: Row) => r.kind !== 'entry' ? null : <span className={`inline-block py-0.5 px-3 rounded-full text-xs border ${r.entry.onlineCount > 0 ? 'border-blue-400 text-blue-400' : 'border-red-500 text-red-500'}`}>{r.entry.onlineCount > 0 ? 'Connect' : 'Disconnect'}</span>,
    },
    { title: 'ออฟไลน์', key: 'offlineCount', width: 100, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className={r.entry.offlineCount > 0 ? 'text-red-400 font-semibold' : 'text-white/30'}>{r.entry.offlineCount}</span> : null },
  ], [])

  return (
    <Table<Row>
      rowKey='id' columns={columns} dataSource={data} pagination={false} size='middle' scroll={{ x: 1600 }}
      onRow={() => ({ onClick: () => router.push('/admin/incident-detection/detail/EXAMPLE_ID'), className: 'cursor-pointer' })}
    />
  )
}

export default React.memo<Props>(TableIncidentDetectionData)
