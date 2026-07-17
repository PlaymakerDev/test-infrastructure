import { describe, expect, it } from 'vitest'
import {
  apiResponseDeleteVMSSettingTypeSchema,
  apiResponsePostVMSBatchDeleteSchema,
  apiResponsePostVMSSettingTypeSchema,
  apiResponsePutVMSSettingTypeSchema,
  apiResponseVMSDepartmentSchema,
  apiResponseVMSMediaByIdSchema,
  apiResponseVMSMediaSchema,
  apiResponseVMSNotificationsSchema,
  apiResponseVMSScheduleByDateSchema,
  apiResponseVMSSettingByRoadSchema,
  apiResponseVMSSettingByStatusSchema,
  apiResponseVMSSettingByVMSIDSchema,
  apiResponseVMSSettingListSchema,
  apiResponseVMSSettingStatusCountSchema,
  apiResponseVMSSettingTypeSchema,
  apiResponseVMSUpcomingSummarySchema,
  vmsDetailsSchema,
  vmsMediaListSchema,
  vmsSettingTypeSchema,
  vmsStatusResponseSchema,
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

describe('apiResponseVMSNotificationsSchema', () => {
  const valid = {
    count: 1,
    items: [{
      category: 'อุปกรณ์',
      event_code: 'VMS_ERROR',
      event_name: 'ป้าย VMS ขัดข้อง',
      setting_type_id: 1,
      status: 'alert',
      timestamp: '2026-01-01T00:00:00Z',
      type_name: 'ข้อความ',
    }],
  }
  it('parses a valid notifications response', () => {
    expect(apiResponseVMSNotificationsSchema.safeParse(valid).success).toBe(true)
  })
  it('parses an empty items array', () => {
    expect(apiResponseVMSNotificationsSchema.safeParse({ count: 0, items: [] }).success).toBe(true)
  })
  it('rejects an invalid status enum value', () => {
    const broken = { ...valid, items: [{ ...valid.items[0], status: 'unknown' }] }
    expect(apiResponseVMSNotificationsSchema.safeParse(broken).success).toBe(false)
  })
})

describe('vmsStatusResponseSchema', () => {
  const valid = {
    vms_id: 623,
    operation: { is_online: true, label: 'ทำงานปกติ', raw_status: 1 },
    stream: { is_online: true, last_connected: '2026-01-01T00:00:00Z' },
    box: { is_connected: true, label: 'connect', connected_count: 2, total_count: 2 },
    last_setting: { setting_id: 1, setting_type_id: 1, type_name: 'ข้อความ', media_type: 'image', status: 1 },
    zt_ip_address: '10.210.1.70',
  }
  it('parses a valid status response', () => {
    expect(vmsStatusResponseSchema.safeParse(valid).success).toBe(true)
  })
  it('parses a null last_setting (no currently-running command)', () => {
    expect(vmsStatusResponseSchema.safeParse({ ...valid, last_setting: null }).success).toBe(true)
  })
  it('parses null zt_ip_address and stream.last_connected', () => {
    const result = vmsStatusResponseSchema.safeParse({
      ...valid,
      zt_ip_address: null,
      stream: { ...valid.stream, last_connected: null },
    })
    expect(result.success).toBe(true)
  })
  it('rejects an invalid operation.label enum value', () => {
    const broken = { ...valid, operation: { ...valid.operation, label: 'unknown' } }
    expect(vmsStatusResponseSchema.safeParse(broken).success).toBe(false)
  })
})

describe('vmsDetailsSchema', () => {
  const valid = {
    id: 1,
    solution_id: 2877,
    last_connected: '2026-01-01T00:00:00Z',
    weather_id: null,
    crossings: { id: 1, vms_id: 594, wid: 1, crossing_master_index: 'CMI-001' },
    desktop_screen: { id: 1, vms_id: 594, desktop_screen: 'https://example.com/live.m3u8', video_timestamp: '2026-01-01T00:00:00Z' },
    solution: {
      id: 2877,
      solution_name: 'TrafficSign : ปท.3004 - จุดที่ 1',
      solution_type_id: 7,
      sta: null,
      solution_location: {
        solution_location_id: 1,
        location_name: 'กม.0+600',
        project_roads: { project_road_id: 1, road: { id: 7, road_code: 'ปท.3004', road_name: 'บ้านสวนสัก' } },
      },
    },
    vms_camera: [{
      id: 1, vms_id: 594, camera_id: 'abc-123',
      camera: {
        id: 'abc-123', ip_address: '10.101.27.2', department_id: 1, road_id: 7, solution_id: 2877,
        camera_name: 'CMI-001', sta: '0+600', hls_url: 'https://example.com/cam.m3u8', point_geometry: [100.5, 13.7],
        remark: '', created_by: 'system', created_at: '2026-01-01T00:00:00Z',
        ping_updated: '2026-01-01T00:00:00Z', ping_status: true,
        curl_updated: '2026-01-01T00:00:00Z', curl_status: true,
        contractor_id: '1', updated_at: '2026-01-01T00:00:00Z',
      },
    }],
    vms_weather: null,
  }
  it('parses a valid details response', () => {
    expect(vmsDetailsSchema.safeParse(valid).success).toBe(true)
  })
  it('parses null crossings/desktop_screen/solution_location/vms_weather', () => {
    const result = vmsDetailsSchema.safeParse({
      ...valid,
      crossings: null,
      desktop_screen: null,
      solution: { ...valid.solution, solution_location: null },
      vms_weather: null,
    })
    expect(result.success).toBe(true)
  })
  it('parses a response with crossings key entirely absent (confirmed live — most solutions have no crossing signal)', () => {
    const { crossings, ...withoutCrossings } = valid
    expect(vmsDetailsSchema.safeParse(withoutCrossings).success).toBe(true)
  })
  it('parses an empty vms_camera array', () => {
    expect(vmsDetailsSchema.safeParse({ ...valid, vms_camera: [] }).success).toBe(true)
  })
  it('rejects non-number solution_id', () => {
    expect(vmsDetailsSchema.safeParse({ ...valid, solution_id: '2877' }).success).toBe(false)
  })
})

const VALID_DEPARTMENT_TREE = [
  {
    department_id: 1,
    department_short_name: 'สทช.1',
    camera_online_count: 5,
    camera_offline_count: 2,
    noti_count: 4,
    sub_department: [
      {
        department_id: 10,
        department_short_name: 'สาขา A',
        camera_online_count: 3,
        camera_offline_count: 1,
        noti_count: 4,
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
                latitude: 13.7,
                longitude: 100.5,
                project: { id: 1, budget_year: 2566, contract_no: 'CON-001' },
                desktop_screen: '',
                last_connected: '2026-01-01T00:00:00Z',
                is_online: true,
                camera_online_count: 2,
                camera_offline_count: 0,
                noti_count: 4,
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

const VALID_MEDIA_SCHEDULE = {
  days_of_week: [1, 2, 3],
  id: 1,
  media_url: 'https://example.com/media.jpg',
  message: '',
  schedule_name: 'ตารางที่ 1',
  time_since: '08:00',
  time_to: '18:00',
}

const VALID_MEDIA_LIST_ITEM = {
  created_at: '2026-01-01T00:00:00Z',
  crossing_master_index: 'CMI-001',
  date_since: '2026-01-01',
  date_to: '2026-12-31',
  id: 1,
  is_all_day: false,
  schedules: [VALID_MEDIA_SCHEDULE],
  setting_type: { id: 1, name: 'ข้อความ' },
  setting_type_id: 1,
  status: 0,
  status_updated_at: '2026-01-01T00:00:00Z',
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
    count: { disconnected_count: 2, most_bureau: 'สทช.1', most_bureau_percent: 42.5, playing_count: 8, settings_count: 10 },
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
    region_name: 'ภาคกลาง',
    settings: [{
      display_hour: '08:00-20:00',
      end_date: '2026-12-31',
      is_online: true,
      setting_type_name: 'ข้อความ',
      settings_content: 'Hello',
      solution_name: 'VMS-001',
      start_date: '2026-01-01',
      status: 1,
      status_name: 'กำลังแสดงผล',
    }],
  }]
  it('parses a valid by-road response', () => {
    expect(apiResponseVMSSettingByRoadSchema.safeParse(valid).success).toBe(true)
  })
})

describe('apiResponseVMSScheduleByDateSchema', () => {
  const validRow = {
    setting_id: 1,
    date: '2026-07-01',
    time_since: '08:00',
    time_to: '18:00',
    solution_name: 'VMS-001',
    road_code: 'RC-01',
    anydesk: '123456',
    date_count: '5',
    status: 1,
    status_name: 'กำลังแสดงผล',
    is_online: true,
  }
  it('parses a valid schedule-by-date response', () => {
    const result = apiResponseVMSScheduleByDateSchema.safeParse({ '2026-07-01': [validRow] })
    expect(result.success).toBe(true)
  })
  it('parses an empty record', () => {
    expect(apiResponseVMSScheduleByDateSchema.safeParse({}).success).toBe(true)
  })
  it('rejects non-boolean is_online', () => {
    const broken = { '2026-07-01': [{ ...validRow, is_online: 'true' }] }
    expect(apiResponseVMSScheduleByDateSchema.safeParse(broken).success).toBe(false)
  })
})

describe('apiResponseVMSMediaByIdSchema', () => {
  const valid = {
    id: 1,
    crossing_master_index: 'CMI-001',
    type_name: 'image',
    date_since: '2026-01-01T00:00:00Z',
    date_to: '2026-12-31T23:59:59Z',
    is_all_day: false,
    schedules: [VALID_MEDIA_SCHEDULE],
    setting_type_id: 1,
    setting_type_name: 'ข้อความ',
    solution_name: 'VMS-001',
    department_id: 1,
    department_short_name: 'สทช.1',
    status: 1,
    status_name: 'กำลังแสดงผล',
    status_updated_at: '2026-01-01T00:00:00Z',
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

describe('apiResponseVMSSettingByStatusSchema', () => {
  const valid = [{
    vms_id: 1,
    setting_id: 10,
    type_name: 'ข้อความ',
    status: 1,
    status_name: 'กำลังแสดงผล',
    is_all_day: false,
    is_online: true,
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    road_code: 'RC-01',
    solution_name: 'VMS-001',
    screen_capture_url: 'https://example.com/screen.jpg',
    cameras: [{ camera_id: 'CAM-1', camera_name: 'กล้อง 1', hls_url: 'https://example.com/live.m3u8' }],
    schedules: [{ days_of_week: [1, 2], schedule_id: 1, schedule_name: 'ตารางที่ 1', time_since: '08:00', time_to: '18:00' }],
  }]
  it('parses a valid by-status response', () => {
    expect(apiResponseVMSSettingByStatusSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects non-array days_of_week', () => {
    const broken = [{ ...valid[0], schedules: [{ ...valid[0].schedules[0], days_of_week: '1,2' }] }]
    expect(apiResponseVMSSettingByStatusSchema.safeParse(broken).success).toBe(false)
  })
  it('rejects missing cameras field', () => {
    const { cameras: _, ...rest } = valid[0]
    expect(apiResponseVMSSettingByStatusSchema.safeParse([rest]).success).toBe(false)
  })
})

describe('apiResponseVMSSettingStatusCountSchema', () => {
  const valid = [{ count: 5, status_id: 1, status_name: 'กำลังแสดงผล' }]
  it('parses a valid status count response', () => {
    expect(apiResponseVMSSettingStatusCountSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects string count', () => {
    const broken = [{ ...valid[0], count: '5' }]
    expect(apiResponseVMSSettingStatusCountSchema.safeParse(broken).success).toBe(false)
  })
})

describe('apiResponsePostVMSBatchDeleteSchema', () => {
  it('parses a valid batch-delete response', () => {
    expect(apiResponsePostVMSBatchDeleteSchema.safeParse({ res_code: 200, res_data: 'success' }).success).toBe(true)
  })
  it('rejects missing res_code', () => {
    expect(apiResponsePostVMSBatchDeleteSchema.safeParse({ res_data: 'success' }).success).toBe(false)
  })
})

describe('apiResponseVMSSettingByVMSIDSchema', () => {
  const valid = [{
    schedule: [{ schedule_name: 'ตารางที่ 1', time_since: '08:00', time_to: '18:00' }],
    solution_name: 'VMS-001',
    status: 1,
    status_name: 'กำลังแสดงผล',
  }]
  it('parses a valid by-vms-ids response', () => {
    expect(apiResponseVMSSettingByVMSIDSchema.safeParse(valid).success).toBe(true)
  })
  it('parses an empty schedule array (VMS with no current command)', () => {
    const broken = [{ ...valid[0], schedule: [] }]
    expect(apiResponseVMSSettingByVMSIDSchema.safeParse(broken).success).toBe(true)
  })
  it('rejects non-number status', () => {
    const broken = [{ ...valid[0], status: '1' }]
    expect(apiResponseVMSSettingByVMSIDSchema.safeParse(broken).success).toBe(false)
  })
})

describe('apiResponseVMSSettingListSchema', () => {
  const validItem = {
    anydesk: '123456',
    camera_offline_count: 0,
    camera_online_count: 2,
    desktop_screen: '',
    geo_point: [100.5, 13.7],
    is_online: true,
    last_connected: '2026-01-01T00:00:00Z',
    project: { id: 1, budget_year: 2566, contract_no: 'CON-001' },
    solution_id: 1,
    solution_name: 'VMS-001',
    vms_id: 1,
  }
  it('parses a valid setting-list response', () => {
    const result = apiResponseVMSSettingListSchema.safeParse({
      meta_data: { count: 1, page: 1, limit: 20, total_pages: 1 },
      res_data: [validItem],
    })
    expect(result.success).toBe(true)
  })
  it('rejects non-array geo_point entries', () => {
    const broken = { ...validItem, geo_point: ['100.5', 13.7] }
    const result = apiResponseVMSSettingListSchema.safeParse({
      meta_data: { count: 1, page: 1, limit: 20, total_pages: 1 },
      res_data: [broken],
    })
    expect(result.success).toBe(false)
  })
})

describe('apiResponsePostVMSSettingTypeSchema / apiResponsePutVMSSettingTypeSchema / apiResponseDeleteVMSSettingTypeSchema', () => {
  it('all three alias the shared APIResponsePost shape and parse a valid response', () => {
    const valid = { res_code: 200, res_data: 'success' }
    expect(apiResponsePostVMSSettingTypeSchema.safeParse(valid).success).toBe(true)
    expect(apiResponsePutVMSSettingTypeSchema.safeParse(valid).success).toBe(true)
    expect(apiResponseDeleteVMSSettingTypeSchema.safeParse(valid).success).toBe(true)
  })
  it('rejects a response missing res_data', () => {
    const broken = { res_code: 200 }
    expect(apiResponsePostVMSSettingTypeSchema.safeParse(broken).success).toBe(false)
  })
})
