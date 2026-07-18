"use client"
import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RcPieChart,
  Pie,
} from 'recharts'
import { TbMapPin, TbTruck } from 'react-icons/tb'
import { useLPRPointStats } from '@/hooks/queries/lpr'
import { useLPRDetailContext } from '../../../context'

const PROVINCE_COLORS = [
  '#FCD116', '#3b82f6', '#06b6d4', '#8b5cf6', '#10b981',
  '#f97316', '#ef4444', '#14b8a6', '#e879f9', '#f59e0b',
]
const VEHICLE_COLORS = [
  '#FCD116', '#66AEFF', '#05F2DB', '#B57BFF', '#E879DE',
  '#22D3EE', '#A3E635', '#FB923C', '#F87171', '#94a3b8',
]

const tooltipStyle: React.CSSProperties = {
  background: 'rgba(2,8,23,0.92)',
  border: '1px solid #3b82f6',
  borderRadius: 10,
  color: '#f8fafc',
  fontSize: 12,
  padding: '6px 12px',
}

/** Two side-by-side charts on the overview:
 *  - Left: Province Top-10 horizontal bar (mirrors dmon's province summary)
 *  - Right: Vehicle-type donut with legend
 *  Both sourced from the same /stats payload. */
const BreakdownSection: React.FC = () => {
  const { solutionId } = useLPRDetailContext()
  const { data } = useLPRPointStats(solutionId)

  const provinceData = useMemo(
    () => (data?.province_top ?? []).map((p) => ({ name: p.province, value: p.count })),
    [data],
  )
  const vehicleData = useMemo(
    () =>
      (data?.vehicle_type_top ?? []).map((v) => ({
        name: v.vehicle_type_name,
        value: v.count,
      })),
    [data],
  )
  const vehicleTotal = useMemo(
    () => vehicleData.reduce((n, v) => n + v.value, 0),
    [vehicleData],
  )

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      {/* Province Top-10 */}
      <div className='bg-(--mid-gray) rounded-2xl p-5 flex flex-col'>
        <div className='flex items-center gap-2 mb-3 text-(--yellow)'>
          <TbMapPin size={20} />
          <h4 className='mb-0'>จังหวัดตรวจจับสูงสุด</h4>
          <span className='ms-auto fs-11 text-gray-500 font-normal'>Top 10 · วันนี้</span>
        </div>
        {provinceData.length === 0 ? (
          <div className='py-8 text-center text-gray-500 fs-12'>ยังไม่มีข้อมูลวันนี้</div>
        ) : (
          <div style={{ height: Math.max(160, provinceData.length * 30) }}>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={provinceData}
                layout='vertical'
                margin={{ top: 4, right: 32, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' horizontal={false} />
                <XAxis
                  type='number'
                  stroke='#9CA3AF'
                  fontSize={10}
                  tickFormatter={(v) => Number(v).toLocaleString('th-TH')}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  stroke='#9CA3AF'
                  fontSize={11}
                  width={100}
                  tick={{ fill: '#CBD5E1' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={((v: unknown) => [
                    `${Number(v).toLocaleString('th-TH')} ครั้ง`,
                    'จำนวน',
                  ]) as never}
                />
                <Bar dataKey='value' radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {provinceData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PROVINCE_COLORS[i % PROVINCE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Vehicle-type donut */}
      <div className='bg-(--mid-gray) rounded-2xl p-5 flex flex-col'>
        <div className='flex items-center gap-2 mb-3 text-(--yellow)'>
          <TbTruck size={20} />
          <h4 className='mb-0'>ประเภทยานพาหนะ</h4>
          <span className='ms-auto fs-11 text-gray-500 font-normal'>Top 10 · วันนี้</span>
        </div>
        {vehicleData.length === 0 ? (
          <div className='py-8 text-center text-gray-500 fs-12'>ยังไม่มีข้อมูลวันนี้</div>
        ) : (
          <div className='flex-1 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-center'>
            <div className='relative'>
              <ResponsiveContainer width='100%' height={180}>
                <RcPieChart>
                  <Pie
                    data={vehicleData}
                    dataKey='value'
                    nameKey='name'
                    innerRadius='60%'
                    outerRadius='90%'
                    stroke='none'
                    isAnimationActive={false}
                  >
                    {vehicleData.map((_, i) => (
                      <Cell key={i} fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={((v: unknown, n: unknown) => [
                      `${Number(v).toLocaleString('th-TH')} ครั้ง`,
                      n,
                    ]) as never}
                  />
                </RcPieChart>
              </ResponsiveContainer>
              <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                <div className='fs-11 text-gray-400'>รวม</div>
                <div className='fs-16 font-bold text-white tabular-nums'>
                  {vehicleTotal.toLocaleString('th-TH')}
                </div>
                <div className='fs-11 text-gray-400'>ครั้ง</div>
              </div>
            </div>
            <ul className='flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1'>
              {vehicleData.map((v, i) => {
                const pct = vehicleTotal > 0 ? (v.value / vehicleTotal) * 100 : 0
                return (
                  <li
                    key={v.name}
                    className='flex items-center gap-2 fs-12'
                  >
                    <span
                      className='w-2.5 h-2.5 rounded-sm shrink-0'
                      style={{ background: VEHICLE_COLORS[i % VEHICLE_COLORS.length] }}
                    />
                    <span className='text-gray-300 flex-1 truncate'>{v.name}</span>
                    <span className='tabular-nums text-white font-medium'>
                      {v.value.toLocaleString('th-TH')}
                    </span>
                    <span className='tabular-nums text-gray-500 w-10 text-right'>
                      {pct.toFixed(1)}%
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(BreakdownSection)
