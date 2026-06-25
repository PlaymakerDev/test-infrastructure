import { describe, expect, it } from 'vitest'
import { apiResponseContactDetailSchema, apiResponsePostSchema, metaDataSchema, uploadResponseSchema } from './shared'

describe('metaDataSchema', () => {
  it('parses a valid MetaData object', () => {
    const result = metaDataSchema.safeParse({ count: 42, page: 2, limit: 20, total_pages: 3 })
    expect(result.success).toBe(true)
  })

  it('rejects non-number count', () => {
    const result = metaDataSchema.safeParse({ count: '42', page: 2, limit: 20, total_pages: 3 })
    expect(result.success).toBe(false)
  })

  it('rejects missing total_pages', () => {
    const result = metaDataSchema.safeParse({ count: 42, page: 2, limit: 20 })
    expect(result.success).toBe(false)
  })
})

describe('apiResponsePostSchema', () => {
  it('parses a valid post response', () => {
    const result = apiResponsePostSchema.safeParse({ res_code: 200, res_data: 'ok' })
    expect(result.success).toBe(true)
  })

  it('rejects numeric res_data', () => {
    const result = apiResponsePostSchema.safeParse({ res_code: 200, res_data: 123 })
    expect(result.success).toBe(false)
  })
})

describe('uploadResponseSchema', () => {
  it('parses a valid upload response', () => {
    const result = uploadResponseSchema.safeParse({ path: '/uploads/image.jpg' })
    expect(result.success).toBe(true)
  })

  it('rejects missing path', () => {
    const result = uploadResponseSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('apiResponseContactDetailSchema', () => {
  const valid = {
    id: 1,
    project_name: 'Test Project',
    contract_no: 'CON-001',
    department_name: 'Dept A',
    warranty_start_date: '2024-01-01',
    warranty_end_date: '2026-01-01',
    warranty_date: 365,
    warranty_status: 'ในค้ำ',
    company_name: 'ACME Co.',
  }

  it('parses a valid contact detail', () => {
    expect(apiResponseContactDetailSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects missing company_name', () => {
    const { company_name, ...rest } = valid
    expect(apiResponseContactDetailSchema.safeParse(rest).success).toBe(false)
  })

  it('accepts any warranty_status string (future-proofing)', () => {
    const result = apiResponseContactDetailSchema.safeParse({ ...valid, warranty_status: 'ก่อนค้ำ' })
    expect(result.success).toBe(true)
  })
})
