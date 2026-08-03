import { describe, expect, it } from 'vitest'
import {
  apiResponseCameraOutageListSchema,
  apiResponseMarkCameraOutageReadSchema,
} from './manage-notifications'

// Fixtures lifted from docs/notifications/FRONTEND_NOTIFICATIONS.md §2–§3.

describe('apiResponseCameraOutageListSchema', () => {
  it('parses the documented list response (open, unread item)', () => {
    const result = apiResponseCameraOutageListSchema.safeParse({
      res_data: [
        {
          id: 48213,
          camera: {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'DRR-MaeWang-CAM34',
            ip_address: '192.168.53.34',
            sta: '0+200',
          },
          solution: { id: 500, name: 'จุดติดตั้งที่ 11' },
          road: { id: 2603, code: 'ชม.3001', name: 'สายทดสอบ' },
          department: { id: 84, short_name: 'ขทช.เชียงใหม่' },
          started_at: '2026-08-03T13:07:07.846+07:00',
          detected_at: '2026-08-03T13:23:06.902+07:00',
          recovered_at: null,
          is_open: true,
          is_read: false,
          duration_minutes: 20,
        },
      ],
      meta_data: { count: 37, page: 1, limit: 20, total_pages: 2 },
    })
    expect(result.success).toBe(true)
  })

  it('accepts null solution/road/department (§4) and a recovered item', () => {
    const result = apiResponseCameraOutageListSchema.safeParse({
      res_data: [
        {
          id: 1,
          camera: { id: 'u', name: 'CAM', ip_address: '10.0.0.1', sta: '0+000' },
          solution: null,
          road: null,
          department: null,
          started_at: '2026-08-03T00:00:00+07:00',
          detected_at: '2026-08-03T00:16:00+07:00',
          recovered_at: '2026-08-03T01:00:00+07:00',
          is_open: false,
          is_read: true,
          duration_minutes: 60,
        },
      ],
      meta_data: { count: 1, page: 1, limit: 1, total_pages: 1 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a payload missing meta_data (badge must come from meta_data.count)', () => {
    const result = apiResponseCameraOutageListSchema.safeParse({ res_data: [] })
    expect(result.success).toBe(false)
  })
})

describe('apiResponseMarkCameraOutageReadSchema', () => {
  it('parses the documented POST response', () => {
    const result = apiResponseMarkCameraOutageReadSchema.safeParse({
      res_code: 20000,
      res_data: { marked: 1 },
    })
    expect(result.success).toBe(true)
  })
})
