"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled, TbWifi, TbWifiOff } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { APIResponseVMSList, ListSolution } from '@/types/vms/overview-api'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'

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

const TOTAL_COLS = 9

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

const GuaranteePill: React.FC<{ name: string; isWarranty: boolean | null }> = ({ name, isWarranty }) => {
  const color = isWarranty ? '#05F2DB' : '#979797'
  if (isWarranty === null) {
    return (
      <span
        className='inline-flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
        style={{ border: `1px solid var(--yellow)`, color: 'var(--yellow)' }}
      >
        ก่อนค้ำ
      </span>
    )
  }
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

const VMSList: React.FC<Props> = ({ data, loading }) => {
  const rows = useMemo(() => buildRows(data ?? []), [data])
  const router = useRouter()
  const dispatch = useAppDispatch()

  const columns: ColumnsType<Row> = useMemo(() => [
    {
      title: 'รหัสสายทาง',
      key: 'roadCode',
      width: 150,
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: TOTAL_COLS }
        return { rowSpan: row.roadCodeRowSpan }
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') {
          return (
            <div className='flex items-center gap-3'>
              <span className='font-semibold text-sm'>{row.label}</span>
              <span className='text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full'>
                {row.count} โครงการ
              </span>
            </div>
          )
        }
        return <span className='font-medium'>{row.data.road.code_name}</span>
      },
    },
    {
      title: 'ชื่อโครงการ',
      key: 'projectName',
      width: 400,
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return { rowSpan: row.projectRowSpan }
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <span className='text-sm'>{row.data.project.project_name || '-'}</span>
      },
    },
    {
      title: 'เลขที่สัญญา',
      key: 'contractNo',
      width: 200,
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return { rowSpan: row.projectRowSpan }
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        const { contract_no, budget_year } = row.data.project
        return (
          <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
            {contract_no || budget_year || '-'}
            <TbInfoSquareRoundedFilled
              size={18}
              className='text-white/50 cursor-pointer hover:text-(--yellow)'
              onClick={(e) => {
                console.log("===", row.data.project.id)
                e.stopPropagation()
                dispatch(setProjectInfoModalOpen({ open: true, project_id: row.data.project.id, road_id: row.data.road.id }))
              }}
            />
          </span>
        )
      },
    },
    {
      title: 'การค้ำประกัน',
      key: 'warranty',
      width: 130,
      align: 'center',
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return {}
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return (
          <GuaranteePill
            name={row.data.warranty.name}
            isWarranty={row.data.warranty.is_warranty}
          />
        )
      },
    },
    {
      title: 'จุดติดตั้ง',
      key: 'installPoint',
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return {}
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <span>{row.data.solution.solution_name}</span>
      },
    },
    {
      title: 'สถานะ',
      key: 'status',
      width: 140,
      align: 'center',
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return {}
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <StatusPill isOnline={row.data.vms.status.is_online} />
      },
    },
    {
      title: 'Stream',
      key: 'stream',
      width: 130,
      align: 'center',
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return {}
      },
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
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return {}
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <CameraButton url={row.data.vms.desktop_screen} />
      },
    },
    {
      title: '',
      key: 'dot',
      width: 40,
      align: 'center',
      onCell: (row) => {
        if (row.type === 'header') return { colSpan: 0 }
        return {}
      },
      render: (_: unknown, row: Row) => {
        if (row.type === 'header') return null
        return <StatusDot isOnline={row.data.vms.status.is_online} />
      },
    },
  ], [dispatch])

  return (
    <Table<Row>
      rowKey={(row) => String(row.id)}
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1400 }}
      onRow={(row) => ({
        onClick: () => {
          if (row.type === 'data') router.push(`/admin/vms/detail/${row.data.solution.id}`)
        },
        className: row.type === 'data' ? 'cursor-pointer' : '',
      })}
    />
  )
}

export default React.memo<Props>(VMSList)
