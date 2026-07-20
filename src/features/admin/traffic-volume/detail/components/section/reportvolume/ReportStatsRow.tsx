"use client"
import React from 'react'
import { fmtNumber } from '@/utils/formatNumber'
import type { DailyReportSummary } from './data/reportMock'

/** Time-unit driving the labels — switches between "วัน / ชั่วโมง / เดือน / ปี"
 *  in the count cell and the per-unit average / max cells. Numeric values
 *  stay the same; only the label text varies. */
export type ReportStatsUnit = 'day' | 'hour' | 'month' | 'year'

interface Props {
  summary: DailyReportSummary
  unit?: ReportStatsUnit
}

interface CellProps {
  value: React.ReactNode
  label: string
  /** Tint for the big number. */
  color: string
}

const Cell: React.FC<CellProps> = ({ value, label, color }) => (
  <div className='flex flex-col items-center text-center'>
    <span
      className='fs-22 font-bold tabular-nums leading-tight'
      style={{ color }}
    >
      {value}
    </span>
    <span className='fs-12 text-white/65 mt-1'>{label}</span>
  </div>
)

/** Thai noun for the active time-unit. Used in the "ต่อ{unit}" suffix on
 *  the per-unit average / max cells. */
const UNIT_LABEL: Record<ReportStatsUnit, string> = {
  day: 'วัน',
  hour: 'ชั่วโมง',
  month: 'เดือน',
  year: 'ปี',
}

/** Label for the first (count) cell. Hour view shows "จำนวนรายการ" because
 *  the underlying value counts data points (hours collected), not a wall-
 *  clock duration. The other units mirror their unit noun. */
const UNIT_COUNT_LABEL: Record<ReportStatsUnit, string> = {
  day: 'จำนวนวัน',
  hour: 'จำนวนรายการ',
  month: 'จำนวนเดือน',
  year: 'จำนวนปี',
}

/** 8-KPI summary row sitting between the toolbar and the active report
 *  table. Each metric is color-coded per the design. Labels for the count
 *  + per-unit cells switch with `unit` (day/hour/month/year). */
const ReportStatsRow: React.FC<Props> = ({ summary, unit = 'day' }) => {
  const u = UNIT_LABEL[unit]
  return (
    <div
      className='rounded-[14px] px-6 py-5 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4'
      style={{ background: '#191919' }}
    >
      <Cell
        value={fmtNumber(summary.daysCount, 0)}
        label={UNIT_COUNT_LABEL[unit]}
        color='#007BFF'
      />
      <Cell
        value={fmtNumber(summary.totalVehicles, 0)}
        label='จำนวนยานพาหนะ (คัน)'
        color='#00DDFF'
      />
      <Cell
        value={fmtNumber(summary.totalPCU, 1)}
        label='รวมเฉลี่ย PCU'
        color='#00FFAA'
      />
      <Cell
        value={fmtNumber(summary.avgVehiclesPerDay, 0)}
        label={`เฉลี่ยยานพาหนะคันต่อ${u}`}
        color='#00FF00'
      />
      <Cell
        value={fmtNumber(summary.avgPCUPerDay, 1)}
        label={`เฉลี่ย PCU ต่อ${u}`}
        color='#C8FF00'
      />
      <Cell
        value={fmtNumber(summary.maxVehiclesPerDay, 0)}
        label={`ยานพาหนะสูงสุดคันต่อ${u}`}
        color='#FFC800'
      />
      <Cell
        value={fmtNumber(summary.maxPCUPerDay, 1)}
        label={`PCU สูงสุดต่อ${u}`}
        color='#FF5E00'
      />
      <Cell
        value={`${fmtNumber(summary.truckPercent, 1)}%`}
        label='รถบรรทุก'
        color='#FF2B00'
      />
    </div>
  )
}

export default React.memo<Props>(ReportStatsRow)
