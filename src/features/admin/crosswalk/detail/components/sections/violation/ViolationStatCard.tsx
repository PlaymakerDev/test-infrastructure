"use client"
import React, { useMemo } from 'react'
import { Col, Row, Skeleton } from 'antd'
import dayjs from 'dayjs'
import { useQueries } from '@tanstack/react-query'
import { TbHandClick, TbTruck, TbUser, TbUserX } from 'react-icons/tb'
import { fmtNumber } from '@/utils/formatNumber'
import { getCrosswalkSummaryDailyAPI } from '@/services/routes/CrosswalkService'
import { crosswalkKeys } from '@/hooks/queries/crosswalk/queryKeys'
import { useDetailContext } from '../../../context'
import type { ViolationFilter } from './filter'

interface Props {
  filter: ViolationFilter
}

interface CardProps {
  icon: React.ReactNode
  label: string
  color: 'white' | 'blue' | 'red' | 'orange'
  value: number
  unit: string
  isLoading?: boolean
}

const COLOR_MAP: Record<CardProps['color'], { border: string; text: string }> = {
  white: { border: 'border-white', text: 'text-white' },
  blue: { border: 'border-blue-500', text: 'text-blue-500' },
  red: { border: 'border-red-500', text: 'text-red-500' },
  orange: { border: 'border-[#FF7B00]', text: 'text-[#FF7B00]' },
}

const Card: React.FC<CardProps> = ({ icon, label, color, value, unit, isLoading }) => {
  const c = COLOR_MAP[color]
  return (
    <div className={`h-full bg-[#66AEFF1A] border ${c.border} py-3 px-5 rounded-[20px]`}>
      <span className={`fs-22 mb-1 ${c.text}`}>{icon}</span>
      <h4 className={`${c.text} mb-1`}>{label}</h4>
      {isLoading ? (
        <Skeleton active paragraph={false} title={{ width: 120 }} />
      ) : (
        <p className='mb-0.5'>
          <span className='fs-18 font-bold'>{fmtNumber(value, 0)}</span>{' '}
          <span className='fs-14'>{unit}</span>
        </p>
      )}
    </div>
  )
}

/** Enumerate every YYYY-MM-DD between `startDate` and `endDate` (inclusive).
 *  Empty range (e.g. period=ALL, both empty) returns []. Cap prevents runaway
 *  queries when the user picks an unusually wide custom range. */
const MAX_DAYS_IN_RANGE = 62
const enumerateDates = (startDate: string, endDate: string): string[] => {
  if (!startDate || !endDate) return []
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (!start.isValid() || !end.isValid()) return []
  const out: string[] = []
  let curr = start
  while ((curr.isSame(end, 'day') || curr.isBefore(end, 'day')) && out.length < MAX_DAYS_IN_RANGE) {
    out.push(curr.format('YYYY-MM-DD'))
    curr = curr.add(1, 'day')
  }
  return out
}

const ViolationStatCard: React.FC<Props> = ({ filter }) => {
  const { id } = useDetailContext()

  // Backend endpoint is strictly per-day (`start_date` only — `end_date` is
  // ignored). Fan out one query per day in the range with `useQueries` and
  // sum the four counter fields client-side. Period=ALL (both dates empty)
  // falls back to a single call with no date param — backend then returns
  // its own default (usually today).
  const dates = useMemo(
    () => enumerateDates(filter.startDate, filter.endDate),
    [filter.startDate, filter.endDate],
  )

  const queries = useQueries({
    queries:
      dates.length > 0
        ? dates.map((date) => ({
            queryKey: crosswalkKeys.detail.summaryDaily({
              solution_id: id,
              start_date: date,
            }),
            queryFn: () =>
              getCrosswalkSummaryDailyAPI({
                solution_id: id,
                start_date: date,
              }).then((r) => r.data),
            enabled: !!id,
          }))
        : [
            {
              queryKey: crosswalkKeys.detail.summaryDaily({ solution_id: id }),
              queryFn: () =>
                getCrosswalkSummaryDailyAPI({ solution_id: id }).then(
                  (r) => r.data,
                ),
              enabled: !!id,
            },
          ],
  })

  // Plain inline aggregation — the `queries` array from `useQueries` gets a
  // fresh reference each render, so `useMemo([queries])` never hits and just
  // adds overhead. React Compiler (reactCompiler: true) will memoize this
  // automatically based on the data it actually reads.
  let crossingTotal = 0
  let buttonPressed = 0
  let pedViolation = 0
  let vehicleCount = 0
  for (const q of queries) {
    const d = q.data
    if (!d) continue
    crossingTotal += d.crossing?.total ?? 0
    buttonPressed += d.crossing?.button_pressed ?? 0
    pedViolation += d.crossing?.violation ?? 0
    vehicleCount += d.counting?.total_count ?? 0
  }
  const totals = { crossingTotal, buttonPressed, pedViolation, vehicleCount }

  // Show skeleton while ANY day is still loading — partial sums are misleading.
  const isLoading = queries.some((q) => q.isLoading)

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbUser />}
          label='คนข้ามทั้งหมด'
          color='white'
          value={totals.crossingTotal}
          unit='คน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbHandClick />}
          label='การกดปุ่ม'
          color='blue'
          value={totals.buttonPressed}
          unit='ครั้ง'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbUserX />}
          label='คนข้ามฝ่าฝืนสัญญาณไฟ'
          color='red'
          value={totals.pedViolation}
          unit='คน'
          isLoading={isLoading}
        />
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <Card
          icon={<TbTruck />}
          label='รถข้ามฝ่าฝืนสัญญาณไฟ'
          color='orange'
          value={totals.vehicleCount}
          unit='คัน'
          isLoading={isLoading}
        />
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ViolationStatCard)
