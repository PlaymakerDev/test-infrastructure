"use client"
import React, { useMemo } from 'react'
import { Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbInfoSquareRoundedFilled } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { APIResponseVMSList, ListSolution } from '@/types/vms/overview-api'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
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
  const dispatch = useAppDispatch()

  const columns: ColumnsType<Row> = useMemo(
    () => [
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
          return (
            <DetailLinkText
              onClick={() => {
                if (row.type === 'data') router.push(`/admin/vms/detail/${row.data.solution.id}?is_warranty=${row.data.warranty.is_warranty}&is_online=${row.data.vms.status.is_online}`)
              }}
            >
              <span className='font-medium'>{row.data.road.code_name}</span>
            </DetailLinkText>
          )
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
          return (
            <DetailLinkText
              onClick={() => {
                if (row.type === 'data') router.push(`/admin/vms/detail/${row.data.solution.id}?is_warranty=${row.data.warranty.is_warranty}&is_online=${row.data.vms.status.is_online}`)
              }}
            >
              <span className='text-sm'>{row.data.project.project_name || '-'}</span>
            </DetailLinkText>
          )
        },
      },
      {
        title: 'เลขที่สัญญา',
        key: 'contractNo',
        width: 210,
        onCell: (row) => {
          if (row.type === 'header') return { colSpan: 0 }
          return { rowSpan: row.projectRowSpan }
        },
        render: (_: unknown, row: Row) => {
          if (row.type === 'header') return null

          let text

          if (row.data.project.contract_no) {
            text = row.data.project.contract_no
          } else if (!row.data.project.contract_no) {
            text = row.data.project.budget_year
          } else {
            text = null
          }

          return (
            <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
              {/* {row.data.project.contract_no || '-'}
              {row.data.project.budget_year ? (
                <span className='text-[10px] bg-yellow-400/15 text-yellow-300 px-1.5 py-0.5 rounded'>
                  {row.data.project.budget_year}
                </span>
              ) : null} */}
              <DetailLinkText
                onClick={() => {
                  if (row.type === 'data') router.push(`/admin/vms/detail/${row.data.solution.id}?is_warranty=${row.data.warranty.is_warranty}&is_online=${row.data.vms.status.is_online}`)
                }}
              >
                {text || '-'}
              </DetailLinkText>
              <TbInfoSquareRoundedFilled
                size={18}
                className='text-white/50 cursor-pointer hover:text-(--yellow)'
                onClick={(e) => {
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
          const { is_warranty, name } = row.data.warranty
          const color = is_warranty ? '#05F2DB' : '#979797'
          if (is_warranty === null) {
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
          return (
            <DetailLinkText
              onClick={() => {
                if (row.type === 'data') router.push(`/admin/vms/detail/${row.data.solution.id}?is_warranty=${row.data.warranty.is_warranty}&is_online=${row.data.vms.status.is_online}`)
              }}
            >
              <span>{row.data.solution.solution_name}</span>
            </DetailLinkText>
          )
        },
      },
      {
        title: 'กล้องทั้งหมด',
        key: 'total',
        width: 110,
        align: 'center',
        onCell: (row) => {
          if (row.type === 'header') return { colSpan: 0 }
          return {}
        },
        render: (_: unknown, row: Row) => {
          if (row.type === 'header') return null
          return row.data.online_count + row.data.offline_count
        },
      },
      {
        title: 'ออนไลน์',
        key: 'online',
        width: 90,
        align: 'center',
        onCell: (row) => {
          if (row.type === 'header') return { colSpan: 0 }
          return {}
        },
        render: (_: unknown, row: Row) => {
          if (row.type === 'header') return null
          const count = row.data.online_count
          if (count === 0) return <p className='fs-12 text-blue-500/40'>0</p>
          return <Tag variant='solid' color='blue'>{count}</Tag>
        },
      },
      {
        title: 'ออฟไลน์',
        key: 'offline',
        width: 90,
        align: 'center',
        onCell: (row) => {
          if (row.type === 'header') return { colSpan: 0 }
          return {}
        },
        render: (_: unknown, row: Row) => {
          if (row.type === 'header') return null
          const count = row.data.offline_count
          if (count === 0) return <p className='fs-12 text-red-500/40'>0</p>
          return <Tag variant='solid' color='red'>{count}</Tag>
        },
      },
    ],
    [dispatch, router],
  )

  return (
    <Table<Row>
      rowKey={(row) => String(row.id)}
      columns={columns}
      dataSource={rows}
      loading={loading}
      pagination={false}
      size='middle'
      scroll={{ x: 1200 }}
    // onRow={(row) => ({
    //   onClick: () => {
    //     if (row.type === 'data') router.push(`/admin/vms/detail/${row.data.solution.id}?is_warranty=${row.data.warranty.is_warranty}&is_online=${row.data.vms.status.is_online}`)
    //   },
    //   className: row.type === 'data' ? 'cursor-pointer' : '',
    // })}
    />
  )
}

export default React.memo<Props>(TableVMSData)
