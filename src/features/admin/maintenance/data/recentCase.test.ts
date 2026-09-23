import { describe, expect, it } from 'vitest'
import { NEW_CASE_MAX_AGE_MS, isNewCase } from './recentCase'

// The "new" chip is the case's own state, nothing about who looked at it:
// nobody has filed anything yet (still `open`) and it's under a week old.
// Two earlier per-browser versions are described in recentCase.ts — the point
// of the tests here is that the answer depends on nothing but the row.

const NOW = new Date('2026-09-22T17:00:00+07:00').valueOf()
/** The shape the backend sends: local Thai time, no zone suffix. */
const at = (daysAgo: number, clock = '17:00:00') => {
  const d = new Date(NOW - daysAgo * 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${clock}`
}

describe('isNewCase', () => {
  it('flags a case nobody has worked yet', () => {
    expect(isNewCase('open', at(0), NOW)).toBe(true)
    expect(isNewCase('open', at(3), NOW)).toBe(true)
    // `at()` keeps the same clock time, so whole days only — 6 days ago at
    // 17:00 is the last moment still inside the window.
    expect(isNewCase('open', at(6), NOW)).toBe(true)
  })

  it('drops the chip the moment the contractor files something', () => {
    // The backend moves the case to in_progress on their first save.
    expect(isNewCase('in_progress', at(0), NOW)).toBe(false)
  })

  it('never flags a case past in_progress', () => {
    expect(isNewCase('pending_approval', at(0), NOW)).toBe(false)
    expect(isNewCase('closed', at(0), NOW)).toBe(false)
  })

  it('stops at the 7-day ceiling even when still untouched', () => {
    expect(isNewCase('open', at(8), NOW)).toBe(false)
    expect(isNewCase('open', at(30), NOW)).toBe(false)
    const exactly = new Date(NOW - NEW_CASE_MAX_AGE_MS).toISOString()
    expect(isNewCase('open', exactly, NOW)).toBe(false)
  })

  it('flags a timestamp in the future (clock skew) rather than hiding it', () => {
    expect(isNewCase('open', at(-1), NOW)).toBe(true)
  })

  it('gives no chip when the row has no status or no usable date', () => {
    expect(isNewCase(undefined, at(0), NOW)).toBe(false)
    expect(isNewCase('open', null, NOW)).toBe(false)
    expect(isNewCase('open', '', NOW)).toBe(false)
    expect(isNewCase('open', 'ไม่ใช่วันที่', NOW)).toBe(false)
  })
})
