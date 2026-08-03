"use client"
import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TbChartAreaLine } from 'react-icons/tb'
import { useLPRPointStats } from '@/hooks/queries/lpr'
import { useLPRDetailContext } from '../../../context'

interface TooltipPayload {
  color?: string
  name?: string
  value?: number
  dataKey?: string
}

interface RowData {
  hour: string
  today: number
  yesterday: number
}

/** Chart tooltip — module-scope so it isn't re-created every render
 *  (react-hooks/static-components). */
const CustomTooltip: React.FC<{
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'rgba(2,8,23,0.92)',
        border: '1px solid #3b82f6',
        borderRadius: 10,
        color: '#f8fafc',
        fontSize: "var(--fs-12)",
        padding: '8px 14px',
        boxShadow: '0 4px 24px rgba(59,130,246,0.15)',
      }}
    >
      <p className='text-slate-300 fs-12 mb-1'>เวลา {label}</p>
      {payload.map((e, i) => (
        <p
          key={i}
          className='font-semibold mb-0'
          style={{ color: e.color, marginTop: i === 0 ? 0 : 2 }}
        >
          {e.name}: {(e.value ?? 0).toLocaleString('th-TH')} ครั้ง
        </p>
      ))}
    </div>
  )
}

/** Overview chart — plate detections per hour, today filled + yesterday as
 *  a dashed line for comparison. Same shape as dmon's AnprOverviewTab area
 *  chart. */
const HourlyChartSection: React.FC = () => {
  const { solutionId } = useLPRDetailContext()
  const { data } = useLPRPointStats(solutionId)

  const rows = useMemo<RowData[]>(() => {
    const today = data?.hourly_today ?? []
    const yest = data?.hourly_yesterday ?? []
    const todayMap = new Map(today.map((b) => [b.hour, b.count]))
    const yestMap = new Map(yest.map((b) => [b.hour, b.count]))
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      today: todayMap.get(i) ?? 0,
      yesterday: yestMap.get(i) ?? 0,
    }))
  }, [data])

  return (
    <div className='bg-[#000000CC] rounded-2xl p-5 h-full flex flex-col'>
      <div className='flex items-center gap-2 mb-3 text-(--yellow)'>
        <TbChartAreaLine size={20} />
        <h4 className='mb-0'>ปริมาณทะเบียนรายชั่วโมง</h4>
        <span className='ms-auto fs-12 text-gray-500 font-normal'>
          วันนี้ vs เมื่อวาน
        </span>
      </div>
      <div className='flex-1 min-h-56'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id='lprPlateFill' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='#FCD116' stopOpacity={0.5} />
                <stop offset='95%' stopColor='#FCD116' stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
            <XAxis
              dataKey='hour'
              stroke='#9CA3AF'
              fontSize={11}
              interval={2}
            />
            <YAxis
              stroke='#9CA3AF'
              fontSize={11}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type='monotone'
              dataKey='yesterday'
              name='เมื่อวาน'
              fill='none'
              stroke='#64748b'
              strokeWidth={1.5}
              strokeDasharray='4 3'
              dot={false}
            />
            <Area
              type='monotone'
              dataKey='today'
              name='วันนี้'
              fill='url(#lprPlateFill)'
              stroke='#FCD116'
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default React.memo(HourlyChartSection)
