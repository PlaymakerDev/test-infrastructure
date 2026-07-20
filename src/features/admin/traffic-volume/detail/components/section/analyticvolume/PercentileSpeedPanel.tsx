"use client"
import React, { useMemo } from 'react'
import {
  TbAppWindow,
  TbChartBar,
  TbGridDots,
  TbHelpCircle,
  TbShare,
} from 'react-icons/tb'
import LineChart, { type LineChartDataPoint } from '@/components/chart/LineChart'
import MiniStatCard from './MiniStatCard'
import InfoListBox from './InfoListBox'
import { useTrafficVolumeSpeedPercentile } from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { CountingSpeedCdfPoint } from '@/types/traffic-volume/detail-api'

interface Props {
  /** YYYY-MM-DD — selected by the FilterBarAnalytic. Forwarded to the
   *  speed_percentile hook so the chart + cards filter by date. */
  date?: string
}

// Reference Y level (%) for the dashed yellow guideline — the 85th-percentile
// line on the cumulative speed-distribution chart (85% cumulative). Visual-only
// guide; the actual 85th-percentile SPEED value comes from `percentiles.p85`.
const REFERENCE_PCT = 85

/** API point → LineChart data row. Only `speed` (X-axis) and `percentage`
 *  (cumulative Y) are used; the rest of the API row is ignored per design. */
const cdfToDataPoint = (p: CountingSpeedCdfPoint): LineChartDataPoint => ({
  label: String(p.speed),
  cum: Math.round(p.percentage * 10) / 10,
  // Flat reference series for the dashed yellow line.
  ref: REFERENCE_PCT,
  // Stored on the point so `tooltipFooter` can read it per-hover.
  speed: p.speed,
})

