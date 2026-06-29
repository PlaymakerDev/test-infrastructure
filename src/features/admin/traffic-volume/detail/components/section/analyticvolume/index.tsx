"use client"
import React, { useState } from 'react'
import {
  TbAccessPoint,
  TbAtom2,
  TbGridDots,
  TbHexagonalPrism,
} from 'react-icons/tb'
import dayjs, { type Dayjs } from 'dayjs'
import AnalyticStatCard from './AnalyticStatCard'
import FilterBarAnalytic from './FilterBarAnalytic'
import PercentileSpeedPanel from './PercentileSpeedPanel'
import TrafficPatternPanel from './TrafficPatternPanel'
import { fmtNumber } from '@/utils/formatNumber'
import { useTrafficVolumeAnalyticSummary } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'

interface Props {}

// Per-card accent colors per the spec.
const COLOR_DAILY    = '#C8FF00' // ปริมาณจราจรประจำวัน
const COLOR_ANALYSIS = '#00FF55' // การวิเคราะห์ปริมาณจราจร
const COLOR_DIST     = '#00FFDD' // การกระจายยานพาหนะ
const COLOR_DENSITY  = '#0099FF' // ความหนาแน่นจราจร

/** Tab content for "วิเคราะห์ปริมาณจราจร". Layout per design:
 *  • TOP — date picker + export button.
 *  • ROW — 4 analytic stat cards (one per metric domain). On narrow viewports
 *    the row collapses to 2-up (md) and then 1-up (sm).
 *  • DETAIL — Percentile + Traffic pattern panels below. */
const AnalyticVolume: React.FC<Props> = () => {
  const { id } = useDetailContext()
  // Date filter — hoisted up so every fetch on this tab uses the same
  // selected date. FilterBarAnalytic notifies via `onDateChange`; we
  // serialize to "YYYY-MM-DD" once and pass that string down.
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const dateStr = date ? date.format('YYYY-MM-DD') : undefined

  const { data } = useTrafficVolumeAnalyticSummary({
    solution_id: id,
    date: dateStr,
  })

  const ts = data?.traffic_summary
  const ta = data?.traffic_analytic
  const vd = data?.vehicle_distribution
  const vy = data?.vehicle_density

  return (
    <div className='flex flex-col gap-6'>
      <FilterBarAnalytic
        defaultDate={date ?? undefined}
        onDateChange={setDate}
      />

      <section className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
        <AnalyticStatCard
          icon={<TbAccessPoint size={18} />}
          title='ปริมาณจราจรประจำวัน'
          color={COLOR_DAILY}
          rows={[
            { label: 'Peak Period', value: ts?.peak_period ?? '-' },
            {
              label: 'Peak Volume',
              value: ts ? `${fmtNumber(ts.peak_volume, 0)} คัน` : '-',
            },
            {
              label: 'อัตราการไหล',
              value: ts ? `${fmtNumber(ts.traffic_flow, 2)} PCU / ชั่วโมง` : '-',
              highlight: true,
            },
            {
              label: 'V/C Ratio',
              value: ts ? fmtNumber(ts.vc_ratio, 3) : '-',
            },
          ]}
        />

        <AnalyticStatCard
          icon={<TbAtom2 size={18} />}
          title='การวิเคราะห์ปริมาณจราจร'
          color={COLOR_ANALYSIS}
          rows={[
            {
              label: 'ปริมาณจราจร 24 ชั่วโมง',
              value: ta ? `${fmtNumber(ta.total_count, 0)} คัน` : '-',
            },
            {
              label: 'PCU รวม',
              value: ta ? `${fmtNumber(ta.total_pcu, 2)} PCU` : '-',
            },
            {
              label: 'ปริมาณสูงสุด / ชั่วโมง',
              value: ta ? `${fmtNumber(ta.peak_hour, 0)} คัน` : '-',
              highlight: true,
            },
            {
              label: 'Peak Hour Factor',
              value: ta ? fmtNumber(ta.peak_hour_factor, 2) : '-',
            },
          ]}
        />

        <AnalyticStatCard
          icon={<TbGridDots size={18} />}
          title='การกระจายยานพาหนะ'
          color={COLOR_DIST}
          rows={[
            { label: 'ยานพาหนะหลัก', value: vd?.main_vehicle ?? '-' },
            {
              label: 'ปริมาณสูงสุด',
              value: vd ? `${fmtNumber(vd.main_vehicle_count, 0)} คัน` : '-',
            },
            {
              label: 'รถบรรทุกหนัก',
              value: vd ? `${fmtNumber(vd.truck_percent, 1)}%` : '-',
              highlight: true,
            },
            {
              label: 'PCU เฉลี่ย',
              value: vd ? fmtNumber(vd.main_pcu_hour, 2) : '-',
            },
          ]}
        />

        <AnalyticStatCard
          icon={<TbHexagonalPrism size={18} />}
          title='ความหนาแน่นจราจร'
          color={COLOR_DENSITY}
          rows={[
            { label: 'LOS Grade', value: vy?.level_of_service ?? '-' },
            { label: 'สถานะ', value: vy?.status ?? '-' },
            { label: 'ความหนาแน่น', value: vy?.density ?? '-', highlight: true },
            { label: 'คุณภาพการจราจร', value: vy?.service_quality ?? '-' },
          ]}
        />
      </section>

      {/* ── Detailed analysis row ───────────────────────────────────────────
        * LEFT  — 85th-percentile speed analysis (cumulative curve + stats)
        * RIGHT — hourly traffic pattern (volume curve + flow assessment)
        * Stacks vertically on narrow viewports. */}
      <section className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <PercentileSpeedPanel date={dateStr} />
        <TrafficPatternPanel date={dateStr} />
      </section>
    </div>
  )
}

export default React.memo<Props>(AnalyticVolume)
