"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

interface Props { }

type GuaranteeType = 'ในค้ำ' | 'หมดค้ำ'
type StatusType = 'ออนไลน์' | 'ออฟไลน์'
type ConnectionType = 'Connect' | 'Disconnect'
type CameraType = ConnectionType | 'ไม่มีกล้อง'

interface VMSEntry {
  id: string
  bureau: string
  roadCode: string
  projectName: string
  contractNo: string
  guarantee: GuaranteeType
  installPoint: string
  status: StatusType
  stream: ConnectionType
  camera: CameraType
}

const rawData: VMSEntry[] = [
  {
    id: 'kk1001-1',
    bureau: 'ส่วนกลาง',
    roadCode: 'กค.1001',
    projectName: 'โครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย กก.1001',
    contractNo: 'สอป.5/2567',
    guarantee: 'ในค้ำ',
    installPoint: 'กก.1001 - จุดที่ 3 กม.6+300 กินกันจัง',
    status: 'ออนไลน์',
    stream: 'Connect',
    camera: 'Connect',
  },
  {
    id: 'kk1001-2',
    bureau: 'ส่วนกลาง',
    roadCode: 'กค.1001',
    projectName: 'โครงการปรับปรุงทางเพื่อความปลอดภัย ถนนสาย กก.1001 จุดที่ 2',
    contractNo: 'สอป.6/2567',
    guarantee: 'ในค้ำ',
    installPoint: 'กก.1001 - จุดที่ 2 กม.5+800 เมโทรทาวน์',
    status: 'ออฟไลน์',
    stream: 'Disconnect',
    camera: 'ไม่มีกล้อง',
  },
  {
    id: 'kk1001-3',
    bureau: 'ส่วนกลาง',
    roadCode: 'กค.1001 (กัลปพฤกษ์)',
    projectName: 'โครงการปรับปรุงทางสาย สป.4009 แยกทางหลวงหมายเลข 3344 – ถนนสุขุมวิท อ.เมือง จ.สมุทรปราการ 1 แห่ง',
    contractNo: '2566',
    guarantee: 'หมดค้ำ',
    installPoint: 'ถ.กัลปพฤกษ์: บาจาก ถ.กาญจนาภิเษก',
    status: 'ออนไลน์',
    stream: 'Connect',
    camera: 'Connect',
  },
  {
    id: 'pt3017-1',
    bureau: 'สทข.1 ปทุมธานี',
    roadCode: 'ปน.3017',
    projectName: 'โครงการเพิ่มประสิทธิภาพการบริหารจัดการระบบส่งและจราจรอิจฉริยะด้วยระบบสังเกตการณ์นับบนภาพและวิเคราะห์ภาพ ถนนสาย ปก.3010',
    contractNo: 'คค 0709/32/2567',
    guarantee: 'หมดค้ำ',
    installPoint: 'VMS >> ปน.3017',
    status: 'ออฟไลน์',
    stream: 'Disconnect',
    camera: 'Disconnect',
  },
  {
    id: 'sp2001-1',
    bureau: 'สทข.1 ปทุมธานี',
    roadCode: 'สป.2001',
    projectName: 'โครงการงานปรับปรุงถนนสาย สป.2001 แยกทางหลวงหมายเลข 34 – บ้านลาดกระบัง อำเภอบางพลี, บางเสาธง จังหวัดสมุทรปราการ จำนวน 1 แห่ง',
    contractNo: 'คค 0709/29/2567',
    guarantee: 'หมดค้ำ',
    installPoint: 'VMS >> สป.2001 กม.0+020',
    status: 'ออฟไลน์',
    stream: 'Disconnect',
    camera: 'Disconnect',
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
  const color = guarantee === 'ในค้ำ' ? '#05F2DB' : '#979797'
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

const StreamButton: React.FC<{ type: ConnectionType }> = ({ type }) => {
  const isConnect = type === 'Connect'
  const color = isConnect ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap cursor-pointer hover:opacity-80'
      style={{ border: `1px solid ${color}`, color }}
    >
      {type}
    </span>
  )
}

const CameraButton: React.FC<{ camera: CameraType }> = ({ camera }) => {
  if (camera === 'ไม่มีกล้อง') {
    return (
      <span
        className='text-xs whitespace-nowrap'
        style={{ color: '#666' }}
      >
        {camera}
      </span>
    )
  }
  const isConnect = camera === 'Connect'
  const color = isConnect ? 'rgba(255,255,255,0.6)' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap cursor-pointer hover:opacity-80'
      style={{ border: `1px solid ${color}`, color }}
    >
      {camera}
    </span>
  )
}

const StatusDot: React.FC<{ status: StatusType }> = ({ status }) => (
  <span
    className='inline-block w-2.5 h-2.5 rounded-full'
    style={{ background: status === 'ออนไลน์' ? '#4ADE80' : '#E94C4C' }}
  />
)

const VMSList: React.FC<Props> = () => {
  const data = useMemo(() => buildRows(rawData), [])
  const router = useRouter()

  const columns: ColumnsType<Row> = useMemo(() => [
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
      render: (_: unknown, row: Row) =>
        row.kind !== 'entry' ? null : (
          <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            {row.entry.contractNo}
            <TbInfoSquareRoundedFilled
              size={18}
              className='text-white/50 cursor-pointer hover:text-(--yellow)'
            />
          </span>
        ),
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
      title: 'Stream',
      key: 'stream',
      width: 130,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'entry' ? <StreamButton type={row.entry.stream} /> : null,
    },
    {
      title: 'กล้อง',
      key: 'camera',
      width: 140,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'entry' ? <CameraButton camera={row.entry.camera} /> : null,
    },
    {
      title: '',
      key: 'dot',
      width: 40,
      align: 'center',
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'entry' ? <StatusDot status={row.entry.status} /> : null,
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
      onRow={(record) => ({
        onClick: () => {
          if (record.kind !== 'entry') return
          router.push(`/admin/vms/detail/EXAMPLE_VMS_ID?status=${record.entry.status}&stream=${record.entry.stream}&camera=${record.entry.camera}`)
        },
        className: 'cursor-pointer',
      })}
    />
  )
}

export default React.memo<Props>(VMSList)
