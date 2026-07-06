"use client"
import React, { useMemo } from 'react'
import { TbCar, TbGridDots, TbShare } from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import MiniStatCard from './MiniStatCard'
import InfoListBox from './InfoListBox'
import { thaiDateBE } from '@/utils/thaiDate'
import { useTrafficVolumeAnalyticGraph } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { CountingAnalyticGraphPoint } from '@/types/traffic-volume/detail-api'

interface Props {
  /** YYYY-MM-DD — selected by the FilterBarAnalytic. Forwarded to the
   *  analytic-graph hook so the chart + cards filter by date. */
  date?: string
}

/** API hour bucket → LineChart data row.
 *  • `actual`    → `total_count` (solid blue)
 *  • `reference` → `ma_3h_total` (dashed yellow)
 *  • `label`     → "HH.00" taken straight from the ISO string (the API
 *    stamps each hour with the Bangkok offset `+07:00`; parsing through
 *    dayjs would shift the hour to the browser's local timezone, which
 *    breaks the display for anyone outside +07:00).
 *  • `dateLabel` → "D ก.ค. 2569" Thai BE header for the tooltip (thaiDateBE). */
const apiPointToDataPoint = (p: CountingAnalyticGraphPoint): LineChartDataPoint => {
  // ISO format is fixed at "YYYY-MM-DDTHH:mm:ss+ZZ:ZZ" — slice the
  // hour (chars 11-12) and date (chars 0-9) directly.
  const hh = p.hour_timestamp.slice(11, 13)
  const dateStr = p.hour_timestamp.slice(0, 10)
  return {
    label: `${hh}.00`,
    actual: p.total_count,
    reference: Math.round(p.ma_3h_total * 10) / 10,
    dateLabel: thaiDateBE(dateStr),
  }
}

