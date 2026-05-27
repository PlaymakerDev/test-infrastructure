"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
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

interface DayPhase {
  phase: number
  greenSec: number
  redSec: number
  pcu: number
  efficiency: number
  timeSaved: number
  co2: number
}

interface DayRow {
  date: string
  phases: DayPhase[]
}

/** Mock data — all entries carry the max 4 phases. The component slices
 *  based on the active project's `phase` count so 3-phase signals only show
 *  P1–P3 rows per day. 7 days worth of data so pagination has something to
 *  paginate. */
const RAW: DayRow[] = [
  {
    date: 'วันศุกร์\n14 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 60, redSec: 18, pcu: 2740.50, efficiency: 86.10, timeSaved: 308.20, co2: 56.80 },
      { phase: 2, greenSec: 62, redSec: 18, pcu: 2980.00, efficiency: 86.20, timeSaved: 312.00, co2: 57.40 },
      { phase: 3, greenSec: 38, redSec: 24, pcu: 2350.75, efficiency: 85.10, timeSaved: 320.15, co2: 26.90 },
      { phase: 4, greenSec: 28, redSec: 36, pcu: 3290.00, efficiency: 85.40, timeSaved: 148.30, co2: 58.50 },
    ],
  },
  {
    date: 'วันเสาร์\n15 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 64, redSec: 17, pcu: 2820.00, efficiency: 86.70, timeSaved: 310.50, co2: 57.60 },
      { phase: 2, greenSec: 64, redSec: 17, pcu: 3020.00, efficiency: 86.50, timeSaved: 318.00, co2: 58.20 },
      { phase: 3, greenSec: 36, redSec: 25, pcu: 2380.50, efficiency: 85.20, timeSaved: 322.40, co2: 27.10 },
      { phase: 4, greenSec: 27, redSec: 37, pcu: 3340.00, efficiency: 85.70, timeSaved: 150.90, co2: 59.20 },
    ],
  },
  {
    date: 'วันอาทิตย์\n16 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 65, redSec: 17, pcu: 2900.25, efficiency: 87.20, timeSaved: 316.80, co2: 58.40 },
      { phase: 2, greenSec: 65, redSec: 17, pcu: 3100.00, efficiency: 87.00, timeSaved: 320.40, co2: 59.10 },
      { phase: 3, greenSec: 39, redSec: 24, pcu: 2420.00, efficiency: 85.50, timeSaved: 328.00, co2: 27.80 },
      { phase: 4, greenSec: 28, redSec: 36, pcu: 3410.00, efficiency: 86.10, timeSaved: 155.20, co2: 60.50 },
    ],
  },
  {
    date: 'วันจันทร์\n17 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 62, redSec: 18, pcu: 2810.50, efficiency: 86.40, timeSaved: 311.20, co2: 57.30 },
      { phase: 2, greenSec: 63, redSec: 18, pcu: 3050.50, efficiency: 86.60, timeSaved: 319.80, co2: 58.10 },
      { phase: 3, greenSec: 37, redSec: 25, pcu: 2390.00, efficiency: 85.30, timeSaved: 325.50, co2: 27.40 },
      { phase: 4, greenSec: 27, redSec: 37, pcu: 3360.00, efficiency: 85.80, timeSaved: 151.80, co2: 59.60 },
    ],
  },
  {
    date: 'วันอังคาร\n18 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 66, redSec: 17, pcu: 2860.75, efficiency: 87.02, timeSaved: 314.53, co2: 58.24 },
      { phase: 2, greenSec: 66, redSec: 17, pcu: 3076.25, efficiency: 86.91, timeSaved: 323.53, co2: 58.93 },
      { phase: 3, greenSec: 37, redSec: 25, pcu: 2406.00, efficiency: 85.37, timeSaved: 327.40, co2: 27.56 },
      { phase: 4, greenSec: 26, redSec: 38, pcu: 3399.00, efficiency: 85.95, timeSaved: 153.13, co2: 60.36 },
    ],
  },
  {
    date: 'วันพุธ\n18 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 66, redSec: 17, pcu: 2860.75, efficiency: 87.02, timeSaved: 314.53, co2: 58.24 },
      { phase: 2, greenSec: 66, redSec: 17, pcu: 3076.25, efficiency: 86.91, timeSaved: 323.53, co2: 58.93 },
      { phase: 3, greenSec: 37, redSec: 25, pcu: 2406.00, efficiency: 85.37, timeSaved: 327.40, co2: 27.56 },
      { phase: 4, greenSec: 26, redSec: 38, pcu: 3399.00, efficiency: 85.95, timeSaved: 153.13, co2: 60.36 },
    ],
  },
  {
    date: 'วันพฤหัสบดี\n19 ม.ค. 2565',
    phases: [
      { phase: 1, greenSec: 60, redSec: 17, pcu: 2860.75, efficiency: 87.02, timeSaved: 314.53, co2: 58.24 },
      { phase: 2, greenSec: 40, redSec: 32, pcu: 3076.25, efficiency: 86.91, timeSaved: 323.53, co2: 58.93 },
      { phase: 3, greenSec: 55, redSec: 19, pcu: 2406.00, efficiency: 85.37, timeSaved: 327.40, co2: 27.56 },
      { phase: 4, greenSec: 30, redSec: 40, pcu: 2800.00, efficiency: 84.50, timeSaved: 200.00, co2: 50.00 },
    ],
  },
]

const TableSummaryTraffic: React.FC<Props> = () => {
  const { project } = useDetailContext()
  const phaseCount = project.phase

  // Flatten + slice phases per day to match the project's phase count, then
  // assign rowSpan for the date column (first row of each day = full span).
  const data = useMemo<RowData[]>(() => {
    const out: RowData[] = []
    for (const day of RAW) {
      const phasesForDay = day.phases.slice(0, phaseCount)
      phasesForDay.forEach((p, i) => {
        out.push({
          id: `${day.date}-${p.phase}`,
          date: day.date,
          dateSpan: i === 0 ? phasesForDay.length : 0,
          phase: p.phase,
          greenSec: p.greenSec,
          redSec: p.redSec,
          pcu: p.pcu,
          efficiency: p.efficiency,
          timeSaved: p.timeSaved,
          co2: p.co2,
        })
      })
    }
    return out
  }, [phaseCount])

  // Helper — every data cell in a phase row uses the phase's color (Figma).
  // The วันที่ column (rowSpan) keeps the default white.
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
      dataSource={data}
      // Default pageSize = phaseCount × 3 → 3 days per page so the วันที่
      // rowSpan doesn't split across pages. User can change via the page-size
      // selector. Format mirrors Crosswalk's table.
      pagination={{
        defaultPageSize: phaseCount * 3,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total, range) => `${range[1] - range[0] + 1} จาก ${total}`,
      }}
      size='middle'
      scroll={{ x: 1300 }}
      className='bridge-projects-table'
    />
  )
}

export default React.memo<Props>(TableSummaryTraffic)
