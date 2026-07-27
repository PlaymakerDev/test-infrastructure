import { describe, expect, it } from 'vitest'

import { getPageOffset, getRowNumber } from './pagination'

describe('getPageOffset', () => {
  it('is 0 on the first page', () => {
    expect(getPageOffset(1, 10)).toBe(0)
  })

  it('offsets by full pages already passed', () => {
    expect(getPageOffset(2, 10)).toBe(10)
    expect(getPageOffset(3, 20)).toBe(40)
  })
})

describe('getRowNumber', () => {
  it('numbers rows 1-based on the first page', () => {
    expect(getRowNumber(1, 10, 0)).toBe(1)
    expect(getRowNumber(1, 10, 9)).toBe(10)
  })

  it('continues numbering across pages instead of resetting to 1', () => {
    expect(getRowNumber(2, 10, 0)).toBe(11)
    expect(getRowNumber(3, 20, 4)).toBe(45)
  })
})
