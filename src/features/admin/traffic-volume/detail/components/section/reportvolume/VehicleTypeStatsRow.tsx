"use client"
import React from 'react'
import { fmtNumber } from '@/utils/formatNumber'
import type { VehicleTypeReportSummary } from './data/reportMock'

interface Props {
  summary: VehicleTypeReportSummary
}

interface CellProps {
  value: React.ReactNode
  label: string
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

/** Stats row for the รายงานวิเคราะห์ตามประเภทรถ view. Uses a different
 *  set of KPIs than the daily/hourly/monthly summary (dominant vehicle,
 *  light-vehicle share, truck count) — see screenshot in the spec. */
const VehicleTypeStatsRow: React.FC<Props> = ({ summary }) => (
  <div
    className='rounded-[14px] px-6 py-5 grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4'
    style={{ background: '#191919' }}
  >
    <Cell
      value={fmtNumber(summary.daysCount, 0)}
      label='จำนวนรายการ'
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
      value={summary.dominantVehicleLabel}
      label='ประเภทรถหลัก'
      color='#00FF00'
    />
    <Cell
      value={`${fmtNumber(summary.dominantVehiclePercent, 1)}%`}
      label='สัดส่วนรถประเภทหลัก'
      color='#C8FF00'
    />
    <Cell
      value={`${fmtNumber(summary.lightVehiclePercent, 1)}%`}
      label='ยานพาหนะเบา'
      color='#FFC800'
    />
    <Cell
      value={fmtNumber(summary.truckCount, 0)}
      label='จำนวนรถบรรทุก (คัน)'
      color='#FF5E00'
    />
    <Cell
      value={`${fmtNumber(summary.truckPercent, 1)}%`}
      label='รถบรรทุก'
      color='#FF2B00'
    />
  </div>
)

export default React.memo<Props>(VehicleTypeStatsRow)
