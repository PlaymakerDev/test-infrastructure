import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { ElectricityAggItem } from '@/types/lighting'
import { buildReportRows, elapsedHours, energyFromDailyRows, periodEnergyKwh } from './voltageAmpReport'

const NOW = dayjs('2026-10-26 20:30', 'YYYY-MM-DD HH:mm')
const at = (text: string) => dayjs(text, 'YYYY-MM-DD')
const row = (label: string, ...watts: number[]): ElectricityAggItem => ({
  label,
  phases: watts.map((watt, i) => ({ phase: String(i + 1), voltage: 230 + i, amplitude: watt / 200, watt, power_factor: 0.85, frequency: 50 })),
})

describe('report kWh = average watt × hours of the period gone by', () => {
  it('counts a past hour as 1, a past day as 24, today up to now, the future as 0', () => {
    const hour = dayjs('2026-10-26 17:00', 'YYYY-MM-DD HH:mm')
    expect(elapsedHours(hour, hour.endOf('hour'), NOW)).toBeCloseTo(1, 6)
    expect(elapsedHours(at('2026-10-24'), at('2026-10-24').endOf('day'), NOW)).toBeCloseTo(24, 6)
    expect(elapsedHours(at('2026-10-26'), at('2026-10-26').endOf('day'), NOW)).toBeCloseTo(20.5, 6)
    expect(elapsedHours(at('2026-10-27'), at('2026-10-27').endOf('day'), NOW)).toBe(0)
  })

  it('an hourly row keeps the old watt / 1000; a daily row is 24× that', () => {
    expect(periodEnergyKwh(4404.6, '2026-10-26 17:00', 'hourly', NOW)).toBeCloseTo(4.4046, 6)
    // 2026-10-24, สป.1005: 2,371 W average — its 24 hourly rows add up to ~56.9 kWh
    expect(periodEnergyKwh(2371, '2026-10-24', 'daily', NOW)).toBeCloseTo(56.904, 6)
    expect(periodEnergyKwh(1970.99, '2026-10-26', 'daily', NOW)).toBeCloseTo((1970.99 * 20.5) / 1000, 6)
  })

  it('a month / year is the sum of its days, per phase, keyed like the backend labels', () => {
    const days = [row('2026-10-25', 2369.36, 919.63), row('2026-10-26', 1970.99, 741.56), row('2026-09-30', 2000, 900)]
    const monthly = energyFromDailyRows(days, 'MONTHLY', NOW)
    expect(monthly.get('10/2026|1')).toBeCloseTo((2369.36 * 24 + 1970.99 * 20.5) / 1000, 6)
    expect(monthly.get('10/2026|2')).toBeCloseTo((919.63 * 24 + 741.56 * 20.5) / 1000, 6)
    expect(monthly.get('09/2026|1')).toBeCloseTo(48, 6)
    expect(energyFromDailyRows(days, 'YEARLY', NOW).get('2026|1')).toBeCloseTo((2369.36 * 24 + 1970.99 * 20.5 + 2000 * 24) / 1000, 6)
  })
})

describe('report rows', () => {
  it('daily: Thai label, its own kWh', () => {
    const [r] = buildReportRows([row('2026-10-24', 2371)], 'DAILY', NOW)
    expect(r.display).toBe('24 ต.ค. 2569')
    expect(r.phases[0].kwh).toBeCloseTo(56.904, 6)
  })

  it('hourly: compact chart label, full text in the tooltip', () => {
    const [r] = buildReportRows([row('2026-10-24 17:00', 4400)], 'HOURLY', NOW)
    expect(r.display).toBe('24 ต.ค. 2569 17:00')
    expect(r.chartLabel).toBe('24 ต.ค. 69\n17:00')
    expect(r.chartTooltip).toBe('24 ต.ค. 2569 17:00')
    expect(r.phases[0].kwh).toBeCloseTo(4.4, 6)
  })

  it('monthly / yearly: the backend rows as they are, kWh from the daily sums (null until loaded)', () => {
    const energy = new Map([['10/2026|1', 1444.5], ['2026|1', 5385.8]])
    const [oct] = buildReportRows([row('10/2026', 2325.21)], 'MONTHLY', NOW, energy)
    expect(oct.display).toBe('ต.ค. 2569')
    expect(oct.phases[0]).toMatchObject({ watt: 2325.21, kwh: 1444.5 })
    const [year] = buildReportRows([row('2026', 2020.53)], 'YEARLY', NOW, energy)
    expect(year.display).toBe('2569')
    expect(year.phases[0].kwh).toBe(5385.8)
    expect(buildReportRows([row('10/2026', 2325.21)], 'MONTHLY', NOW, null)[0].phases[0].kwh).toBeNull()
  })
})
