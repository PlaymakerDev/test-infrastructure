"use client"
import React, { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { dayjs } from '@/features/admin/traffic-volume/shared/utils/dayjsThai'
import { fmtNumber } from '@/utils/formatNumber'
import type { CountingReportSummaryRow } from '@/types/traffic-volume/detail-api'

interface Props {
  /** Every hour-bucketed row that survived date + camera filters. The table
   *  regroups them internally by camera → date → hour, so no pre-grouping
   *  is required from the parent. */
  rows: CountingReportSummaryRow[]
}

const HOURS = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'))

// Thai weekday names indexed by Date.getDay() (0 = Sunday).
const THAI_DAY = [
  'วันอาทิตย์',
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
] as const

/** Value → color band per the legend supplied by the design. The
 *  background is a low-alpha version of the accent so the number stays
 *  legible on the dark table surface. */
const bandColor = (v: number): { bg: string; fg: string } => {
  if (v <= 50) return { bg: '#0F1E2E', fg: '#66AEFF' }
  if (v <= 80) return { bg: '#0F2828', fg: '#22D3EE' }
  if (v <= 100) return { bg: '#0F2E14', fg: '#4ADE80' }
  if (v <= 200) return { bg: '#2E1E0F', fg: '#F5A623' }
  return { bg: '#2E0F0F', fg: '#FF6B6B' }
}

/** One rendered row on the matrix. Mixed shape:
 *  • `camera`   — full-width header ("P11-CAM-F01").
 *  • `count`    — per-day vehicle-count row.
 *  • `pcu`      — per-day PCU row.
 *  • `summary`  — trailing "รวมเฉลี่ย" summed across all dates of the group. */
type Row =
  | { kind: 'camera'; key: string; cameraName: string }
  | {
      kind: 'count' | 'pcu' | 'summary'
      key: string
      label: string
      unit: 'คัน' | 'PCU'
      /** Per-hour values, keyed by "00".."23". */
      hourly: Record<string, number>
      total: number
      /** Summary rows render values in yellow bold with no color banding. */
      isSummary?: boolean
    }

/** Format one value cell — colored by band unless it's part of a summary row
 *  (summary uses yellow bold to match the other report tables). */
const fmtValue = (v: number, isSummary: boolean, isPcu: boolean) => {
  if (isSummary) {
    return (
      <span
        className='tabular-nums font-semibold'
        style={{ color: '#FCD116' }}
      >
        {fmtNumber(v, isPcu ? 1 : 0)}
      </span>
    )
  }
  const { fg } = bandColor(v)
  return (
    <span className='tabular-nums' style={{ color: fg }}>
      {fmtNumber(v, isPcu ? 1 : 0)}
    </span>
  )
}

const HourlyMatrixTable: React.FC<Props> = ({ rows }) => {
  /** Group rows by cameraName → date → HH so each cell has one bucket.
   *  Handles rows that lack `camera_name` (backend total rollups) by
   *  binning them under the sentinel key "-". */
  const data = useMemo<Row[]>(() => {
    // camera → date → hh → { count, pcu }
    const cams = new Map<
      string,
      Map<string, Map<string, { count: number; pcu: number }>>
    >()
    for (const r of rows) {
      const cam = r.camera_name ?? '-'
      const iso = r.date
      if (typeof iso !== 'string' || iso.length < 13) continue
      const day = iso.slice(0, 10)
      const hh = iso.slice(11, 13)
      let dayMap = cams.get(cam)
      if (!dayMap) {
        dayMap = new Map()
        cams.set(cam, dayMap)
      }
      let hourMap = dayMap.get(day)
      if (!hourMap) {
        hourMap = new Map()
        dayMap.set(day, hourMap)
      }
      hourMap.set(hh, { count: r.total_count, pcu: r.total_pcu })
    }

    const out: Row[] = []
    for (const [cam, dayMap] of cams) {
      out.push({
        kind: 'camera',
        key: `cam-${cam}`,
        cameraName: cam,
      })
      const days = Array.from(dayMap.keys()).sort()
      // Vehicle-count rows first, then their summary.
      for (const day of days) {
        const hourMap = dayMap.get(day)!
        const hourly: Record<string, number> = {}
        let total = 0
        for (const hh of HOURS) {
          const v = hourMap.get(hh)?.count ?? 0
          hourly[hh] = v
          total += v
        }
        const d = dayjs(day).locale('th')
        const dayName = THAI_DAY[new Date(day).getDay()]
        out.push({
          kind: 'count',
          key: `${cam}-${day}-count`,
          label: `${d.format('D MMM BBBB')}\n${dayName}`,
          unit: 'คัน',
          hourly,
          total,
        })
      }
      // Count summary — per-hour + total sum across all dates.
      {
        const hourly: Record<string, number> = {}
        let total = 0
        for (const hh of HOURS) hourly[hh] = 0
        for (const day of days) {
          const hourMap = dayMap.get(day)!
          for (const hh of HOURS) {
            const v = hourMap.get(hh)?.count ?? 0
            hourly[hh] += v
            total += v
          }
        }
        out.push({
          kind: 'summary',
          key: `${cam}-summary-count`,
          label: 'รวมเฉลี่ย',
          unit: 'คัน',
          hourly,
          total,
          isSummary: true,
        })
      }
      // PCU rows.
      for (const day of days) {
        const hourMap = dayMap.get(day)!
        const hourly: Record<string, number> = {}
        let total = 0
        for (const hh of HOURS) {
          const v = hourMap.get(hh)?.pcu ?? 0
          hourly[hh] = v
          total += v
        }
        const d = dayjs(day).locale('th')
        const dayName = THAI_DAY[new Date(day).getDay()]
        out.push({
          kind: 'pcu',
          key: `${cam}-${day}-pcu`,
          label: `${d.format('D MMM BBBB')}\n${dayName}`,
          unit: 'PCU',
          hourly,
          total,
        })
      }
      // PCU summary — same aggregation, different accumulator field.
      {
        const hourly: Record<string, number> = {}
        let total = 0
        for (const hh of HOURS) hourly[hh] = 0
        for (const day of days) {
          const hourMap = dayMap.get(day)!
          for (const hh of HOURS) {
            const v = hourMap.get(hh)?.pcu ?? 0
            hourly[hh] += v
            total += v
          }
        }
        out.push({
          kind: 'summary',
          key: `${cam}-summary-pcu`,
          label: 'รวมเฉลี่ย',
          unit: 'PCU',
          hourly,
          total,
          isSummary: true,
        })
      }
    }
    return out
  }, [rows])

  // 24 hour columns + วันที่ + รวม = 26. Camera header rows use `colSpan`
  // to span the whole width.
  const TOTAL_COLS = 26

  const columns: ColumnsType<Row> = useMemo(() => {
    const hourCols: ColumnsType<Row> = HOURS.map((hh) => ({
      title: `${hh}:00`,
      key: `h-${hh}`,
      width: 66,
      onCell: (row) => {
        if (row.kind === 'camera') return { colSpan: 0 }
        // Cell background follows the value band for non-summary rows;
        // summary rows use a subtle darker fill so the yellow numbers
        // stand out uniformly.
        if (row.isSummary) return { style: { background: '#191919' } }
        const v = row.hourly[hh] ?? 0
        const { bg } = bandColor(v)
        return { style: { background: bg } }
      },
      render: (_: unknown, row: Row) => {
        if (row.kind === 'camera') return null
        const isPcu = row.unit === 'PCU'
        const v = row.hourly[hh] ?? 0
        return fmtValue(v, !!row.isSummary, isPcu)
      },
    }))

    return [
      {
        title: 'วันที่',
        key: 'date',
        width: 130,
        fixed: 'left',
        onCell: (row) => {
          if (row.kind === 'camera') {
            return {
              colSpan: TOTAL_COLS,
              style: { background: '#2a2a2a', padding: '10px 16px' },
            }
          }
          if (row.isSummary) return { style: { background: '#191919' } }
          // Per-day rows get a solid dark bg so the date column reads
          // apart from the color-banded hour cells to its right.
          return { style: { background: '#212121' } }
        },
        render: (_: unknown, row: Row) => {
          if (row.kind === 'camera') {
            return (
              <span className='text-(--yellow) font-semibold'>
                {row.cameraName}
              </span>
            )
          }
          if (row.isSummary) {
            return (
              <span className='text-(--yellow) font-semibold'>
                {row.label} ({row.unit})
              </span>
            )
          }
          const [dateLine, dayLine] = row.label.split('\n')
          // Explicit inline colors — was picking up an unexpected yellow
          // tint from an ancestor cascade when relying on Tailwind's
          // `text-white` alone.
          return (
            <div className='flex flex-col leading-tight'>
              <span style={{ color: '#ffffff' }}>{dateLine}</span>
              <span
                className='fs-11'
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {dayLine} ({row.unit})
              </span>
            </div>
          )
        },
      },
      ...hourCols,
      {
        title: 'รวม',
        key: 'total',
        width: 90,
        fixed: 'right',
        onCell: (row) => {
          if (row.kind === 'camera') return { colSpan: 0 }
          // "รวม" column deliberately skips the value-band coloring —
          // the row's own total shouldn't compete with the per-hour cells
          // for visual weight. Summary rows keep the shared dark tint,
          // per-day rows get the same solid dark bg as the "วันที่" column.
          if (row.isSummary) return { style: { background: '#191919' } }
          return { style: { background: '#212121' } }
        },
        render: (_: unknown, row: Row) => {
          if (row.kind === 'camera') return null
          const isPcu = row.unit === 'PCU'
          if (row.isSummary) {
            // Summary totals stay yellow-bold to match the label.
            return fmtValue(row.total, true, isPcu)
          }
          // Non-summary total — yellow number without value-based banding.
          return (
            <span
              className='tabular-nums'
              style={{ color: '#FCD116' }}
            >
              {fmtNumber(row.total, isPcu ? 1 : 0)}
            </span>
          )
        },
      },
    ]
  }, [])

  return (
    <section>
      <p className='fs-14 text-(--yellow) mb-2'>
        ตารางรายงานสรุปรายชั่วโมง (Matrix)
      </p>
      <Table<Row>
        rowKey='key'
        columns={columns}
        dataSource={data}
        pagination={false}
        size='small'
        scroll={{ x: 'max-content' }}
        className='bridge-projects-table hide-scrollbar'
      />
    </section>
  )
}

export default React.memo<Props>(HourlyMatrixTable)
