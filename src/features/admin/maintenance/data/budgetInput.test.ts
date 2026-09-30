import { describe, expect, it } from 'vitest'
import { caretAfterFormat, formatBudgetInput, significantBefore } from './budgetInput'

describe('formatBudgetInput', () => {
  it('groups thousands as it is typed', () => {
    expect(formatBudgetInput('1')).toBe('1')
    expect(formatBudgetInput('1234')).toBe('1,234')
    expect(formatBudgetInput('1,2345')).toBe('12,345')
    expect(formatBudgetInput('1111000000')).toBe('1,111,000,000')
  })

  it('keeps one decimal point and two decimals', () => {
    expect(formatBudgetInput('1234567.')).toBe('1,234,567.')
    expect(formatBudgetInput('1234567.505')).toBe('1,234,567.50')
    expect(formatBudgetInput('12.3.4')).toBe('12.34')
    expect(formatBudgetInput('.5')).toBe('0.5')
  })

  it('drops everything that is not a digit, reads Thai digits, trims leading zeros', () => {
    expect(formatBudgetInput('฿ 5,000,000 บาท')).toBe('5,000,000')
    expect(formatBudgetInput('๕๐๐๐๐')).toBe('50,000')
    expect(formatBudgetInput('0005')).toBe('5')
    expect(formatBudgetInput('0')).toBe('0')
    expect(formatBudgetInput('')).toBe('')
  })
})

describe('caret', () => {
  it('stays after the same digit once commas move', () => {
    // typed "1234" with the caret after the 2 → "1,234", caret after the 2
    const typed = '1234'
    const formatted = formatBudgetInput(typed)
    expect(caretAfterFormat(formatted, significantBefore(typed, 2))).toBe(3)
    // caret at the end stays at the end
    expect(caretAfterFormat(formatted, significantBefore(typed, 4))).toBe(formatted.length)
    // caret at the start stays at the start
    expect(caretAfterFormat(formatted, significantBefore(typed, 0))).toBe(0)
  })

  it('counts commas already in the text as nothing', () => {
    // "1,234,5|67" (caret after the 5) → digits before = 5 → "1,234,567" idx 7
    expect(caretAfterFormat('1,234,567', significantBefore('1,234,567', 7))).toBe(7)
  })
})