const TrafficPatternPanel: React.FC<Props> = ({ date }) => {
  const { id } = useDetailContext()
  const { data: apiData } = useTrafficVolumeAnalyticGraph({
    solution_id: id,
    date,
  })

  /** Always render 24 hourly slots (00.00 → 23.00). Hours the API hasn't
   *  reported yet (e.g. future hours of the current day) get a label but
   *  no `actual`/`reference` values — the LineChart renders gaps for those
   *  positions instead of dropping the line to 0. */
  const data = useMemo<LineChartDataPoint[]>(() => {
    const byHour = new Map<string, LineChartDataPoint>()
    for (const p of apiData?.graph ?? []) {
      const hh = p.hour_timestamp.slice(11, 13)
      byHour.set(hh, apiPointToDataPoint(p))
    }
    return Array.from({ length: 24 }, (_, h) => {
      const hh = h.toString().padStart(2, '0')
      return byHour.get(hh) ?? { label: `${hh}.00` }
    })
  }, [apiData])

  return (
    <div
      className='rounded-[14px] p-4 flex flex-col gap-4'
      style={{ background: '#000000CC' }}
    >
      {/* Header */}
      <div className='flex items-center gap-2'>
        <TbShare size={20} className='text-(--yellow)' />
        <span className='fs-14 text-(--yellow)'>
          วิเคราะห์รูปแบบการจราจร
        </span>
      </div>

      {/* Chart — hourly volume.
        * • `actual`    — solid blue actual count.
        * • `reference` — dashed yellow reference curve.
        * Both lines are hidden from the tooltip rows; the tooltip footer
        * just shows the deviation ("ส่วนเบี่ยงเบน") between them. */}
      <LineChart
        title=''
        icon={null}
        showGlow={false}
        iconCircle={false}
        cardBackground='transparent'
        cardBorderColor='transparent'
        data={data}
        lines={[
          {
            dataKey: 'actual',
            color: '#66AEFF',
            label: 'จริง',
            unit: 'คัน',
            hideInTooltip: true,
          },
          {
            dataKey: 'reference',
            color: '#FCD116',
            label: 'อ้างอิง',
            unit: 'คัน',
            dashed: true,
            hideInTooltip: true,
          },
        ]}
        height={300}
        tooltipDateKey='dateLabel'
        tooltipFooter={(idx) => {
          const p = data[idx]
          // `actual`    = `total_count`  → "ปริมาณจราจร" (blue solid line)
          // `reference` = `ma_3h_total`  → "ส่วนเบี่ยงเบน" (yellow dashed line)
          const actual = Number(p?.actual ?? 0)
          const reference = Number(p?.reference ?? 0)
          return `
            <div style="text-align:center;margin-top:2px;">
              <span style="color:#66AEFF;font-size:12px;">ปริมาณจราจร : </span>
              <span style="color:#66AEFF;font-size:12px;font-weight:700;">${actual.toLocaleString()} คัน</span>
            </div>
            <div style="text-align:center;margin-top:2px;">
              <span style="color:#FCD116;font-size:12px;">ส่วนเบี่ยงเบน : </span>
              <span style="color:#FCD116;font-size:12px;font-weight:700;">${reference.toLocaleString()} คัน</span>
            </div>
          `
        }}
      />

      {/* 4 mini cards — colors per spec (yellow / lime / mint / sky).
        * Values pulled from the same analytic/graph response (flat fields
        * next to the `graph` array). */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <MiniStatCard
          color='#FCD116'
          value={apiData ? `${apiData.cv.toFixed(1)}%` : '-'}
          label='ค่าสัมประสิทธิ์ผันแปร'
          sublabel='CV (ความแปรปรวน)'
        />
        <MiniStatCard
          color='#80FF00'
          value={apiData ? `${apiData.peak_hour} น.` : '-'}
          label='ช่วงเวลาปริมาณจราจรสูงสุด'
          sublabel={
            apiData ? `${apiData.peak_volume.toLocaleString()} คัน` : '-'
          }
        />
        <MiniStatCard
          color='#2CEABE'
          value={apiData ? apiData.phf.toFixed(1) : '-'}
          label='Peak Hour Factor'
          sublabel='PHF (ความสม่ำเสมอ)'
        />
        <MiniStatCard
          color='#00DDFF'
          value={apiData ? apiData.vc_ratio.toFixed(1) : '-'}
          label='V/C Ratio'
          sublabel='Volume/Capacity'
        />
      </div>

      {/* Two info boxes — `flex-1` absorbs any vertical slack so this panel
        * matches PercentileSpeedPanel's height (which has 5-row info boxes). */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1'>
        <InfoListBox
          icon={<TbCar />}
          title='ลักษณะการไหลของจราจร'
          titleColor='#FF6200'
          rows={[
            {
              label: 'Rush Hour Pattern',
              value: apiData?.flow_characteristic.rush_hour_patten ?? '-',
            },
            {
              label: 'Traffic Density',
              value: apiData?.flow_characteristic.taffic_density ?? '-',
            },
            {
              label: 'Flow Stability',
              value: apiData?.flow_characteristic.flow_stability ?? '-',
            },
            {
              label: 'Congestion Level',
              value: apiData?.flow_characteristic.congestion_level ?? '-',
            },
          ]}
        />
        <InfoListBox
          icon={<TbGridDots />}
          title='การกระจายตามช่วงเวลา'
          titleColor='#FF9500'
          rows={[
            {
              label: 'Morning Peak (07-09)',
              value: apiData
                ? `${apiData.peak_time.morning_peak.avg_volume.toLocaleString()} คัน/ชั่วโมง`
                : '-',
            },
            {
              label: 'Evening Peak (17-19)',
              value: apiData
                ? `${apiData.peak_time.evening_peak.avg_volume.toLocaleString()} คัน/ชั่วโมง`
                : '-',
            },
            {
              label: 'Off-Peak Average',
              value: apiData
                ? `${apiData.peak_time.off_peak.avg_volume.toLocaleString()} คัน/ชั่วโมง`
                : '-',
            },
            {
              label: 'Peak/Off-Peak Ratio',
              value: apiData?.peak_time.peak_off_peak_ratio ?? '-',
            },
          ]}
        />
      </div>

      {/* Quality assessment row */}
      <div
        className='rounded-lg p-3'
        style={{ background: '#191919' }}
      >
        <div className='flex items-center gap-2 mb-3'>
          <TbGridDots size={18} className='text-emerald-400' />
          <span className='fs-13 font-semibold text-emerald-400'>
            การประเมินคุณภาพการจราจร
          </span>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-center'>
          {[
            {
              label: 'Level of Service',
              value: apiData?.traffic_quality.level_of_service ?? '-',
              tone: '#22C55E',
              // `status` from API as sub-label — e.g. "คล่องตัวดีมาก".
              sub: apiData?.traffic_quality.status ?? 'ไหลลื่น',
            },
            {
              label: 'Traffic Variability',
              value: apiData?.traffic_quality.traffic_variability ?? '-',
              tone: '#F59E0B',
              sub: 'ความผันแปร',
            },
            {
              label: 'Capacity Utilization',
              value: apiData
                ? `${apiData.traffic_quality.capacity_utilization.toFixed(1)}%`
                : '-',
              tone: '#06B6D4',
              sub: 'การใช้ความจุ',
            },
            {
              label: 'Flow Efficiency',
              value: apiData
                ? `${apiData.traffic_quality.flow_efficiency.toFixed(1)}%`
                : '-',
              tone: '#3B82F6',
              sub: 'ประสิทธิภาพ',
            },
          ].map((c) => (
            <div key={c.label} className='flex flex-col items-center'>
              <span className='fs-12 text-white/65'>{c.label}</span>
              <span
                className='fs-22 font-bold tabular-nums leading-tight mt-1'
                style={{ color: c.tone }}
              >
                {c.value}
              </span>
              <span className='fs-11 text-white/40 mt-0.5'>{c.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(TrafficPatternPanel)
