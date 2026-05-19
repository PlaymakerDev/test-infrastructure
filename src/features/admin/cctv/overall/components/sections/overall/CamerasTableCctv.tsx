"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import type { CctvCameraEntry } from '@/features/admin/cctv/overall/data/cctvData'

interface Props {
  cameras: CctvCameraEntry[]
}

const CountBadge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  if (value === 0) return <span style={{ color }}>{value}</span>
  return (
    <span
      className='inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded'
      style={{ background: color, color: '#212121', fontWeight: 600 }}
    >
      {value}
    </span>
  )
}

const WarrantyPill: React.FC<{ warranty: CctvCameraEntry['warranty'] }> = ({ warranty }) => {
  const cfg = warranty === 'in-warranty'
    ? { text: 'ในค้ำ', color: '#05F2DB' }
    : { text: 'หมดค้ำ', color: '#979797' }
  return (
    <span
      className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${cfg.color}`, color: cfg.color }}
    >
      {cfg.text}
    </span>
  )
}

type Row =
  | { kind: 'bureau'; id: string; bureau: string; count: number }
  | { kind: 'camera'; id: string; camera: CctvCameraEntry }

const CamerasTableCctv: React.FC<Props> = ({ cameras }) => {
  const router = useRouter()

  const data = useMemo<Row[]>(() => {
    const groups = new Map<string, CctvCameraEntry[]>()
    for (const c of cameras) {
      const list = groups.get(c.bureau) ?? []
      list.push(c)
      groups.set(c.bureau, list)
    }
    const out: Row[] = []
    for (const [bureau, items] of groups) {
      out.push({ kind: 'bureau', id: `bureau-${bureau}`, bureau, count: items.length })
      for (const c of items) {
        out.push({ kind: 'camera', id: c.id, camera: c })
      }
    }
    return out
  }, [cameras])

  const TOTAL_COLS = 8

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      width: 160,
      onCell: (row) =>
        row.kind === 'bureau'
          ? { colSpan: TOTAL_COLS, style: { background: '#2a2a2a', padding: '10px 16px' } }
          : {},
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
        return row.camera.roadCode
      },
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      ellipsis: true,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? row.camera.projectName : null,
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 280,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.kind !== 'camera') return null
        return (
          <span
            className='text-white cursor-pointer hover:text-(--yellow) hover:underline'
            onClick={() => router.push(`/admin/cctv/detail/${row.camera.id}`)}
            role='link'
            tabIndex={0}
          >
            {row.camera.installPoint}
          </span>
        )
      },
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 200,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.kind !== 'camera') return null
        return (
          <span className='inline-flex items-center gap-1.5'>
            {row.camera.contractNo}
            <TbInfoSquareRoundedFilled
              size={18}
              className='text-white cursor-pointer hover:text-(--yellow)'
              title='ดูรายละเอียดสัญญา'
            />
          </span>
        )
      },
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 130,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera' ? <WarrantyPill warranty={row.camera.warranty} /> : null,
    },
    {
      title: 'กล้องทั้งหมด',
      key: 'totalCameras',
      align: 'center',
      width: 120,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera'
          ? <span className='text-white font-semibold'>{row.camera.totalCameras}</span>
          : null,
    },
    {
      title: 'ออนไลน์',
      key: 'onlineCount',
      align: 'center',
      width: 110,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera'
          ? <CountBadge value={row.camera.onlineCount} color='#66AEFF' />
          : null,
    },
    {
      title: 'ออฟไลน์',
      key: 'offlineCount',
      align: 'center',
      width: 110,
      onCell: (row) => (row.kind === 'bureau' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) =>
        row.kind === 'camera'
          ? <CountBadge value={row.camera.offlineCount} color='#E94C4C' />
          : null,
    },
  ], [router])

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={data}
      pagination={false}
      size='middle'
      scroll={{ x: 1350 }}
    />
  )
}

export default React.memo<Props>(CamerasTableCctv)
