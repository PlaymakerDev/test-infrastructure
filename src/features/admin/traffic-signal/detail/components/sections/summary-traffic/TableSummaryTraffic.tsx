"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useTrafficReports } from '@/hooks/queries/traffic-signal'
import { fmtNumber } from '@/utils/formatNumber'
import { thaiDayName } from '@/utils/formatDate'
import { useDetailContext } from '../../../context'

interface Props {
  /** Inclusive start of date range (YYYY-MM-DD). */
  startDate: string
  /** Inclusive end of date range (YYYY-MM-DD). */
  endDate: string
}

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

const TableSummaryTraffic: React.FC<Props> = ({ startDate, endDate }) => {
  const { project } = useDetailContext()
  const phaseCount = project.phase

  // Fetch the full selected window in one request — backend pagination is
  // unreliable across pages (page=2 sometimes returns empty), and the data
  // is small enough (≤ ~7 days × phases) for client-side slicing.
  const { data } = useTrafficReports(project.id, {
    page: 1,
    limit: 100,
    start_date: startDate,
    end_date: endDate,
  })

  /** Flatten 7-day API response into per-phase rows + compute rowSpan for
   *  the date column. Backend already slices by phase; we just lay them out. */
  const rows = useMemo<RowData[]>(() => {
    const out: RowData[] = []
    for (const day of data?.res_data ?? []) {
      const phasesForDay = day.data.slice(0, phaseCount)
      const dateLabel = `วัน${thaiDayName(day.day)}\n${dayjs(day.date).locale('th').format('D MMM BBBB')}`
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
      width: 100,
      render: (_, row) => phaseCell(row, String(row.phase)),
    },
    {
      title: 'ช่วงเวลาไฟเขียว (s)',
      key: 'green',
      width: 180,
      render: (_, row) => phaseCell(row, fmtNumber(row.greenSec, 2)),
    },
    {
      title: 'ช่วงเวลาไฟแดง (s)',
      key: 'red',
      width: 180,
      render: (_, row) => phaseCell(row, fmtNumber(row.redSec, 2)),
    },
    {
      title: 'รวม PCU',
      key: 'pcu',
      width: 140,
      render: (_, row) => phaseCell(row, fmtNumber(row.pcu, 2)),
    },
    {
      title: 'ประสิทธิภาพ (%)',
      key: 'efficiency',
      width: 160,
      render: (_, row) => phaseCell(row, `${fmtNumber(row.efficiency, 2)} %`),
    },
    {
      title: 'ประหยัดเวลา (m)',
      key: 'timeSaved',
      width: 160,
      render: (_, row) => phaseCell(row, fmtNumber(row.timeSaved, 2)),
    },
    {
      title: 'ลดปริมาณ CO2 (kg)',
      key: 'co2',
      width: 180,
      render: (_, row) => phaseCell(row, fmtNumber(row.co2, 2)),
    },
  ]

  return (
    <Table<RowData>
      rowKey='id'
      columns={columns}
      dataSource={rows}
      // Show the full 7-day window at once (no paging) — all rows down the page.
      pagination={false}
      size='middle'
      scroll={{ x: 1300 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableSummaryTraffic)
