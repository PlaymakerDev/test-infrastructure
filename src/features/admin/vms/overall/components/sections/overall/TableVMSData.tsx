"use client"
import React, { useMemo, useCallback } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { APIResponseVMSList, ListSolution } from '@/types/vms/overview-api'
import { ContractInfoCell } from '@/components/modal'
import DetailLinkText from '@/components/table/DetailLinkText'

interface Props {
  data?: APIResponseVMSList
  loading?: boolean
}

type HeaderRow = {
  type: 'header'
  id: string
  label: string
  count: number
}

type DataRow = {
  type: 'data'
  id: number
  roadCodeRowSpan: number
  projectRowSpan: number
  data: ListSolution
}

type Row = HeaderRow | DataRow

const TOTAL_COLS = 8

/** Bordered rounded pill — shared visual language with the crosswalk overall
 *  table. Used for การค้ำประกัน + สถานะ (with an optional leading icon). */
const Pill: React.FC<{ text: string; color: string; icon?: React.ReactNode }> = ({ text, color, icon }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

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
      <span
        className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap'
        style={{ border: '1px solid #979797', color: '#979797' }}
      >
        ไม่มีกล้อง
      </span>
    )
  }
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs whitespace-nowrap cursor-pointer hover:opacity-80'
      style={{ border: '1px solid #66AEFF', color: '#66AEFF' }}
    >
      Connect
    </span>
  )
}

const buildRows = (apiData: APIResponseVMSList): Row[] => {
  const rows: Row[] = []

  for (const dept of apiData) {
    const allSolutions = dept.sub_department.flatMap(sub => sub.solutions)

    rows.push({
      type: 'header',
      id: `dept-${dept.department_id}`,
      label: dept.department_short_name,
      count: allSolutions.length,
    })

    let i = 0
    while (i < allSolutions.length) {
      const currentRoadId = allSolutions[i].road.id
      let roadEnd = i + 1
      while (roadEnd < allSolutions.length && allSolutions[roadEnd].road.id === currentRoadId) roadEnd++

      let j = i
      while (j < roadEnd) {
        const currentProjectId = allSolutions[j].project.id
        let projectEnd = j + 1
        while (projectEnd < roadEnd && allSolutions[projectEnd].project.id === currentProjectId) projectEnd++

        for (let k = j; k < projectEnd; k++) {
          rows.push({
            type: 'data',
            id: allSolutions[k].solution.id,
            roadCodeRowSpan: k === i ? roadEnd - i : 0,
            projectRowSpan: k === j ? projectEnd - j : 0,
            data: allSolutions[k],
          })
        }
        j = projectEnd
      }
      i = roadEnd
    }
  }

  return rows
}

const TableVMSData: React.FC<Props> = ({ data, loading }) => {
  const rows = useMemo(() => buildRows(data ?? []), [data])
  const router = useRouter()

  const goToDetail = useCallback(
    (row: ListSolution) => {
      router.push(
        `/admin/vms/detail/${row.solution.id}?is_warranty=${row.warranty.is_warranty}&is_online=${row.vms.status.is_online}`,
      )
    },
    [router],
  )

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      className: 'col-road-code',
      width: 150,
      // NOTE: no antd `rowSpan` here. Merging the road-code column via rowSpan
      // while the dept header row spans all columns (colSpan) made antd drop the
      // road-code <td> on continuation rows, shifting every column one to the
      // LEFT — worst when a filter clusters many rows onto one road (big span).
      // Instead we keep a <td> on every row and only PRINT the code on the
      // first row of each road group (blank below), so it still reads grouped
      // and the columns never misalign.
      onCell: (row) => {
        if (row.type === 'header') {
          return {
            colSpan: TOTAL_COLS,
            style: { background: '#2a2a2a', padding: '10px 16px' },
          }
        }
        return {}
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') {
          return (
            <div className='flex items-center gap-3'>
              <span className='text-white font-bold'>{row.label}</span>
              <span
                className='inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs'
                style={{ border: '1px solid #fff', color: '#fff' }}
              >
                {row.count} โครงการ
              </span>
            </div>
          )
        }
        // Continuation row of the same road group → blank cell (still occupies
        // the column so the row keeps all 8 cells).
        if (row.roadCodeRowSpan === 0) return null
        return (
          <DetailLinkText onClick={() => goToDetail(row.data)}>
            <span className='font-medium'>{row.data.road.code_name}</span>
          </DetailLinkText>
        )
      },
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      className: 'col-project-name',
      ellipsis: true,
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return (
          <DetailLinkText onClick={() => goToDetail(row.data)}>
            <span className='text-sm'>{row.data.project.project_name || '-'}</span>
          </DetailLinkText>
        )
      },
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      width: 280,
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return (
          <DetailLinkText onClick={() => goToDetail(row.data)}>
            <span>{row.data.solution.solution_name}</span>
          </DetailLinkText>
        )
      },
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 200,
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return (
          <ContractInfoCell
            contractNo={row.data.project.contract_no}
            budgetYear={row.data.project.budget_year}
            projectId={row.data.project.id}
            roadId={row.data.road.id}
          />
        )
      },
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 130,
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return row.data.warranty.is_warranty ? (
          <Pill text='ในค้ำ' color='#05F2DB' />
        ) : (
          <Pill text='หมดค้ำ' color='#979797' />
        )
      },
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 140,
      align: 'center',
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        const isOnline = row.data.vms.status.is_online
        return (
          <Pill
            text={isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
            color={isOnline ? '#66AEFF' : '#E94C4C'}
            icon={isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
          />
        )
      },
    },
    {
      title: 'Stream',
      key: 'stream',
      width: 130,
      align: 'center',
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <StreamButton url={row.data.vms.hls_url} />
      },
    },
    {
      title: 'กล้อง',
      key: 'camera',
      width: 140,
      align: 'center',
      onCell: (row) => (row.type === 'header' ? { colSpan: 0 } : {}),
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <CameraButton url={row.data.vms.desktop_screen} />
      },
    },
  ], [goToDetail])

  return (
    <Table<Row>
      rowKey={(row) => String(row.id)}
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1400 }}
      // Shared table skin — yellow row dividers + dark pagination styling,
      // identical to the crosswalk / traffic-volume overall tables.
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableVMSData)
