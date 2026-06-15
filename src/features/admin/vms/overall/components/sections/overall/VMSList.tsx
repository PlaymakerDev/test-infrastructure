"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { APIResponseVMSList, ListResData } from '@/types/vms/overview-api'

interface Props {
  data?: APIResponseVMSList
  loading?: boolean
}

interface Row {
  id: number
  roadCodeRowSpan: number
  contractRowSpan: number
  data: ListResData
}

const buildRows = (items: ListResData[]): Row[] => {
  const rows: Row[] = []
  let i = 0
  while (i < items.length) {
    const currentRoadId = items[i].road.id
    let roadEnd = i + 1
    while (roadEnd < items.length && items[roadEnd].road.id === currentRoadId) roadEnd++

    let j = i
    while (j < roadEnd) {
      const currentProjectId = items[j].project.id
      let contractEnd = j + 1
      while (contractEnd < roadEnd && items[contractEnd].project.id === currentProjectId) contractEnd++

      for (let k = j; k < contractEnd; k++) {
        rows.push({
          id: items[k].solution.id,
          roadCodeRowSpan: k === i ? roadEnd - i : 0,
          contractRowSpan: k === j ? contractEnd - j : 0,
          data: items[k],
        })
      }
      j = contractEnd
    }
    i = roadEnd
  }
  return rows
}

const GuaranteePill: React.FC<{ name: string; isWarranty: boolean }> = ({ name, isWarranty }) => {
  const color = isWarranty ? '#05F2DB' : '#979797'
  return (
    <span
      className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {name}
    </span>
  )
}

const StatusPill: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  const color = isOnline ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
      {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
    </span>
  )
}

const StreamButton: React.FC<{ url: string }> = ({ url }) => {
  const isConnect = !!url
  const color = isConnect ? '#66AEFF' : '#E94C4C'
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap cursor-pointer hover:opacity-80'
      style={{ border: `1px solid ${color}`, color }}
    >
      {isConnect ? 'Connect' : 'Disconnect'}
    </span>
  )
}

const CameraButton: React.FC<{ url: string }> = ({ url }) => {
  if (!url) {
    return (
      <span className='text-xs whitespace-nowrap' style={{ color: '#666' }}>
        ไม่มีกล้อง
      </span>
    )
  }
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap cursor-pointer hover:opacity-80'
      style={{ border: '1px solid rgba(255,255,255,0.6)', color: 'rgba(255,255,255,0.6)' }}
    >
      Connect
    </span>
  )
}

const StatusDot: React.FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <span
    className='inline-block w-2.5 h-2.5 rounded-full'
    style={{ background: isOnline ? '#4ADE80' : '#E94C4C' }}
  />
)

const VMSList: React.FC<Props> = (props) => {
  const { data, loading } = props
  const rows = useMemo(() => buildRows(data?.res_data ?? []), [data])
  const router = useRouter()

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      width: 160,
      onCell: (row) => ({ rowSpan: row.roadCodeRowSpan }),
      render: (_: unknown, row: Row) => (
        <span className='font-medium'>{row.data.road.code_name}</span>
      ),
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 140,
      align: 'center',
      render: (_: unknown, row: Row) => (
        <GuaranteePill
          name={row.data.warranty.name}
          isWarranty={row.data.warranty.is_warranty}
        />
      ),
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      render: (_: unknown, row: Row) => row.data.solution.solution_name,
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 140,
      align: 'center',
      render: (_: unknown, row: Row) => (
        <StatusPill isOnline={row.data.vms.status.is_online} />
      ),
    },
    {
      title: 'Stream',
      key: 'stream',
      width: 130,
      align: 'center',
      render: (_: unknown, row: Row) => (
        <StreamButton url={row.data.vms.hls_url} />
      ),
    },
    {
      title: 'กล้อง',
      key: 'camera',
      width: 140,
      align: 'center',
      render: (_: unknown, row: Row) => (
        <CameraButton url={row.data.vms.desktop_screen} />
      ),
    },
    {
      title: '',
      key: 'dot',
      width: 40,
      align: 'center',
      render: (_: unknown, row: Row) => (
        <StatusDot isOnline={row.data.vms.status.is_online} />
      ),
    },
  ], [])

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1200 }}
      onRow={(row) => ({
        onClick: () => router.push(`/admin/vms/detail/${row.data.solution.id}`),
        className: 'cursor-pointer',
      })}
    />
  )
}

export default React.memo<Props>(VMSList)