const PercentileSpeedPanel: React.FC<Props> = ({ date }) => {
  const { id } = useDetailContext()
  const { data: apiData } = useTrafficVolumeSpeedPercentile({
    solution_id: id,
    date,
  })

  const data = useMemo<LineChartDataPoint[]>(() => {
    // API wraps the points under `cdf[0].points` — flatten to a single
    // series for the chart.
    const points = apiData?.cdf?.[0]?.points ?? []
    const rows = points.map(cdfToDataPoint)
    // A line needs ≥2 points to render, and LineChart hides single-point
    // symbols — so a lone API point (e.g. one { speed:50, percentage:100 })
    // would show nothing at all. Keep BOTH the real data and the dashed
    // 85th-percentile line visible:
    //   • 1 point  → prepend a (0 km/h, 0%) CDF origin so the cumulative curve
    //                rises to the measured point and the dashed line spans it.
    //   • 0 points → two flat endpoints so at least the dashed 85 line shows.
    if (rows.length === 1) {
      return [{ label: '0', cum: 0, ref: REFERENCE_PCT, speed: 0 }, rows[0]]
    }
    if (rows.length === 0) {
      return [
        { label: '0', cum: 0, ref: REFERENCE_PCT, speed: 0 },
        { label: '100', cum: 0, ref: REFERENCE_PCT, speed: 100 },
      ]
    }
    return rows
  }, [apiData])

  /** Mini cards read from `percentiles[0]`. Each percentile field is an
   *  array — backend may report ties at the boundary; pick the first entry
   *  and fall back to `-` when missing. */
  const percentiles = apiData?.percentiles?.[0]
  const fmtPct = (arr?: number[]): string =>
    arr && arr.length > 0 ? String(arr[0]) : '-'

  /** Raw speed stats — drives the "สถิติความเร็ว" info box rows. The
   *  backend may return multiple stat groups (split by direction / vehicle
   *  type, etc.); the aggregate row is the one with `_id: null`. Prefer
   *  that entry; fall back to `stats[0]` only when no `_id: null` exists. */
  const stats =
    apiData?.stats?.find((s) => s._id === null) ?? apiData?.stats?.[0]
  const fmt = (n: number | undefined, decimals = 1): string =>
    n == null ? '-' : n.toFixed(decimals)
  const speedRange =
    stats != null ? `${(stats.maxSpeed - stats.minSpeed).toFixed(1)} กิโลเมตร / ชั่วโมง` : '-'

  return (
    <div
      className='rounded-[14px] p-4 flex flex-col gap-4'
      style={{ background: '#000000CC' }}
    >
      {/* Header */}
      <div className='flex items-center gap-2'>
        <TbShare size={20} className='text-(--yellow)' />
        <span className='fs-14 text-(--yellow)'>
          85th Percentile Speed Analysis
        </span>
      </div>

      {/* Chart — cumulative percentile vs speed.
        * • `cum`  — solid blue actual curve.
        * • `ref`  — dashed yellow reference at 90% (the 85th-percentile design
        *           line). `hideInTooltip` keeps it from cluttering the popup. */}
      <LineChart
        title=''
        icon={null}
        showGlow={false}
        iconCircle={false}
        cardBackground='transparent'
        cardBorderColor='transparent'
        data={data}
        lines={[
          { dataKey: 'cum', color: '#66AEFF', label: 'เปอร์เซ็นต์สะสม', unit: '%' },
          {
            dataKey: 'ref',
            color: '#FCD116',
            label: 'reference',
            dashed: true,
            hideInTooltip: true,
          },
        ]}
        height={300}
        yAxisTicks={[0, 25, 50, 75, 100]}
        tooltipFooter={(idx) => {
          const p = data[idx]
          const speed = p?.speed ?? p?.label
          const cum = p?.cum
          if (speed == null || cum == null) return ''
          return `
            <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:8px;padding-top:8px;text-align:center;">
              <div style="color:#66AEFF;font-size:13px;font-weight:700;">${speed} กิโลเมตร / ชั่วโมง</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px;">${cum}% ของยานพาหนะ</div>
              <div style="color:rgba(255,255,255,0.6);font-size:11px;">ขับด้วยความเร็วไม่เกิน ${speed} กิโลเมตร / ชั่วโมง</div>
            </div>
          `
        }}
      />

      {/* 4 percentile mini cards — colors per spec (yellow / lime / mint / sky).
        * Values pulled from `percentiles[0]` on the same speed_percentile API. */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <MiniStatCard
          color='#FCD116'
          value={fmtPct(percentiles?.p95)}
          label='95th Percentile'
          sublabel='กิโลเมตร / ชั่วโมง'
        />
        <MiniStatCard
          color='#80FF00'
          value={fmtPct(percentiles?.p85)}
          label='85th Percentile'
          sublabel='กิโลเมตร / ชั่วโมง'
        />
        <MiniStatCard
          color='#2CEABE'
          value={fmtPct(percentiles?.p50)}
          label='Median (50th)'
          sublabel='กิโลเมตร / ชั่วโมง'
        />
        <MiniStatCard
          color='#00DDFF'
          value={fmtPct(percentiles?.p15)}
          label='15th Percentile'
          sublabel='กิโลเมตร / ชั่วโมง'
        />
      </div>

      {/* Two info boxes side-by-side — `flex-1` keeps the layout intent
        * symmetric with TrafficPatternPanel. */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 flex-1'>
        <InfoListBox
          icon={<TbChartBar />}
          title='สถิติความเร็ว'
          titleColor='#FF6200'
          rows={[
            {
              label: 'ความเร็วสูงสุด',
              value: `${fmt(stats?.maxSpeed)} กิโลเมตร / ชั่วโมง`,
            },
            {
              label: 'ความเร็วต่ำสุด',
              value: `${fmt(stats?.minSpeed)} กิโลเมตร / ชั่วโมง`,
            },
            {
              label: 'ความเร็วเฉลี่ย',
              value: `${fmt(stats?.avgSpeed)} กิโลเมตร / ชั่วโมง`,
              highlight: true,
            },
            { label: 'ช่วงความเร็ว', value: speedRange },
            {
              label: 'ส่วนเบี่ยงเบนมาตรฐาน',
              value: fmt(stats?.stdDev),
            },
          ]}
        />
        <InfoListBox
          icon={<TbAppWindow />}
          title='คุณภาพข้อมูล'
          titleColor='#FF9500'
          rows={[
            {
              label: 'จุดข้อมูลทั้งหมด',
              value: stats ? stats.count.toLocaleString() : '-',
            },
            {
              // "From midnight until current time" — hours elapsed today.
              label: 'ชั่วโมงวิเคราะห์',
              value: `${new Date().getHours()} ชั่วโมง`,
            },
            {
              label: 'ข้อมูลจริง',
              value: stats ? `${stats.count.toLocaleString()} จุด` : '-',
            },
            { label: 'ข้อมูลประมาณการ', value: '0 จุด' },
            { label: 'ความแม่นยำ', value: 'สูง', highlight: true },
          ]}
        />
      </div>

      {/* Distribution row */}
      <div
        className='rounded-lg p-3'
        style={{ background: '#191919' }}
      >
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <TbGridDots size={18} className='text-emerald-400' />
            <span className='fs-13 font-semibold text-emerald-400'>
              การกระจายความเร็ว
            </span>
          </div>
          <span className='flex items-center gap-1.5 fs-12 text-white/40'>
            <TbHelpCircle size={14} />
            85th Percentile ใช้กำหนดขีดจำกัดความเร็ว
          </span>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-center'>
          {[
            { tone: '#22C55E', label: 'ความเร็วต่ำ (15th)', value: fmtPct(percentiles?.p15), share: '15% ของรถ' },
            { tone: '#06B6D4', label: 'ความเร็วปกติ (50th)', value: fmtPct(percentiles?.p50), share: '50% ของรถ' },
            { tone: '#F59E0B', label: 'ความเร็วสูง (85th)', value: fmtPct(percentiles?.p85), share: '85% ของรถ' },
            { tone: '#F97316', label: 'ความเร็วสูงสุด (95th)', value: fmtPct(percentiles?.p95), share: '95% ของรถ' },
          ].map((c) => (
            <div key={c.label} className='flex flex-col items-center'>
              <span className='fs-12 text-white/55'>{c.label}</span>
              <span
                className='fs-22 font-bold tabular-nums leading-tight mt-1'
                style={{ color: c.tone }}
              >
                {c.value}
              </span>
              <span className='fs-12 text-white/50'>กิโลเมตร / ชั่วโมง</span>
              <span className='fs-12 text-white/40 mt-0.5'>{c.share}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(PercentileSpeedPanel)
