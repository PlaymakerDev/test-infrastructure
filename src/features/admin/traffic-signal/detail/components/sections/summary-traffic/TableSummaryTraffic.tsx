"use client"
import React, { useMemo, useState } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useTrafficReports } from '@/hooks/queries/traffic-signal'
import { useDetailContext } from '../../../context'

interface Props { }

interface RowData {
  id: string
  date: string
  dateSpan: number
  phase: number
  greenSec: number
  redSec: number
  pcu: number
  efficiency: number
  timeSaved: number
  co2: number
}

const TableSummaryTraffic: React.FC<Props> = () => {
  const { project } = useDetailContext()
  const phaseCount = project.phase

  const [pagination, setPagination] = useState({
    page: 1,
    limit: phaseCount * 3, // 3 days per page so date rowSpan doesn't split.
  })

  const { data } = useTrafficReports(project.id, pagination)

  /** Flatten 7-day API response into per-phase rows + compute rowSpan for
   *  the date column. Backend already slices by phase; we just lay them out. */
  const rows = useMemo<RowData[]>(() => {
    const out: RowData[] = []
    for (const day of data?.res_data ?? []) {
      const phasesForDay = day.data.slice(0, phaseCount)
      const dateLabel = `วัน${day.day}\n${dayjs(day.date).locale('th').format('D MMM BBBB')}`
      phasesForDay.forEach((p, i) => {
        out.push({
          id: `${day.date}-${p.phases_no}`,
          date: dateLabel,
          dateSpan: i === 0 ? phasesForDay.length : 0,
          phase: p.phases_no,
          greenSec: p.avg_green_time,
          redSec: p.avg_waithing_time,
          pcu: p.total_pcu,
          efficiency: p.efficiency,
          timeSaved: p.total_time_saved,
          co2: p.total_carbon_saved,
        })
      })
    }
    return out
  }, [data, phaseCount])

  const phaseCell = (row: RowData, text: string) => (
    <span className='fs-14' style={{ color: getPhaseColor(row.phase) }}>
      {text}
    </span>
  )

  const columns: ColumnsType<RowData> = [
    {
      title: 'วันที่',
      key: 'date',
      width: 160,
      onCell: (row) => ({ rowSpan: row.dateSpan }),
      render: (_, row) => (
        <div className='whitespace-pre-line text-white'>{row.date}</div>
      ),
    },
    {
      title: 'Phase',
      key: 'phase',
      align: 'center',
      width: 100,
      render: (_, row) => phaseCell(row, String(row.phase)),
    },
    {
      title: 'ช่วงเวลาไฟเขียว (s)',
      key: 'green',
      align: 'center',
      width: 180,
      render: (_, row) => phaseCell(row, String(row.greenSec)),
    },
    {
      title: 'ช่วงเวลาไฟแดง (s)',
      key: 'red',
      align: 'center',
      width: 180,
      render: (_, row) => phaseCell(row, String(row.redSec)),
    },
    {
      title: 'รวม PCU',
      key: 'pcu',
      align: 'center',
      width: 140,
      render: (_, row) => phaseCell(row, row.pcu.toFixed(2)),
    },
    {
      title: 'ประสิทธิภาพ (%)',
      key: 'efficiency',
      align: 'center',
      width: 160,
      render: (_, row) => phaseCell(row, `${row.efficiency.toFixed(2)} %`),
    },
    {
      title: 'ประหยัดเวลา (m)',
      key: 'timeSaved',
      align: 'center',
      width: 160,
      render: (_, row) => phaseCell(row, row.timeSaved.toFixed(2)),
    },
    {
      title: 'ลดปริมาณ CO2 (kg)',
      key: 'co2',
      align: 'center',
      width: 180,
      render: (_, row) => phaseCell(row, row.co2.toFixed(2)),
    },
  ]

  return (
    <Table<RowData>
      rowKey='id'
      columns={columns}
      dataSource={rows}
      pagination={{
        current: pagination.page,
        pageSize: pagination.limit,
        total: data?.meta_data.count ?? 0,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total, range) =>
          `${range[1] - range[0] + 1} จาก ${total}`,
        onChange: (page, limit) => setPagination({ page, limit }),
      }}
      size='middle'
      scroll={{ x: 1300 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableSummaryTraffic)
