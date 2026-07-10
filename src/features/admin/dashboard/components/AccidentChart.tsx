"use client"
import React, { memo, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { TbCarCrash } from 'react-icons/tb'
import Tabs from './Tabs'
import { useDashboardAnalytic } from '@/hooks/queries/dashboard'
import { useDeptId } from '@/hooks/useDeptId'
import type { DashboardBucketType } from '@/types/dashboard/api'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

// Visible tab labels → backend `type=` value. The fourth bucket (weekly) is
// available on the API but the design only exposes three tabs.
const TAB_TO_TYPE: Record<string, DashboardBucketType> = {
  วันนี้: 'daily',
  เดือน: 'monthly',
  ปี: 'yearly',
}
const TAB_OPTIONS = Object.keys(TAB_TO_TYPE)

// Abbreviated Thai months — used by both the monthly day-grain and the yearly
// month-grain x-axis labels.
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** Re-label backend buckets so the x-axis reads in Thai. The BE label format
 *  changes per `type`:
 *    daily    → "HH:00"    (kept as-is — hours don't need re-labelling)
 *    monthly  → "DD/MM"    → "DD ม.ค."         (current month, day grain)
 *    yearly   → "MM/YYYY"  → "ม.ค. 2569"        (BE year, month grain)
 *  Unknown shapes fall through unchanged — never throw.
 */
const formatBucketLabel = (label: string, type: DashboardBucketType): string => {
  if (type === 'monthly') {
    const [dd, mm] = label.split('/')
    const monthIdx = Number(mm) - 1
    if (Number.isFinite(monthIdx) && THAI_MONTHS_SHORT[monthIdx]) {
      return `${Number(dd)} ${THAI_MONTHS_SHORT[monthIdx]}`
    }
  } else if (type === 'yearly') {
    const [mm, yyyy] = label.split('/')
    const monthIdx = Number(mm) - 1
    const yearAd = Number(yyyy)
    if (Number.isFinite(monthIdx) && THAI_MONTHS_SHORT[monthIdx] && Number.isFinite(yearAd)) {
      return `${THAI_MONTHS_SHORT[monthIdx]} ${yearAd + 543}`
    }
  }
  return label
}

interface ChartProps {
  buckets: { label: string; count: number }[]
}

const IncidentEChart = memo(function IncidentEChart({ buckets }: ChartProps) {
  const option = useMemo(() => {
    // Pick a fixed set of x-axis label indices that ALWAYS includes the first
    // and last bucket, spaced as evenly as possible in between. ECharts' auto
    // interval picks something like 0,2,4,…,N-2 — which on an even-length
    // axis hides the last label (today). Combining `showMaxLabel:true` with
    // auto interval also fails because the forced last label collides with
    // the auto-spaced ones (you get gaps like 21 → 24). This computes the
    // labels ourselves so spacing is uniform AND the latest day is included.
    const TARGET = 8 // ≈ how many labels to show
    const n = buckets.length
    const visibleIdx = new Set<number>()
    if (n > 0) {
      const k = Math.min(TARGET, n)
      for (let i = 0; i < k; i++) {
        visibleIdx.add(Math.round((i * (n - 1)) / Math.max(1, k - 1)))
      }
    }

    return {
      backgroundColor: 'transparent',
      grid: { top: 60, right: 16, bottom: 28, left: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: buckets.map((d) => d.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: '#ffffff',
          fontSize: 11,
          interval: (index: number) => visibleIdx.has(index),
        },
        splitLine: {
          show: true,
          lineStyle: { color: 'rgba(255,255,255,0.08)', width: 1 },
        },
      },
      yAxis: { type: 'value', show: false, splitLine: { show: false } },
      series: [
        {
          type: 'line',
          data: buckets.map((d) => d.count),
          smooth: 0.5,
          symbol: 'circle',
          symbolSize: 10,
          showSymbol: false,
          lineStyle: { color: '#FCD116', width: 3 },
          itemStyle: { color: '#fff', borderColor: '#FCD116', borderWidth: 2 },
          markPoint: {
            data: [{ type: 'max', name: 'สูงสุด' }],
            symbol: 'circle',
            symbolSize: 12,
            itemStyle: { color: '#fff', borderColor: '#FCD116', borderWidth: 2 },
            label: {
              show: true,
              position: 'top',
              distance: 16,
              formatter: (p: { value: number }) =>
                `{val|${p.value.toLocaleString()}}\n{sub|เหตุการณ์}`,
              rich: {
                val: {
                  backgroundColor: '#FCD116',
                  borderRadius: 6,
                  padding: [6, 10, 2, 10],
                  color: '#050d1a',
                  fontSize: 13,
                  fontWeight: 'bold',
                  lineHeight: 20,
                },
                sub: {
                  backgroundColor: '#FCD116',
                  borderRadius: 6,
                  padding: [2, 10, 6, 10],
                  color: '#050d1a',
                  fontSize: 11,
                  lineHeight: 18,
                },
              },
            },
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(5,13,26,0.92)',
        borderColor: 'rgba(252,209,22,0.3)',
        textStyle: { color: '#FCD116', fontSize: 11 },
        formatter: (p: Array<{ name: string; value: number }>) =>
          `${p[0].name}: <b>${p[0].value.toLocaleString()}</b> เหตุการณ์`,
      },
    }
  }, [buckets])

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ width: '100%', height: 196 }}
      opts={{ renderer: 'canvas' }}
    />
  )
})

interface Props { }

const AccidentChart: React.FC<Props> = () => {
  const [tab, setTab] = useState('วันนี้')
  const deptId = useDeptId()
  const type = TAB_TO_TYPE[tab]
  const { data, isLoading } = useDashboardAnalytic(deptId, type)

  const buckets = useMemo(
    () =>
      (data ?? []).map((b) => ({ ...b, label: formatBucketLabel(b.label, type) })),
    [data, type],
  )
  const allZero = buckets.length > 0 && buckets.every((b) => b.count === 0)

  const decoLayers = useMemo(
    () => (
      <>
        <div
          className='absolute pointer-events-none'
          style={{
            width: 207,
            height: 207,
            left: -104,
            top: -80,
            background: 'rgba(252,209,22,0.3)',
            filter: 'blur(50px)',
            borderRadius: '50%',
          }}
        />
        <div
          className='absolute pointer-events-none'
          style={{
            width: 112,
            height: 112,
            right: 40,
            top: -30,
            background: 'rgba(252,209,22,0.3)',
            filter: 'blur(50px)',
            borderRadius: '50%',
          }}
        />
        <div
          className='absolute pointer-events-none'
          style={{
            width: 235,
            height: 235,
            right: -40,
            bottom: -60,
            background: 'rgba(0,0,0,0.5)',
            filter: 'blur(50px)',
            borderRadius: '50%',
          }}
        />
      </>
    ),
    [],
  )

  return (
    <div
      className='relative overflow-hidden p-3'
      style={{
        background: 'rgba(0,0,0,0.8)',
        borderRadius: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      {decoLayers}
      <div className='relative z-10 flex items-center justify-between mb-2'>
        <div className='flex items-center gap-2 text-white text-sm font-medium'>
          <TbCarCrash size={30} color='#FCD116' />
          ปริมาณการเกิดอุบัติเหตุ
        </div>
        <Tabs value={tab} onChange={setTab} options={TAB_OPTIONS} />
      </div>
      <div className='relative z-10' style={{ minHeight: 196 }}>
        {isLoading && buckets.length === 0 ? (
          <div className='flex items-center justify-center h-full text-xs' style={{ height: 196, color: '#6b7f9a' }}>
            กำลังโหลด...
          </div>
        ) : buckets.length === 0 ? (
          // BE returned no buckets at all → the period has no records to even
          // graph (e.g. solution missing / dept not onboarded yet).
          <div className='flex items-center justify-center text-xs' style={{ height: 196, color: '#6b7f9a' }}>
            ไม่มีข้อมูล
          </div>
        ) : allZero ? (
          // Buckets exist but every count is 0 — accidents simply didn't
          // happen in this range. Use the yellow accent so users see this as
          // a "good news" empty state, not missing data.
          <div className='flex items-center justify-center text-xs font-medium' style={{ height: 196, color: '#FCD116' }}>
            ไม่มีเหตุการณ์
          </div>
        ) : (
          <IncidentEChart buckets={buckets} />
        )}
      </div>
    </div>
  )
}

export default React.memo<Props>(AccidentChart)
