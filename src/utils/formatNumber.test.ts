import { describe, expect, it } from 'vitest'

import { fmtNumber } from './formatNumber'

describe('fmtNumber', () => {
  it('formats integers with thousand separators', () => {
    expect(fmtNumber(1234567)).toBe('1,234,567')
  })

  it('formats zero without decimals', () => {
    expect(fmtNumber(0)).toBe('0')
  })

  it('formats negative numbers', () => {
    expect(fmtNumber(-1234)).toBe('-1,234')
  })

  it('defaults to 0 decimal places', () => {
    expect(fmtNumber(1.9)).toBe('2')
  })

  it('respects the decimals parameter', () => {
    expect(fmtNumber(1234.5678, 2)).toBe('1,234.57')
    expect(fmtNumber(1000, 2)).toBe('1,000.00')
  })

  it('returns "-" for null', () => {
    expect(fmtNumber(null)).toBe('-')
  })

  it('returns "-" for undefined', () => {
    expect(fmtNumber(undefined)).toBe('-')
  })

  it('returns "-" for NaN', () => {
    expect(fmtNumber(NaN)).toBe('-')
  })

  it('handles small decimals correctly', () => {
    expect(fmtNumber(0.005, 2)).toBe('0.01')
  })
})
