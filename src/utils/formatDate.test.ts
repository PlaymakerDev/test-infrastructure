import { describe, expect, it } from 'vitest'

import { thaiDayName, thaiDayShort } from './formatDate'

describe('thaiDayName', () => {
  it.each([
    ['sunday',    'อาทิตย์'],
    ['monday',    'จันทร์'],
    ['tuesday',   'อังคาร'],
    ['wednesday', 'พุธ'],
    ['thursday',  'พฤหัสบดี'],
    ['friday',    'ศุกร์'],
    ['saturday',  'เสาร์'],
  ])('maps %s to %s', (input, expected) => {
    expect(thaiDayName(input)).toBe(expected)
  })

  it('is case-insensitive', () => {
    expect(thaiDayName('MONDAY')).toBe('จันทร์')
    expect(thaiDayName('Friday')).toBe('ศุกร์')
  })

  it('returns empty string for null', () => {
    expect(thaiDayName(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(thaiDayName(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(thaiDayName('')).toBe('')
  })

  it('returns original string for unknown day', () => {
    expect(thaiDayName('funday')).toBe('funday')
    expect(thaiDayName('วันจันทร์')).toBe('วันจันทร์')
  })
})

describe('thaiDayShort', () => {
  it.each([
    ['sunday',    'อา.'],
    ['monday',    'จ.'],
    ['tuesday',   'อ.'],
    ['wednesday', 'พ.'],
    ['thursday',  'พฤ.'],
    ['friday',    'ศ.'],
    ['saturday',  'ส.'],
  ])('maps %s to %s', (input, expected) => {
    expect(thaiDayShort(input)).toBe(expected)
  })

  it('is case-insensitive', () => {
    expect(thaiDayShort('SUNDAY')).toBe('อา.')
    expect(thaiDayShort('Saturday')).toBe('ส.')
  })

  it('returns empty string for null', () => {
    expect(thaiDayShort(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(thaiDayShort(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(thaiDayShort('')).toBe('')
  })

  it('abbreviates first char + dot for unknown day', () => {
    expect(thaiDayShort('funday')).toBe('f.')
  })
})
