import { describe, expect, it } from 'vitest'
import { letterContractorName } from './contractorName'

const rows = [
  { user_id: 'u-tdsob', company_name: 'test-01' },
  { user_id: 'u-lpc', company_name: 'ห้างหุ้นส่วนจำกัด ลำปางภาณุภัทร์ก่อสร้าง 2008' },
  { user_id: 'u-blank', company_name: '  ' },
]

describe('letterContractorName', () => {
  it('addresses the letter to the company, not the login name', () => {
    expect(letterContractorName(rows, 'u-lpc', 'lpc')).toBe('ห้างหุ้นส่วนจำกัด ลำปางภาณุภัทร์ก่อสร้าง 2008')
  })

  it('works on the single row a contractor gets back for itself', () => {
    expect(letterContractorName([rows[1]], 'u-lpc', 'lpc')).toBe('ห้างหุ้นส่วนจำกัด ลำปางภาณุภัทร์ก่อสร้าง 2008')
  })

  it('falls back to the login name when there is no usable row', () => {
    expect(letterContractorName(rows, 'u-unknown', 'lpc')).toBe('lpc')
    expect(letterContractorName(rows, 'u-blank', 'blank')).toBe('blank')
    expect(letterContractorName(undefined, 'u-lpc', 'lpc')).toBe('lpc')
    expect(letterContractorName(rows, null, '-')).toBe('-')
  })
})
