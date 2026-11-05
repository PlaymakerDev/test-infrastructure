import { describe, expect, it } from 'vitest'
import type { ElectricityAggItem } from '@/types/lighting'
import { electricityPeriod, electricityRequestStart, trimElectricityToRange } from './electricityRange'

const row = (label: string): ElectricityAggItem => ({
  label,
  phases: [{ phase: '1', voltage: 230, amplitude: 1, watt: 230, power_factor: 0.85, frequency: 50 }],
})
const labels = (rows: ElectricityAggItem[]) => rows.map((r) => r.label)

describe('electricity report range (backend reads dates as UTC days)', () => {
  it('asks from the day before', () => {
    expect(electricityRequestStart('2026-10-24')).toBe('2026-10-23')
    expect(electricityRequestStart('2026-10-01')).toBe('2026-09-30')
    expect(electricityRequestStart('2026-01-01')).toBe('2025-12-31')
  })

  it('hourly: keeps 00:00–23:00 of the days picked, drops the day before and the morning after', () => {
    // what the backend answers for start_date=2026-10-23 (one early), end_date=2026-10-24
    const answer = [row('2026-10-23 07:00'), row('2026-10-23 23:00'), row('2026-10-24 00:00'), row('2026-10-24 06:00'),
      row('2026-10-24 07:00'), row('2026-10-24 23:00'), row('2026-10-25 00:00'), row('2026-10-25 06:00')]
    expect(labels(trimElectricityToRange(answer, 'hourly', '2026-10-24', '2026-10-24')))
      .toEqual(['2026-10-24 00:00', '2026-10-24 06:00', '2026-10-24 07:00', '2026-10-24 23:00'])
  })

  it('daily: drops the extra 25/10 a 23–24/10 report carried', () => {
    const answer = [row('2026-10-22'), row('2026-10-23'), row('2026-10-24'), row('2026-10-25')]
    expect(labels(trimElectricityToRange(answer, 'daily', '2026-10-23', '2026-10-24'))).toEqual(['2026-10-23', '2026-10-24'])
  })

  it('monthly / yearly: keeps every period the range touches, drops the neighbours', () => {
    const months = [row('09/2026'), row('10/2026'), row('11/2026')]
    expect(labels(trimElectricityToRange(months, 'monthly', '2026-10-01', '2026-10-31'))).toEqual(['10/2026'])
    expect(labels(trimElectricityToRange(months, 'monthly', '2026-10-25', '2026-10-26'))).toEqual(['10/2026'])
    const years = [row('2025'), row('2026'), row('2027')]
    expect(labels(trimElectricityToRange(years, 'yearly', '2026-01-01', '2026-10-26'))).toEqual(['2026'])
  })

  it('reads each label format as Thai-time periods', () => {
    const [hStart, hEnd] = electricityPeriod('2026-10-24 07:00', 'hourly')
    expect(hStart.format('YYYY-MM-DD HH:mm')).toBe('2026-10-24 07:00')
    expect(hEnd.format('HH:mm:ss')).toBe('07:59:59')
    expect(electricityPeriod('10/2026', 'monthly')[1].format('YYYY-MM-DD')).toBe('2026-10-31')
    expect(electricityPeriod('2026', 'yearly')[0].format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(electricityPeriod('garbage', 'daily')[0].isValid()).toBe(false)
  })
})
