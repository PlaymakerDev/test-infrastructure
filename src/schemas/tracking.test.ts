import { describe, expect, it } from 'vitest'
import {
  apiResponseCalibrationHistoryStatusSchema,
  apiResponseLast7DaysSchema,
  apiResponsePCUSchema,
  apiResponsePositionByIDSchema,
  apiResponseStationByIDSchema,
  apiResponseStationDailySchema,
  apiResponseTrackingCCTVListSchema,
  apiResponseTrafficAvgSpeedSchema,
  apiResponseWeightStationLogSchema,
  apiResponseWeightWIMLogSchema,
  apiResponseWIMByIDSchema,
  apiResponseWIMDailySchema,
  weightWIMLogMetaSchema,
  wimMetaDataSchema,
} from './tracking'

const STATION_FIELDS = {
  station_id: 1,
  station_name: 'สถานี A',
  station_description: 'desc',
  location_description: 'loc',
  station_type: 1,
  province_id: 50,
  latitude: '18.79',
  longtitude: '98.98',
  total: 100,
  over: 5,
  is_enable: 1,
  enf_id: null,
  ip_address: '10.0.0.1',
  last_update: '2026-07-09',
  department_id: 1,
  delivery_year: '2565',
  update_year: null,
  kilometer_position: null,
  side: null,
  contract_number: null,
  contractor_name: null,
  remark: null,
}

const WIM_FIELDS = {
  ...STATION_FIELDS,
  owner: 'DRR',
  delivery_year: null,
}

// `CalibrateWIM` (unlike `WIMData` above) types delivery_year/update_year/
// kilometer_position/side/contract_number/contractor_name/remark as `string`,
// not `any` — a distinct, stricter contract worth its own fixture.
const CALIBRATE_WIM_FIELDS = {
  ...STATION_FIELDS,
  owner: 'DRR',
  delivery_year: '2565',
  update_year: '2566',
  kilometer_position: '10+500',
  side: 'left',
  contract_number: 'CON-001',
  contractor_name: 'บริษัท A',
  remark: '',
}

const WEIGHT_WIM_LOG_META = {
  page: 1,
  total: 10,
  page_size: '10',
  page_count: 1,
  has_previous_page: false,
  has_next_page: false,
  summary: { total: 10, overweight: 2, is_over_10_percent: 1 },
}

const WEIGHT_AXLE_ANY_FIELDS = {
  axle_left_01: null,
  axle_left_02: null,
  axle_left_03: null,
  axle_left_04: null,
  axle_left_05: null,
  axle_left_06: null,
  axle_left_07: null,
  axle_right_01: null,
  axle_right_02: null,
  axle_right_03: null,
  axle_right_04: null,
  axle_right_05: null,
  axle_right_06: null,
  axle_right_07: null,
}

describe('wimMetaDataSchema', () => {
  it('parses the tracking pagination envelope', () => {
    const result = wimMetaDataSchema.safeParse({
      has_next_page: false,
      has_previous_page: false,
      page: 1,
      page_count: 1,
      page_size: 10,
      total: 3,
    })
    expect(result.success).toBe(true)
  })
})

describe('weightWIMLogMetaSchema', () => {
  it('parses the shared weight-log meta (reused by WIM and STATION logs)', () => {
    expect(weightWIMLogMetaSchema.safeParse(WEIGHT_WIM_LOG_META).success).toBe(true)
  })
})

describe('apiResponseStationByIDSchema', () => {
  it('parses a valid station-by-id response', () => {
    const result = apiResponseStationByIDSchema.safeParse({ success: true, data: STATION_FIELDS })
    expect(result.success).toBe(true)
  })

  it('rejects a non-boolean success flag', () => {
    const result = apiResponseStationByIDSchema.safeParse({ success: 'yes', data: STATION_FIELDS })
    expect(result.success).toBe(false)
  })
})

describe('apiResponseWIMByIDSchema', () => {
  it('parses a valid wim-by-id response (owner field present)', () => {
    const result = apiResponseWIMByIDSchema.safeParse({ success: true, data: WIM_FIELDS })
    expect(result.success).toBe(true)
  })
})

describe('apiResponsePositionByIDSchema', () => {
  it('parses a valid position-by-id list', () => {
    const result = apiResponsePositionByIDSchema.safeParse([
      {
        StationID: 1,
        Latitude: '18.79',
        Longtitude: '98.98',
        StationName: 'สถานี A',
        StationDescription: 'desc',
        LocationDescription: 'loc',
        isEnable: 1,
        Total: 100,
        Over: 5,
      },
    ])
    expect(result.success).toBe(true)
  })

  it('parses an empty list', () => {
    expect(apiResponsePositionByIDSchema.safeParse([]).success).toBe(true)
  })
})

