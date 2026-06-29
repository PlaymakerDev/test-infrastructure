import { describe, expect, it } from 'vitest'
import {
  apiResponseVMSDepartmentSchema,
  apiResponseVMSMediaByIdSchema,
  apiResponseVMSMediaSchema,
  apiResponseVMSSettingByRoadSchema,
  apiResponseVMSSettingScheduleSchema,
  apiResponseVMSSettingTypeSchema,
  apiResponseVMSUpcomingSummarySchema,
  vmsMediaListSchema,
  vmsSettingTypeSchema,
} from './control-vms'

describe('vmsSettingTypeSchema', () => {
  it('parses a valid setting type', () => {
    expect(vmsSettingTypeSchema.safeParse({ id: 1, name: 'ข้อความ' }).success).toBe(true)
  })

  it('rejects string id', () => {
    expect(vmsSettingTypeSchema.safeParse({ id: '1', name: 'ข้อความ' }).success).toBe(false)
  })
})

describe('apiResponseVMSSettingTypeSchema', () => {
  it('parses an array of setting types', () => {
    const result = apiResponseVMSSettingTypeSchema.safeParse([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
    expect(result.success).toBe(true)
  })

  it('parses empty array', () => {
    expect(apiResponseVMSSettingTypeSchema.safeParse([]).success).toBe(true)
  })
})

const VALID_DEPARTMENT_TREE = [
  {
    department_id: 1,
    department_short_name: 'สทช.1',
    camera_online_count: 5,
    camera_offline_count: 2,
    sub_department: [
      {
        department_id: 10,
        department_short_name: 'สาขา A',
        camera_online_count: 3,
        camera_offline_count: 1,
        roads: [
          {
            road_id: 100,
            road_name: 'ถนนราชพฤกษ์',
            road_code: 'RC-01',
            solution: [
              {
                vms_id: 1,
                solution_id: 1,
                solution_name: 'VMS-001',
                anydesk: '123456',
                geo_point: [100.5, 13.7],
                project: { id: 1, budget_year: 2566, contract_no: 'CON-001' },
                desktop_screen: '',
                last_connected: '2026-01-01T00:00:00Z',
                is_online: true,
                camera_online_count: 2,
                camera_offline_count: 0,
              },
            ],
          },
        ],
      },
    ],
  },
]

describe('apiResponseVMSDepartmentSchema', () => {
  it('parses a valid department tree', () => {
    expect(apiResponseVMSDepartmentSchema.safeParse(VALID_DEPARTMENT_TREE).success).toBe(true)
  })

  it('rejects if is_online is not boolean', () => {
    const broken = JSON.parse(JSON.stringify(VALID_DEPARTMENT_TREE))
    broken[0].sub_department[0].roads[0].solution[0].is_online = 1
    expect(apiResponseVMSDepartmentSchema.safeParse(broken).success).toBe(false)
  })

  it('rejects if geo_point contains a string', () => {
    const broken = JSON.parse(JSON.stringify(VALID_DEPARTMENT_TREE))
    broken[0].sub_department[0].roads[0].solution[0].geo_point = ['100.5', 13.7]
    expect(apiResponseVMSDepartmentSchema.safeParse(broken).success).toBe(false)
  })
})

const VALID_MEDIA_LIST_ITEM = {
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'admin',
  crossing_master_index: 'CMI-001',
  id: 1,
  media_url: 'https://example.com/media.jpg',
  message: 'Test message',
  setting_type: { id: 1, name: 'ข้อความ' },
  setting_type_id: 1,
  since: '2026-01-01',
  to: '2026-12-31',
  type_name: 'image',
}

describe('vmsMediaListSchema', () => {
  it('parses a valid media list item', () => {
    expect(vmsMediaListSchema.safeParse(VALID_MEDIA_LIST_ITEM).success).toBe(true)
  })

  it('rejects non-number id', () => {
    expect(vmsMediaListSchema.safeParse({ ...VALID_MEDIA_LIST_ITEM, id: 'abc' }).success).toBe(false)
  })
})

describe('apiResponseVMSMediaSchema', () => {
  it('parses a valid paginated media response', () => {
    const result = apiResponseVMSMediaSchema.safeParse({
      meta_data: { count: 1, page: 1, limit: 20, total_pages: 1 },
      res_data: [VALID_MEDIA_LIST_ITEM],
    })
    expect(result.success).toBe(true)
  })

  it('rejects malformed meta_data', () => {
    const result = apiResponseVMSMediaSchema.safeParse({
      meta_data: { count: 'one', page: 1, limit: 20, total_pages: 1 },
      res_data: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('apiResponseVMSUpcomingSummarySchema', () => {
  const valid = {
    count: { most_bureau: 'สทช.1', most_bureau_percent: 42.5, settings_count: 10 },
    upcoming: { setting_type_id: 1, setting_type_name: 'ข้อความ', solution_name: 'VMS-001' },
  }
  it('parses a valid upcoming summary', () => {
    expect(apiResponseVMSUpcomingSummarySchema.safeParse(valid).success).toBe(true)
  })
  it('rejects string most_bureau_percent', () => {
    const broken = { ...valid, count: { ...valid.count, most_bureau_percent: '42.5' } }
    expect(apiResponseVMSUpcomingSummarySchema.safeParse(broken).success).toBe(false)
  })
})

describe('apiResponseVMSSettingByRoadSchema', () => {
  const valid = [{
    department_short_name: 'สทช.1',
    road_code: 'RC-01',
    settings: [{
      display_hour: '08:00-20:00',
      is_online: true,
      setting_type_name: 'ข้อความ',
      settings_content: 'Hello',
      since: '2026-01-01',
      solution_name: 'VMS-001',
      to: '2026-12-31',
    }],
  }]
  it('parses a valid by-road response', () => {
    expect(apiResponseVMSSettingByRoadSchema.safeParse(valid).success).toBe(true)
  })
})

describe('apiResponseVMSSettingScheduleSchema', () => {
  const valid = [{
    setting_id: 1,
    solution_name: 'VMS-001',
    road_code: 'RC-01',
    anydesk: '123456',
    since: '2026-01-01',
    to: '2026-12-31',
    is_online: true,
    date_count: '5',
  }]
  it('parses a valid schedule response', () => {
    expect(apiResponseVMSSettingScheduleSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects non-boolean is_online', () => {
    const broken = [{ ...valid[0], is_online: 'true' }]
    expect(apiResponseVMSSettingScheduleSchema.safeParse(broken).success).toBe(false)
  })
})

describe('apiResponseVMSMediaByIdSchema', () => {
  const valid = {
    id: 1,
    crossing_master_index: 'CMI-001',
    type_name: 'image',
    media_url: 'https://example.com/image.jpg',
    since: '2026-01-01T00:00:00Z',
    to: '2026-12-31T23:59:59Z',
    message: 'Test',
    setting_type_id: 1,
    setting_type_name: 'ข้อความ',
    solution_name: 'VMS-001',
    department_id: 1,
    department_short_name: 'สทช.1',
    stch: 0,
    date_count: '5 วัน',
    created_at: '2026-01-01T00:00:00Z',
  }
  it('parses a valid media-by-id response', () => {
    expect(apiResponseVMSMediaByIdSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects non-number id', () => {
    expect(apiResponseVMSMediaByIdSchema.safeParse({ ...valid, id: 'abc' }).success).toBe(false)
  })
  it('rejects missing required field', () => {
    const { solution_name: _, ...rest } = valid
    expect(apiResponseVMSMediaByIdSchema.safeParse(rest).success).toBe(false)
  })
})
