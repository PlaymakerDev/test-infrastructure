import { describe, expect, it } from 'vitest'
import {
  apiResponseCalibrationHistoryStatusSchema,
  apiResponseLast7DaysSchema,
  apiResponseMobileCarSchema,
  apiResponseMobileDailyCountSchema,
  apiResponseMobileMasterDepartmentByTIDSchema,
  apiResponseMobileMasterSchema,
  apiResponsePCUSchema,
  apiResponsePositionByIDSchema,
  apiResponseStationByIDSchema,
  apiResponseStationDailySchema,
  apiResponseTrackingAllDepartmentSchema,
  apiResponseTrackingCCTVListSchema,
  apiResponseTrackingCollaborationSchema,
  apiResponseTrackingDailySumSchema,
  apiResponseTrackingMobileMasterSchema,
  apiResponseTrackingPositionSchema,
  apiResponseTrackingSumStationSchema,
  apiResponseTrackingSumWeightYearV2Schema,
  apiResponseTrackingSumWimSchema,
  apiResponseTrackingTotalStationSchema,
  apiResponseTrackingViewSumPlanChartSchema,
  apiResponseTrackingWeightInspectionSchema,
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

describe('apiResponseMobileDailyCountSchema', () => {
  it('parses a valid mobile daily-status-count response', () => {
    const result = apiResponseMobileDailyCountSchema.safeParse({
      success: true,
      data: {
        actual: 5,
        axis_over_gross_weight: 12.5,
        fiscal_year: 2569,
        max_grossweight_not_over: 50,
        max_grossweight_over: 55,
        max_grossweight_over_percent: 10,
        open_station_count: 3,
        plan: 10,
        sum_total: 100,
        sum_total_over: 8,
        top_region: null,
        top_region_open_count: 1,
        top_region_percent: 25,
        total_station_count: 5,
        weight_axis_over_count: 4,
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseMobileMasterDepartmentByTIDSchema', () => {
  it('parses a valid mobile master-department-by-tid response', () => {
    const result = apiResponseMobileMasterDepartmentByTIDSchema.safeParse({
      success: true,
      data: {
        FirstName: 'สมชาย',
        LastName: 'ใจดี',
        Title: 'นาย',
        Total: '100',
        TotalOver: '5',
        collaboration: 'กช.',
        create_by: 'admin',
        create_date: '20/04/2569',
        dept_id: 1,
        dept_province: 'เชียงใหม่',
        district: 'เมือง',
        image_name1: 'img1.jpg',
        image_name2: 'img2.jpg',
        image_path1: 'https://example.com/img1.jpg',
        image_path2: 'https://example.com/img2.jpg',
        is_open: 1,
        km_from: '10+000',
        km_to: '15+000',
        latitude: '18.79',
        longitude: '98.98',
        province: 'เชียงใหม่',
        sub_district: 'ตำบล',
        tid: 'T-1',
        time_from: '08:00:00',
        time_to: '16:00:00',
        way_id: 'W-1',
        way_name: 'สายทาง A',
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseMobileCarSchema', () => {
  it('parses a valid mobile-car response', () => {
    const result = apiResponseMobileCarSchema.safeParse({
      success: true,
      data: {
        meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 10, total: 1 },
        data: [
          {
            accept_weight: null,
            accept_weight_by: null,
            arrest_id: null,
            create_date: '20/04/2569 15:27:56',
            driver_name: null,
            driver_shaft: '2',
            ds_1: '1', ds_2: '2',
            gross_weight: '25000',
            gross_weight_over: null,
            image_path0: 'a.jpg', image_path1: 'a.jpg', image_path2: 'a.jpg',
            image_path3: 'a.jpg', image_path4: 'a.jpg', image_path5: 'a.jpg', image_path6: 'a.jpg',
            is_arrested: 0,
            is_over_weight: 'N',
            is_over_weight_desc: 'น้ำหนักปกติ',
            legal_weight: '25000',
            lp_head: '82-9960 ร้อยเอ็ด',
            lp_head_no: '82-9960',
            lp_head_province_id: 45,
            lp_head_province_id_ppa: 45,
            lp_head_province_name: 'ร้อยเอ็ด',
            lp_tail: '', lp_tail_no: '',
            masterial_name: 'ดิน',
            t_id: 'T-1',
            td_id: 'TD-1',
            tdid_sort: 1,
            vehicle_class_desc: 'ประเภท 16', vehicle_class_desc2: 'พ่วง 6 เพลา', vehicle_class_desc3: '20 เส้น',
            vehicle_class_id: 16,
            vehicle_class_id_ref: 16,
            vehicle_class_legal_drive_shaft: '20',
            vehicle_class_legal_drive_shaft_ref: '20',
            vehicle_class_legal_weight: '50000',
            vehicle_class_name: 'รถพ่วง',
          },
        ],
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseMobileMasterSchema', () => {
  it('parses a valid mobile-master list response', () => {
    const result = apiResponseMobileMasterSchema.safeParse({
      success: true,
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 10, total: 1 },
      data: [
        {
          TID: 'T-1',
          DeptID: 1,
          DeptName: 'หน่วยจัดตั้ง A',
          Collaboration: 'กช.',
          DeptProvince: 'เชียงใหม่',
          WayID: 'W-1',
          WayName: 'สายทาง A',
          Subdistrict: 'ตำบล',
          District: 'เมือง',
          Province: 'เชียงใหม่',
          CreateBy: 'admin',
          Title: 'นาย',
          FirstName: 'สมชาย',
          LastName: 'ใจดี',
          CreateDate: '20/04/2569',
          TimeFrom: '14:44:03',
          TimeTo: '20:44:03',
          IsOpen: 1,
          Total: '4',
          TotalOver: '0',
          KMFrom: '10+000',
          KMTo: '15+000',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('parses an empty list', () => {
    const result = apiResponseMobileMasterSchema.safeParse({
      success: true,
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 0, page_size: 10, total: 0 },
      data: [],
    })
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

describe('apiResponseTrackingDailySumSchema', () => {
  it('parses a valid daily-sum response', () => {
    const result = apiResponseTrackingDailySumSchema.safeParse({
      success: true,
      data: {
        all_sum: { over: 5, total: 100 },
        items: [
          { create_date: '2026-07-20', over: '2', station_type: 1, station_type_desc: 'สถานี', station_type_eng: 'station', total: '40' },
          { create_date: '2026-07-20', over: '1', station_type: 3, station_type_desc: 'WIM', station_type_eng: 'wim', total: '35' },
          { create_date: '2026-07-20', over: '2', station_type: 2, station_type_desc: 'เคลื่อนที่', station_type_eng: 'mobile', total: '25' },
        ],
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingTotalStationSchema', () => {
  it('parses a valid total-station response', () => {
    const result = apiResponseTrackingTotalStationSchema.safeParse({
      mobile: { total: '10', open: '8' },
      wim: { open: '5', total: '6' },
      station: { open: '4', total: '5' },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingWeightInspectionSchema', () => {
  it('parses a valid weight-inspection response', () => {
    const result = apiResponseTrackingWeightInspectionSchema.safeParse({
      success: true,
      data: [
        { create_date: '2026-07-14', date_value: 'จ.', over: '2', over_title: 'น้ำหนักเกิน', total: '40', total_title: 'รถเข้าชั่งทั้งหมด' },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingSumWeightYearV2Schema', () => {
  it('parses a valid sum-weight-year-v2 response', () => {
    const result = apiResponseTrackingSumWeightYearV2Schema.safeParse({
      success: true,
      data: {
        data: [
          {
            all_total: 100, arrest_total: 2, judge_total: 1, plan_total: 90, result_total: 95,
            spot_check_total: 10, station_total: 50, way_id_total: 5, wim_total: 40, year_total: 2569,
          },
        ],
        summary: [
          {
            all_total: '100', arrest_total: '2', judge_total: '1', note: '', plan_total: '90', result_total: '95',
            spot_check_total: '10', station_total: '50', way_id_total: '5', wim_total: '40', year_total: '2569',
          },
        ],
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingViewSumPlanChartSchema', () => {
  it('parses a valid view-sum-plan-chart response', () => {
    const result = apiResponseTrackingViewSumPlanChartSchema.safeParse({
      all_sum: { plan_total: 100, result_total: 90 },
      item: [{ month: 'ม.ค.', plan: 10, result: 8, year: '2569' }],
      plan_year: '2569',
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingPositionSchema', () => {
  it('parses a valid position response', () => {
    const result = apiResponseTrackingPositionSchema.safeParse({
      station: [{
        StationID: 1, StationName: 'สถานี A', StationDescription: 'desc', LocationDescription: 'loc',
        Latitude: '18.79', Longtitude: '98.98', isEnable: 1, Total: 100, Over: 5,
      }],
      wim: [{
        StationID: 2, StationName: 'WIM A', StationDescription: 'desc', LocationDescription: 'loc',
        Latitude: '18.79', Longtitude: '98.98', isEnable: 1, Total: 100, Over: 5,
      }],
      mobile: [{
        TID: 1, Latitude: '18.79', Longtitude: '98.98', WayID: 'W-1', first_name: 'สมชาย', last_name: 'ใจดี',
      }],
      location: [{ latitude: '18.79', longitude: '98.98' }, {}],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingSumStationSchema', () => {
  it('parses a valid sum-station response', () => {
    const result = apiResponseTrackingSumStationSchema.safeParse({
      success: true,
      data: [{
        station_id: 1, name: 'สถานี A', station_type: 1, delivery_year: '2565', update_year: null,
        kilometer_position: null, contract_number: null, contractor_name: null, station_type_desc: 'สถานี',
        station_type_eng: 'station', create_date: '2026-07-20', total: '100', over: '5', total_cctv: '4', offline_cctv: '0',
      }],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingSumWimSchema', () => {
  it('parses a valid sum-wim response', () => {
    const result = apiResponseTrackingSumWimSchema.safeParse({
      success: true,
      data: [{
        station_id: 1, name: 'WIM A', station_type: 3, station_type_desc: 'WIM', station_type_eng: 'wim',
        create_date: '2026-07-20', total: '100', over: '5', over_10percent: '2', total_cctv: '4', offline_cctv: '0',
      }],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingCollaborationSchema', () => {
  it('parses a valid collaboration response', () => {
    const result = apiResponseTrackingCollaborationSchema.safeParse({
      success: true,
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 10, total: 1 },
      data: [{
        uid: 1, t_id: 'T-1', image_path1: 'a.jpg', image_path2: 'b.jpg', image_name1: 'a', image_name2: 'b',
        way_id: 1, way_code: 'W-1', collaboration: 'กช.', department_id: 1, department_name: 'หน่วยงาน A',
        department_province: 'เชียงใหม่', department_name2: 'หน่วยงาน A2', create_date: '20/04/2569',
      }],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingMobileMasterSchema', () => {
  it('parses a valid tracking/overall mobile-master response (distinct copy from detail/mobile)', () => {
    const result = apiResponseTrackingMobileMasterSchema.safeParse({
      success: true,
      meta: { has_next_page: false, has_previous_page: false, page: 1, page_count: 1, page_size: 100, total: 1 },
      data: [{
        TID: 'T-1', DeptID: 1, DeptName: 'หน่วยจัดตั้ง A', Collaboration: 'กช.', DeptProvince: 'เชียงใหม่',
        WayID: 'W-1', WayName: 'สายทาง A', Subdistrict: 'ตำบล', District: 'เมือง', Province: 'เชียงใหม่',
        CreateBy: 'admin', Title: 'นาย', FirstName: 'สมชาย', LastName: 'ใจดี', CreateDate: '20/04/2569',
        TimeFrom: '14:44:03', TimeTo: null, IsOpen: 1, Total: '4', TotalOver: '0', KMFrom: '10+000', KMTo: '15+000',
      }],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseTrackingAllDepartmentSchema', () => {
  it('parses a valid all-department response', () => {
    const result = apiResponseTrackingAllDepartmentSchema.safeParse({
      success: true,
      data: [{
        id: 1, name: 'หน่วยงาน A', type: 1, group: 1, province: 'เชียงใหม่', group_drr: 1,
        station_id: null, name2: 'หน่วยงาน A2', contract_number: null, contractor_name: null, remark: null,
      }],
    })
    expect(result.success).toBe(true)
  })
})
