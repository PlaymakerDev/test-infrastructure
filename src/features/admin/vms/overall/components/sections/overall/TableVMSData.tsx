"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
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

const TableVMSData: React.FC<Props> = ({ data, loading }) => {
  const rows = useMemo(() => buildRows(data?.res_data ?? []), [data])
  const router = useRouter()

  const columns: ColumnsType<Row> = useMemo(
    () => [
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
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 200,
        onCell: (row) => ({ rowSpan: row.contractRowSpan }),
        render: (_: unknown, row: Row) => (
          <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            {row.data.project.contract_no || '-'}
            <TbInfoSquareRoundedFilled
              size={18}
              className='text-white/50 cursor-pointer hover:text-(--yellow)'
            />
          </span>
        ),
      },
      {
        title: 'การค้ำประกัน',
        key: 'warranty',
        width: 130,
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
        title: 'เชื่อมต่อล่าสุด',
        key: 'lastConnected',
        width: 180,
        render: (_: unknown, row: Row) => (
          <span className='text-white/60 text-xs'>{row.data.vms.last_connected || '-'}</span>
        ),
      },
    ],
    [],
  )

  return (
    <Table<Row>
      rowKey='id'
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1100 }}
      onRow={(row) => ({
        onClick: () => router.push(`/admin/vms/detail/${row.data.solution.id}`),
        className: 'cursor-pointer',
      })}
    />
  )
}

export default React.memo<Props>(TableVMSData)
