"use client"
import React, { useRef, useState } from 'react'
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
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'
import { thaiDateBE } from '@/utils/thaiDate'
import {
  useTrafficVolumeAnalyticGraph,
  useTrafficVolumeAnalyticSummary,
  useTrafficVolumeSpeedPercentile,
} from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import type { PdfKvItem, PdfReportBlock } from '@/utils/export/pdf'

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
  const { id, location } = useDetailContext()
  // Date filter — hoisted up so every fetch on this tab uses the same
  // selected date. FilterBarAnalytic notifies via `onDateChange`; we
  // serialize to "YYYY-MM-DD" once and pass that string down.
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const dateStr = date ? date.format('YYYY-MM-DD') : undefined
  const [exportOpen, setExportOpen] = useState(false)
  // Wraps the two detail panels — the export captures every ECharts
  // instance inside (percentile CDF + hourly pattern, in DOM order).
  const panelsRef = useRef<HTMLElement | null>(null)

  const { data } = useTrafficVolumeAnalyticSummary({
    solution_id: id,
    date: dateStr,
  })
  // Same params as the two panels below — TanStack dedupes, so these read
  // from the cache the panels already filled (no extra requests).
  const { data: speedData } = useTrafficVolumeSpeedPercentile({
    solution_id: id,
    date: dateStr,
  })
  const { data: graphData } = useTrafficVolumeAnalyticGraph({
    solution_id: id,
    date: dateStr,
  })

  const ts = data?.traffic_summary
  const ta = data?.traffic_analytic
  const vd = data?.vehicle_distribution
  const vy = data?.vehicle_density

  // ── Export (PDF only — this tab is a chart report) ────────────────────────
  // Every value below uses the SAME formatting expression as the on-screen
  // component it mirrors (AnalyticStatCard rows / PercentileSpeedPanel /
  // TrafficPatternPanel), so the PDF always matches the screen.
  const handleExportPdf = async () => {
    const [{ exportReportPdf }, { captureEchartsPng }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/chart'),
    ])

    const percentiles = speedData?.percentiles?.[0]
    const fmtPct = (arr?: number[]): string => (arr && arr.length > 0 ? String(arr[0]) : '-')
    const stats = speedData?.stats?.find((s) => s._id === null) ?? speedData?.stats?.[0]
    const fmt = (n: number | undefined, decimals = 1): string => (n == null ? '-' : n.toFixed(decimals))
    const speedRange =
      stats != null ? `${(stats.maxSpeed - stats.minSpeed).toFixed(1)} กม./ชม.` : '-'
    const g = graphData

    const charts = panelsRef.current ? await captureEchartsPng(panelsRef.current) : []

    const kv = (title: string, items: PdfKvItem[]): PdfReportBlock => ({ type: 'kv', title, items })
    const blocks: PdfReportBlock[] = [
      kv('ปริมาณจราจรประจำวัน', [
        { label: 'Peak Period', value: ts?.peak_period ?? '-' },
        { label: 'Peak Volume', value: ts ? `${fmtNumber(ts.peak_volume, 0)} คัน` : '-' },
        { label: 'อัตราการไหล', value: ts ? `${fmtNumber(ts.traffic_flow, 1)} PCU / ชั่วโมง` : '-' },
        { label: 'V/C Ratio', value: ts ? fmtNumber(ts.vc_ratio, 1) : '-' },
      ]),
      kv('การวิเคราะห์ปริมาณจราจร', [
        { label: 'ปริมาณจราจร 24 ชั่วโมง', value: ta ? `${fmtNumber(ta.total_count, 0)} คัน` : '-' },
        { label: 'PCU รวม', value: ta ? `${fmtNumber(ta.total_pcu, 1)} PCU` : '-' },
        { label: 'ปริมาณสูงสุด / ชั่วโมง', value: ta ? `${fmtNumber(ta.peak_hour, 0)} คัน` : '-' },
        { label: 'Peak Hour Factor', value: ta ? fmtNumber(ta.peak_hour_factor, 1) : '-' },
      ]),
      kv('การกระจายยานพาหนะ', [
        { label: 'ยานพาหนะหลัก', value: vd?.main_vehicle ?? '-' },
        { label: 'ปริมาณสูงสุด', value: vd ? `${fmtNumber(vd.main_vehicle_count, 0)} คัน` : '-' },
        { label: 'รถบรรทุกหนัก', value: vd ? `${fmtNumber(vd.truck_percent, 1)}%` : '-' },
        { label: 'PCU เฉลี่ย', value: vd ? fmtNumber(vd.main_pcu_hour, 1) : '-' },
      ]),
      kv('ความหนาแน่นจราจร', [
        { label: 'LOS Grade', value: vy?.level_of_service ?? '-' },
        { label: 'สถานะ', value: vy?.status ?? '-' },
        { label: 'ความหนาแน่น', value: vy?.density ?? '-' },
        { label: 'คุณภาพการจราจร', value: vy?.service_quality ?? '-' },
      ]),
    ]

    if (charts[0]) {
      blocks.push({ type: 'image', title: '85th Percentile Speed Analysis', ...charts[0] })
    }
    blocks.push(
      kv('ค่าเปอร์เซ็นไทล์ความเร็ว (กม./ชม.)', [
        { label: '95th Percentile', value: fmtPct(percentiles?.p95) },
        { label: '85th Percentile', value: fmtPct(percentiles?.p85) },
        { label: 'Median (50th)', value: fmtPct(percentiles?.p50) },
        { label: '15th Percentile', value: fmtPct(percentiles?.p15) },
      ]),
      kv('สถิติความเร็ว', [
        { label: 'ความเร็วสูงสุด', value: `${fmt(stats?.maxSpeed)} กม./ชม.` },
        { label: 'ความเร็วต่ำสุด', value: `${fmt(stats?.minSpeed)} กม./ชม.` },
        { label: 'ความเร็วเฉลี่ย', value: `${fmt(stats?.avgSpeed)} กม./ชม.` },
        { label: 'ช่วงความเร็ว', value: speedRange },
        { label: 'ส่วนเบี่ยงเบนมาตรฐาน', value: fmt(stats?.stdDev) },
        { label: 'จุดข้อมูลทั้งหมด', value: stats ? stats.count.toLocaleString() : '-' },
      ])
    )

    if (charts[1]) {
      blocks.push({ type: 'image', title: 'วิเคราะห์รูปแบบการจราจร', ...charts[1] })
    }
    blocks.push(
      kv('ตัวชี้วัดรูปแบบการจราจร', [
        { label: 'ค่าสัมประสิทธิ์ผันแปร (CV)', value: g ? `${g.cv.toFixed(1)}%` : '-' },
        {
          label: 'ช่วงเวลาปริมาณจราจรสูงสุด',
          value: g ? `${g.peak_hour} น. (${g.peak_volume.toLocaleString()} คัน)` : '-',
        },
        { label: 'Peak Hour Factor (PHF)', value: g ? g.phf.toFixed(1) : '-' },
        { label: 'V/C Ratio', value: g ? g.vc_ratio.toFixed(1) : '-' },
      ]),
      kv('ลักษณะการไหลของจราจร', [
        { label: 'Rush Hour Pattern', value: g?.flow_characteristic.rush_hour_patten ?? '-' },
        { label: 'Traffic Density', value: g?.flow_characteristic.taffic_density ?? '-' },
        { label: 'Flow Stability', value: g?.flow_characteristic.flow_stability ?? '-' },
        { label: 'Congestion Level', value: g?.flow_characteristic.congestion_level ?? '-' },
      ]),
      kv('การกระจายตามช่วงเวลา', [
        {
          label: 'Morning Peak (07-09)',
          value: g ? `${g.peak_time.morning_peak.avg_volume.toLocaleString()} คัน/ชั่วโมง` : '-',
        },
        {
          label: 'Evening Peak (17-19)',
          value: g ? `${g.peak_time.evening_peak.avg_volume.toLocaleString()} คัน/ชั่วโมง` : '-',
        },
        {
          label: 'Off-Peak Average',
          value: g ? `${g.peak_time.off_peak.avg_volume.toLocaleString()} คัน/ชั่วโมง` : '-',
        },
        { label: 'Peak/Off-Peak Ratio', value: g?.peak_time.peak_off_peak_ratio ?? '-' },
      ]),
      kv('การประเมินคุณภาพการจราจร', [
        {
          label: 'Level of Service',
          value: g ? `${g.traffic_quality.level_of_service} (${g.traffic_quality.status})` : '-',
        },
        { label: 'Traffic Variability', value: g?.traffic_quality.traffic_variability ?? '-' },
        {
          label: 'Capacity Utilization',
          value: g ? `${g.traffic_quality.capacity_utilization.toFixed(1)}%` : '-',
        },
        {
          label: 'Flow Efficiency',
          value: g ? `${g.traffic_quality.flow_efficiency.toFixed(1)}%` : '-',
        },
      ])
    )

    const noteParts = [
      location?.solution?.solution_name,
      dateStr ? `วันที่ ${thaiDateBE(dateStr)}` : undefined,
    ].filter(Boolean)

    await exportReportPdf({
      filenameBase: 'Traffic_Volume_Analysis',
      title: 'รายงานวิเคราะห์ปริมาณจราจร (Traffic Volume Analysis)',
      subtitleNote: noteParts.length ? noteParts.join(' · ') : undefined,
      blocks,
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <FilterBarAnalytic
        defaultDate={date ?? undefined}
        onDateChange={setDate}
        onExport={() => setExportOpen(true)}
      />

      {/* ── นำออกเอกสาร — chart report: PDF only, no Excel. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExportPdf={handleExportPdf}
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
              value: ts ? `${fmtNumber(ts.traffic_flow, 1)} PCU / ชั่วโมง` : '-',
              highlight: true,
            },
            {
              label: 'V/C Ratio',
              value: ts ? fmtNumber(ts.vc_ratio, 1) : '-',
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
              value: ta ? `${fmtNumber(ta.total_pcu, 1)} PCU` : '-',
            },
            {
              label: 'ปริมาณสูงสุด / ชั่วโมง',
              value: ta ? `${fmtNumber(ta.peak_hour, 0)} คัน` : '-',
              highlight: true,
            },
            {
              label: 'Peak Hour Factor',
              value: ta ? fmtNumber(ta.peak_hour_factor, 1) : '-',
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
              value: vd ? fmtNumber(vd.main_pcu_hour, 1) : '-',
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
      <section ref={panelsRef} className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <PercentileSpeedPanel date={dateStr} />
        <TrafficPatternPanel date={dateStr} />
      </section>
    </div>
  )
}

export default React.memo<Props>(AnalyticVolume)
