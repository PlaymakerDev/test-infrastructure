"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface Props {}

type GuaranteeType = 'ไม่ค้ำ' | 'หมดค้ำ'
type StatusType = 'ออนไลน์' | 'ออฟไลน์'

interface IDEntry { id: string; bureau: string; roadCode: string; projectName: string; contractNo: string; guarantee: GuaranteeType; installPoint: string; analysisCameras: number; events: number; status: StatusType; onlineCount: number; offlineCount: number }

const rawData: IDEntry[] = [
  { id: 'nu3021-1', bureau: 'ส่วนกลาง', roadCode: 'นบ.3021', projectName: 'โครงการงานบำรุงรักษาสาย นบ.3021', contractNo: 'สอ.47/2567', guarantee: 'ไม่ค้ำ', installPoint: 'นบ.3021 กม.33+200 – 35+510', analysisCameras: 2, events: 77, status: 'ออนไลน์', onlineCount: 2, offlineCount: 0 },
  { id: 'cc3017-1', bureau: 'สทช.13 ฉะเชิงเทรา', roadCode: 'ฉช.3017', projectName: 'งานบำรุงรักษาถนน ถนนสาย ฉช.3017', contractNo: 'กทจ.13/67/2565', guarantee: 'ไม่ค้ำ', installPoint: 'ฉช.3017 กม.0+450', analysisCameras: 2, events: 0, status: 'ออนไลน์', onlineCount: 2, offlineCount: 0 },
]

const TOTAL_COLS = 9
type Row = | { kind: 'bureau'; id: string; bureau: string; count: number } | { kind: 'entry'; id: string; entry: IDEntry; roadCodeRowSpan: number }

const buildRows = (entries: IDEntry[]): Row[] => {
  const groups = new Map<string, IDEntry[]>()
  for (const e of entries) { const list = groups.get(e.bureau) ?? []; list.push(e); groups.set(e.bureau, list) }
  const rows: Row[] = []
  for (const [bureau, items] of groups) {
    rows.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })
    let i = 0
    while (i < items.length) {
      const c = items[i].roadCode; let span = 1
      while (i + span < items.length && items[i + span].roadCode === c) span++
      for (let j = 0; j < span; j++) rows.push({ kind: 'entry', id: items[i + j].id, entry: items[i + j], roadCodeRowSpan: j === 0 ? span : 0 })
      i += span
    }
  }
  return rows
}

const IncidentDetectionList: React.FC<Props> = () => {
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
    { title: 'การค้ำประกัน', key: 'guarantee', width: 120, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap' style={{ border: `1px solid ${r.entry.guarantee === 'ไม่ค้ำ' ? '#05F2DB' : '#979797'}`, color: r.entry.guarantee === 'ไม่ค้ำ' ? '#05F2DB' : '#979797' }}>{r.entry.guarantee}</span> : null },
    { title: 'จุดติดตั้ง', key: 'installPoint', width: 220, onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? r.entry.installPoint : null },
    { title: 'กล้องวิเคราะห์', key: 'analysisCameras', width: 120, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className='font-semibold'>{r.entry.analysisCameras}</span> : null },
    { title: 'เหตุการณ์', key: 'events', width: 100, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className='font-semibold'>{r.entry.events}</span> : null },
    { title: 'สถานะ', key: 'status', width: 140, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind !== 'entry' ? null : <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap' style={{ border: `1px solid ${r.entry.status === 'ออนไลน์' ? '#66AEFF' : '#E94C4C'}`, color: r.entry.status === 'ออนไลน์' ? '#66AEFF' : '#E94C4C' }}>{r.entry.status === 'ออนไลน์' ? <TbWifi size={14} /> : <TbWifiOff size={14} />}{r.entry.status}</span> },
    { title: 'ออฟไลน์', key: 'offlineCount', width: 100, align: 'center', onCell: (r) => r.kind === 'bureau' ? { colSpan: 0 } : {}, render: (_: unknown, r: Row) => r.kind === 'entry' ? <span className={r.entry.offlineCount > 0 ? 'text-red-400 font-semibold' : 'text-white/30'}>{r.entry.offlineCount}</span> : null },
  ], [])

  return (
    <Table<Row>
      rowKey='id' columns={columns} dataSource={data} pagination={false} size='middle' scroll={{ x: 1400 }}
      onRow={() => ({ onClick: () => router.push('/admin/incident-detection/detail/EXAMPLE_ID'), className: 'cursor-pointer' })}
    />
  )
}

export default React.memo<Props>(IncidentDetectionList)