describe('apiResponsePCUSchema', () => {
  it('parses a valid PCU response', () => {
    const result = apiResponsePCUSchema.safeParse({
      success: true,
      data: { total_pcu: '1200', percent_truck: '15.5', aadt: '3400' },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCalibrationHistoryStatusSchema', () => {
  it('parses a valid calibration-history response', () => {
    const result = apiResponseCalibrationHistoryStatusSchema.safeParse({
      status: 'VALID',
      daysUntilExpiry: 45,
      latestCalibration: {
        id: 1,
        stationType: 3,
        stationId: 1,
        departmentId: null,
        calibrationDate: '2026-01-01',
        calibrationBy: 'ผู้ตรวจสอบ',
        calibrationCompany: 'บริษัท A',
        certificateNo: 'CERT-001',
        nextCalibrationDate: '2027-01-01',
        calibrationResult: 'PASS',
        remark: '',
        attachmentPath: null,
        createdBy: 'admin',
        createdAt: '2026-01-01',
        updatedBy: null,
        updatedAt: '2026-01-01',
        station: STATION_FIELDS,
        wim: CALIBRATE_WIM_FIELDS,
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseStationDailySchema', () => {
  it('parses a valid station-daily response', () => {
    const result = apiResponseStationDailySchema.safeParse({
      success: true,
      is_over10percent_count: 1,
      data: [
        {
          isover_10percent: 0,
          remark: 'ON',
          station_id: 1,
          station_name: 'สถานี A',
          total: 50,
          total_over: 2,
          date_time: '01/07/2569',
          date_time_ct: '2026-07-01',
        },
      ],
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 7, total: 7 },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseWIMDailySchema', () => {
  it('parses a valid wim-daily response (extra esal fields)', () => {
    const result = apiResponseWIMDailySchema.safeParse({
      success: true,
      is_over10percent_count: 1,
      data: [
        {
          isover_10percent: 0,
          avg_esal: '1.2',
          max_esal: '3.4',
          remark: 'ON',
          station_id: 1,
          station_name: 'WIM A',
          total: 50,
          total_over: 2,
          date_time: '01/07/2569',
          date_time_ct: '2026-07-01',
        },
      ],
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 7, total: 7 },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseLast7DaysSchema', () => {
  it('parses parallel column/total/over/esal arrays', () => {
    const result = apiResponseLast7DaysSchema.safeParse({
      column: ['จ.', 'อ.', 'พ.'],
      total: [100, 120, 90],
      over: [5, 6, 4],
      esal: [1, 2, 1],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseWeightWIMLogSchema', () => {
  it('parses a valid weight-wim-log response (gross_weight_over field)', () => {
    const result = apiResponseWeightWIMLogSchema.safeParse({
      meta: WEIGHT_WIM_LOG_META,
      data: [
        {
          td_id: 'TD-1',
          t_id: 'T-1',
          time_stamp: '2026-07-09 10:00:00',
          time_stamp_date: '2026-07-09',
          time_stamp_time: '10:00:00',
          today: '2026-07-09',
          enf_id: 'ENF-1',
          station_id: 1,
          station_name: 'WIM A',
          vehicle_class_id: 1,
          metrial_name: null,
          lp_head_no: 'กก-1234',
          lp_head_province_id: '50',
          province_name: 'เชียงใหม่',
          lp_tail_no: null,
          lp_tail_province_id: null,
          gross_weight: '25000',
          gross_weight_over: '3000',
          legal_weight: '22000',
          over10percent: '1',
          ...WEIGHT_AXLE_ANY_FIELDS,
          display_type: 1,
          is_over_weight: '1',
          driver_name: null,
          image_02_name: 'img2.jpg',
          image_01_name: 'img1.jpg',
          vehicle_class_desc2: 'รถบรรทุก',
          vehicle_class_desc3: '6 ล้อ',
          lp_head_province_name: 'เชียงใหม่',
          lp_head_province_id_ppa: 50,
          lp_tail_province_name: null,
          lp_tail_province_id_ppa: null,
          is_arrested: null,
          vehicle_class_name: 'รถบรรทุก 6 ล้อ',
          vehicle_class_desc: 'รถบรรทุก',
          vehicle_class_legal_weight: '22000',
          vehicle_class_legal_drive_shaft: '2',
          vehicle_class_legal_drive_shaft_ref: '2',
          vehicle_class_id_ref: 1,
          axle_01_weight: null,
          axle_02_weight: null,
          axle_03_weight: null,
          axle_04_weight: null,
          axle_05_weight: null,
          axle_06_weight: null,
          axle_07_weight: null,
          axle_08_weight: null,
          axle_09_weight: null,
          axle_10_weight: null,
          axle_11_weight: null,
          axle_12_weight: null,
          axle_13_weight: null,
          axle_14_weight: null,
          axle_count: '2',
          is_over_weight_desc: 'เกินพิกัด',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('parses an empty data list', () => {
    const result = apiResponseWeightWIMLogSchema.safeParse({ meta: WEIGHT_WIM_LOG_META, data: [] })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseWeightStationLogSchema', () => {
  it('parses a valid weight-station-log response (grossweight_over — no underscore)', () => {
    const result = apiResponseWeightStationLogSchema.safeParse({
      meta: WEIGHT_WIM_LOG_META,
      data: [
        {
          td_id: 'TD-1',
          t_id: 'T-1',
          time_stamp: '2026-07-09 10:00:00',
          enf_id: 'ENF-1',
          station_id: 1,
          station_name: 'สถานี A',
          vehicle_class_id: 1,
          meterial_name: null,
          lp_head_no: 'กก-1234',
          lp_head_province_id: '50',
          province_name: 'เชียงใหม่',
          lp_tail_no: null,
          lp_tail_province_id: null,
          gross_weight: '25000',
          grossweight_over: '3000',
          legal_weight: '22000',
          ...WEIGHT_AXLE_ANY_FIELDS,
          display_type: 1,
          is_over_weight: '1',
          drive_name: null,
          lp_head_province_name: 'เชียงใหม่',
          lp_head_province_id_ppa: 50,
          lp_tail_province_name: null,
          lp_tail_province_id_ppa: null,
          vehicle_class_name: 'รถบรรทุก 6 ล้อ',
          vehicle_class_desc2: 'รถบรรทุก',
          vehicle_class_desc3: '6 ล้อ',
          vehicle_class_desc: 'รถบรรทุก',
          vehicle_class_legal_weight: '22000',
          vehicle_class_legal_drive_shaft: '2',
          vehicle_class_legal_drive_shaft_ref: '2',
          vehicle_class_id_ref: 1,
          is_over_weight_desc: 'เกินพิกัด',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a row using the WIM field name instead of grossweight_over', () => {
    const badRow = {
      td_id: 'TD-1', t_id: 'T-1', time_stamp: '2026-07-09 10:00:00', enf_id: 'ENF-1',
      station_id: 1, station_name: 'สถานี A', vehicle_class_id: 1, meterial_name: null,
      lp_head_no: 'กก-1234', lp_head_province_id: '50', province_name: 'เชียงใหม่',
      lp_tail_no: null, lp_tail_province_id: null, gross_weight: '25000',
      gross_weight_over: '3000', // wrong field name — should be `grossweight_over`
      legal_weight: '22000', ...WEIGHT_AXLE_ANY_FIELDS, display_type: 1, is_over_weight: '1',
      drive_name: null, lp_head_province_name: 'เชียงใหม่', lp_head_province_id_ppa: 50,
      lp_tail_province_name: null, lp_tail_province_id_ppa: null, vehicle_class_name: 'x',
      vehicle_class_desc2: 'x', vehicle_class_desc3: 'x', vehicle_class_desc: 'x',
      vehicle_class_legal_weight: '22000', vehicle_class_legal_drive_shaft: '2',
      vehicle_class_legal_drive_shaft_ref: '2', vehicle_class_id_ref: 1, is_over_weight_desc: 'x',
    }
    const result = apiResponseWeightStationLogSchema.safeParse({ meta: WEIGHT_WIM_LOG_META, data: [badRow] })
    expect(result.success).toBe(false)
  })
})

describe('apiResponseTrafficAvgSpeedSchema', () => {
  it('parses a valid hourly avg-speed list', () => {
    const result = apiResponseTrafficAvgSpeedSchema.safeParse([
      { pid: 0, period: '00:00-01:00', period_name: '00.00', vehicle_count: '120', avg_speed: '78.5' },
    ])
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingCCTVListSchema', () => {
  it('parses a valid cctv-list response', () => {
    const result = apiResponseTrackingCCTVListSchema.safeParse({
      success: true,
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 100, total: 1 },
      data: [
        {
          camera_description: 'กล้อง 1',
          camera_ip: '10.0.0.1',
          camera_status: 'Online',
          camera_type: 'LPR',
          department_id: 1,
          department_name: 'สทช.1',
          id: 1,
          last_update: '2026-07-09',
          station_description: '10.0.0.1',
          station_id: 1,
          station_type_desc: 'WIM',
          station_type_id: 3,
          station_type_name: 'WIM',
          stream_url: 'https://example.com/stream.m3u8',
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})
