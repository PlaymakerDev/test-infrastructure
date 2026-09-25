import { describe, expect, it } from 'vitest'
import {
  apiResponseMarkFeedReadSchema,
  apiResponseNotificationFeedSchema,
  notificationFeedItemSchema,
} from './manage-notifications'

// Fixtures are the real production payloads captured 2026-09-21 (the same
// ones printed in FRONTEND_NOTIFICATION_FEED.md §1).

const OUTAGE_OPEN = {
  kind: 'camera_outage',
  id: '329954',
  occurred_at: '2026-09-21T14:24:45.738547+07:00',
  is_open: true,
  is_read: false,
  solution: { id: 229, name: 'ชพ.1007 จุดที่ 1' },
  road: { id: 1970, code: 'ชพ.1007', name: 'น้ำตกจำปูน' },
  department: { id: 56, short_name: 'ขทช.ชุมพร' },
  camera: {
    id: '019c93da-4bee-72c0-aaad-346179b3db72',
    name: '22 - กม.0+000',
    ip_address: '11.0.10.63',
    sta: '0+000',
  },
  started_at: '2026-09-21T14:24:45.738547+07:00',
  detected_at: '2026-09-21T14:39:49.991756+07:00',
  // no recovered_at key at all — still down
  duration_minutes: 15,
}

const CASE_OPEN = {
  kind: 'case',
  id: 'd9d61329-4e52-40c8-92af-2ff5fe662805',
  occurred_at: '2026-09-21T16:50:00.241752+07:00',
  is_open: true,
  is_read: false,
  solution: { id: 5320, name: 'ชม.5036 กม.17+825' },
  road: { id: 1770, code: 'ชม.5036', name: 'บ้านธาตุ' },
  department: { id: 50, short_name: 'ขทช.เชียงใหม่' },
  case: {
    case_no: 'C-20260921-0009',
    status: 'open',
    category: 'อุปกรณ์ออฟไลน์',
    problem: 'อุปกรณ์ ชม.5036 กม.17+825 ออฟไลน์เกิน 30 นาที (auto-generated)',
    due_date: null,
    camera_count: 0,
  },
}

describe('notificationFeedItemSchema', () => {
  it('parses an open camera outage that has no recovered_at key', () => {
    expect(notificationFeedItemSchema.safeParse(OUTAGE_OPEN).success).toBe(true)
  })

  it('parses a recovered camera outage (recovered_at present)', () => {
    const recovered = {
      ...OUTAGE_OPEN,
      id: '331342',
      is_open: false,
      recovered_at: '2026-09-21T17:32:18.843781+07:00',
      duration_minutes: 16,
    }
    expect(notificationFeedItemSchema.safeParse(recovered).success).toBe(true)
  })

  it('parses a case item', () => {
    expect(notificationFeedItemSchema.safeParse(CASE_OPEN).success).toBe(true)
  })

  it('accepts null solution/road/department', () => {
    const orphan = { ...OUTAGE_OPEN, solution: null, road: null, department: null }
    expect(notificationFeedItemSchema.safeParse(orphan).success).toBe(true)
  })

  it('accepts an empty-string case category (it is "" , never null)', () => {
    const blank = { ...CASE_OPEN, case: { ...CASE_OPEN.case, category: '' } }
    expect(notificationFeedItemSchema.safeParse(blank).success).toBe(true)
  })

  it('rejects a numeric id — case uuids break if coerced', () => {
    const numeric = { ...OUTAGE_OPEN, id: 329954 }
    expect(notificationFeedItemSchema.safeParse(numeric).success).toBe(false)
  })

  it('rejects a case item with no `case` block', () => {
    const noCase: Record<string, unknown> = { ...CASE_OPEN }
    delete noCase.case
    expect(notificationFeedItemSchema.safeParse(noCase).success).toBe(false)
  })
})

describe('apiResponseNotificationFeedSchema', () => {
  it('parses a mixed page of both kinds', () => {
    const result = apiResponseNotificationFeedSchema.safeParse({
      res_data: [CASE_OPEN, OUTAGE_OPEN],
      meta_data: { count: 7118, page: 1, limit: 20, total_pages: 356 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a payload missing meta_data (the badge comes from meta_data.count)', () => {
    expect(apiResponseNotificationFeedSchema.safeParse({ res_data: [] }).success).toBe(false)
  })
})

describe('apiResponseMarkFeedReadSchema', () => {
  it('parses the documented POST response', () => {
    const result = apiResponseMarkFeedReadSchema.safeParse({
      res_code: 20000,
      res_data: { marked: 2 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts marked: 0 — a repeat mark is a success, not an error', () => {
    const result = apiResponseMarkFeedReadSchema.safeParse({
      res_code: 20000,
      res_data: { marked: 0 },
    })
    expect(result.success).toBe(true)
  })
})
