"use client"
import React, { useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import FilterBarAnalytic from '../analyticvolume/FilterBarAnalytic'
import StackedHourlyBarChart from './StackedHourlyBarChart'
import PeakHourCards from './PeakHourCards'
import HourlyDataTable from './HourlyDataTable'
import ExportFileModal from '@/components/export/ExportFileModal'
import { fmtNumber } from '@/utils/formatNumber'
import { thaiDateBE } from '@/utils/thaiDate'
import {
  useTrafficVolumeCountHour,
  useTrafficVolumeSolutionCameras,
} from '@/hooks/queries/traffic-volume'
import { useDetailContext } from '../../../context'
import { useDeptId } from '@/hooks/useDeptId'
import { COUNT_FIELD_BY_TYPE, VEHICLE_TYPES } from './data/vehicleTypeKeys'
import type { CountingHourBucket } from '@/types/traffic-volume/detail-api'
import type { PdfReportBlock } from '@/utils/export/pdf'

interface Props {}

/** Same "dominant vehicle type of the hour" pick PeakHourCards renders. */
const dominantType = (b: CountingHourBucket) => {
  let best = VEHICLE_TYPES[0]
  let bestCount = b[COUNT_FIELD_BY_TYPE[best.key]] ?? 0
  for (const t of VEHICLE_TYPES) {
    const c = b[COUNT_FIELD_BY_TYPE[t.key]] ?? 0
    if (c > bestCount) {
      best = t
      bestCount = c
    }
  }
  const sharePct = b.total_count > 0 ? (bestCount / b.total_count) * 100 : 0
  return { type: best, count: bestCount, sharePct }
}

/** Tab content for "สถิติรายชั่วโมงแยกตามประเภท". Layout per design:
 *  • TOP    — date picker + camera selector + export (shared toolbar).
 *  • CHART  — stacked hourly bar chart by vehicle type.
 *  • PEAKS  — 5 peak-hour cards.
 *  • TABLE  — hourly counts table by vehicle type. */
const StatHourVolume: React.FC<Props> = () => {
  const { id, location } = useDetailContext()
  const deptId = useDeptId()
  // Date + camera filters — hoisted so the chart, the peak cards, and the
  // table all share the same selection. Camera picker copies the รายงาน tab:
  // same `useTrafficVolumeSolutionCameras` list + `camera_id` narrowing.
  const [date, setDate] = useState<Dayjs | null>(dayjs())
  const [cameraId, setCameraId] = useState<string>('all')
  const dateStr = date ? date.format('YYYY-MM-DD') : undefined
  const [exportOpen, setExportOpen] = useState(false)
  // Wraps the chart — the export captures the ECharts instance inside.
  const chartRef = useRef<HTMLDivElement | null>(null)

  const { data: camerasData } = useTrafficVolumeSolutionCameras(deptId, id)
  const cameraOptions = useMemo(
    () => [
      { value: 'all', label: 'กล้องทั้งหมด' },
      ...(camerasData?.counting ?? []).map((c) => ({
        value: String(c.id),
        label: c.camera_name,
      })),
    ],
    [camerasData]
  )

  // Same params as the chart/cards/table below — TanStack dedupes, so this
  // reads the cache those components already filled.
  const { data: hourData } = useTrafficVolumeCountHour({
    solution_id: id,
    date: dateStr,
    camera_id: cameraId && cameraId !== 'all' ? cameraId : undefined,
  })

  // ── นำออกเอกสาร (PDF only — chart report) ─────────────────────────────────
  // Blocks mirror the on-screen sections top-to-bottom: stacked chart image,
  // the 5 peak-hour cards, then the hourly table including its trailing
  // "รวมเฉลี่ย" row (same sums HourlyDataTable appends).
  const handleExportPdf = async () => {
    const [{ exportReportPdf }, { captureEchartsPng }] = await Promise.all([
      import('@/utils/export/pdf'),
      import('@/utils/export/chart'),
    ])

    const buckets = hourData?.daily_count_hour ?? []
    const blocks: PdfReportBlock[] = []

    const charts = chartRef.current ? await captureEchartsPng(chartRef.current) : []
    if (charts[0]) {
      blocks.push({ type: 'image', title: 'แยกประเภทยานพาหนะรายชั่วโมง', ...charts[0] })
    }

    const topHours = [...buckets].sort((a, b) => b.total_count - a.total_count).slice(0, 5)
    if (topHours.length > 0) {
      blocks.push({
        type: 'kv',
        title: 'ช่วงเวลาที่มีปริมาณจราจรสูงสุดประจำวัน',
        items: topHours.map((b) => {
          const dom = dominantType(b)
          return {
            label: `${b.hour_timestamp.slice(11, 13)}:00 น.`,
            value: `${b.total_count.toLocaleString()} คัน (${Math.round(b.total_pcu).toLocaleString()} PCU) · ${dom.type.label} ${dom.count.toLocaleString()} คัน (${dom.sharePct.toFixed(1)}%)`,
          }
        }),
      })
    }

    // Hourly table — same cell text HourlyDataTable renders (numbers with
    // ≤1 decimal), closed by the same "รวมเฉลี่ย" sums row.
    const fmtCell = (v: number) => fmtNumber(v, Number.isInteger(v) ? 0 : 1)
    const tableRows = buckets.map((b) => [
      `${b.hour_timestamp.slice(11, 13)}:00`,
      ...VEHICLE_TYPES.map((t) => fmtCell(b[COUNT_FIELD_BY_TYPE[t.key]] ?? 0)),
      fmtCell(b.total_count),
      fmtCell(b.total_pcu),
    ])
    if (buckets.length > 0) {
      const sum = (pick: (b: CountingHourBucket) => number) =>
        buckets.reduce((s, b) => s + pick(b), 0)
      tableRows.push([
        'รวมเฉลี่ย',
        ...VEHICLE_TYPES.map((t) => fmtCell(sum((b) => b[COUNT_FIELD_BY_TYPE[t.key]] ?? 0))),
        fmtCell(sum((b) => b.total_count)),
        fmtCell(sum((b) => b.total_pcu)),
      ])
    }
    blocks.push({
      type: 'table',
      title: `ตารางข้อมูลปริมาณจราจรรายชั่วโมง วันที่ ${dateStr ? thaiDateBE(dateStr) : '-'}`,
      columns: [
        { header: 'เวลา', widthPct: 10 },
        ...VEHICLE_TYPES.map((t) => ({ header: t.label, widthPct: 8.5 })),
        { header: 'รวม', widthPct: 15.25 },
        { header: 'PCU', widthPct: 15.25 },
      ],
      rows: tableRows,
    })

    const noteParts = [
      location?.solution?.solution_name ? `จุดติดตั้ง ${location.solution.solution_name}` : undefined,
      dateStr ? `วันที่ ${thaiDateBE(dateStr)}` : undefined,
      cameraId !== 'all' ? `กล้อง ${cameraOptions.find((o) => o.value === cameraId)?.label ?? cameraId}` : undefined,
    ].filter(Boolean)

    await exportReportPdf({
      filenameBase: 'Traffic_Volume_Hourly_By_Type',
      title: 'รายงานสถิติรายชั่วโมงแยกตามประเภท (Hourly Statistics by Vehicle Type)',
      subtitleNote: noteParts.length ? noteParts.join(' · ') : undefined,
      blocks,
    })
  }

  return (
    <div className='flex flex-col gap-6'>
      <FilterBarAnalytic
        defaultDate={date ?? undefined}
        onDateChange={setDate}
        cameraOptions={cameraOptions}
        defaultCamera={cameraId}
        onCameraChange={setCameraId}
        onExport={() => setExportOpen(true)}
      />

      {/* นำออกเอกสาร — chart report: PDF only, no Excel. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExportPdf={handleExportPdf}
      />

      <div ref={chartRef}>
        <StackedHourlyBarChart date={dateStr} cameraId={cameraId} />
      </div>
      <PeakHourCards date={dateStr} cameraId={cameraId} />
      <HourlyDataTable date={dateStr} cameraId={cameraId} />
    </div>
  )
}

export default React.memo<Props>(StatHourVolume)
