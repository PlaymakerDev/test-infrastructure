import { describe, expect, it } from 'vitest'
import {
  apiResponseLPRPlatesSchema,
  apiResponseLPRPlateDetailSchema,
  apiResponseLPRTimelineSchema,
} from './lpr'

describe('apiResponseLPRPlatesSchema', () => {
  it('parses a WIM list item (with next_cursor + has_more)', () => {
    const result = apiResponseLPRPlatesSchema.safeParse({
      res_data: [
        {
          plate_number: '6กต4724',
          plate_province: 'กรุงเทพมหานคร',
          vehicle_type_name: 'รถกระบะ',
          vehicle_type_number: 'ประเภท 1',
          source: 'wim',
          sources: ['wim', 'anpr'],
          detection_point: 'WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100',
          captured_at: '2026-07-15T15:08:42+07:00',
          captured_at_display: '15 ก.ค. 2569 15:08:42',
        },
      ],
      next_cursor: 'eyJj',
      has_more: true,
    })
    expect(result.success).toBe(true)
  })

  it('parses an ANPR item with null detection_point + optional vehicle_type_number', () => {
    const result = apiResponseLPRPlatesSchema.safeParse({
      res_data: [
        {
          plate_number: 'กว7683',
          plate_province: 'เชียงราย',
          vehicle_type_name: null,
          vehicle_type_number: 1,
          source: 'anpr',
          detection_point: null,
          captured_at: '2026-07-15T14:03:25+07:00',
          captured_at_display: '15 ก.ค. 2569 14:03:25',
        },
      ],
      has_more: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown source', () => {
    const result = apiResponseLPRPlatesSchema.safeParse({
      res_data: [
        {
          plate_number: 'x',
          plate_province: 'y',
          vehicle_type_name: null,
          source: 'radar',
          detection_point: null,
          captured_at: '',
          captured_at_display: '',
        },
      ],
      has_more: false,
    })
    expect(result.success).toBe(false)
  })
})

describe('apiResponseLPRPlateDetailSchema', () => {
  it('parses a full detail payload', () => {
    const result = apiResponseLPRPlateDetailSchema.safeParse({
      plate_number: '6กต4724',
      plate_province: 'กรุงเทพมหานคร',
      first_seen: {
        captured_at: '2026-01-25T09:15:00+07:00',
        captured_at_display: '25 ม.ค. 2569',
        source: 'wim',
        detection_point: 'WIM ชุมพร (ชพ.2058)',
        camera_name: null,
      },
      latest: {
        captured_at: '2026-07-15T14:30:22+07:00',
        captured_at_display: '15 ก.ค. 2569 14:30:22',
        source: 'wim',
        detection_point: 'WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100',
        camera_name: null,
        detection_location: [13.6904, 101.0779],
      },
      metadata: {
        plate_type: 'รถยนต์นั่งส่วนบุคคลไม่เกิน 7 คน',
        vehicle_type_number: null,
        vehicle_type_name: 'รถกระบะ',
        vehicle_brand: 'Toyota',
        vehicle_color: 'ขาว',
      },
      map_pins: [
        {
          detection_point: 'WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100',
          source: 'wim',
          count: 3,
          latest_captured_at: '2026-07-15T14:30:22+07:00',
          latest_captured_at_display: '15 ก.ค. 2569 14:30:22',
          detection_location: [13.6904, 101.0779],
        },
      ],
      frequent_areas: [
        {
          detection_point: 'สายทาง สป.2014 กม.0+005',
          source: 'anpr',
          count: 12,
          detection_location: [13.711222, 100.784481],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts null / [null,null] coordinates', () => {
    const result = apiResponseLPRPlateDetailSchema.safeParse({
      plate_number: '6กต4724',
      plate_province: 'กรุงเทพมหานคร',
      first_seen: {
        captured_at: '',
        captured_at_display: '',
        source: 'anpr',
        detection_point: null,
        camera_name: null,
      },
      latest: {
        captured_at: '',
        captured_at_display: '',
        source: 'anpr',
        detection_point: null,
        camera_name: null,
        detection_location: [null, null],
      },
      metadata: {
        plate_type: null,
        vehicle_type_number: null,
        vehicle_type_name: null,
        vehicle_brand: null,
        vehicle_color: null,
      },
      map_pins: [],
      frequent_areas: [
        {
          detection_point: null,
          source: 'anpr',
          count: 1,
          detection_location: null,
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseLPRTimelineSchema', () => {
  it('parses a WIM event (weight fields present)', () => {
    const result = apiResponseLPRTimelineSchema.safeParse({
      res_data: [
        {
          id: 695810,
          source: 'wim',
          captured_at: '2026-07-15T15:08:42+07:00',
          captured_at_display: '15 ก.ค. 2569 15:08:42',
          detection_point: 'WIM สมุทรปราการ (สป.2001) ขวาทาง กม.2+100',
          camera_name: null,
          detection_location: [13.6904, 101.0779],
          vehicle_image: 'https://wts.drr.go.th/vehicle.jpg',
          plate_image: 'https://wts.drr.go.th/plate.jpg',
          speed: 67,
          lane: 1,
          grossweight: 1.6,
          legalweight: 9.5,
          is_overweight: false,
        },
      ],
      next_cursor: 'eyJj',
      has_more: true,
    })
    expect(result.success).toBe(true)
  })

  it('parses an ANPR event (weight fields null)', () => {
    const result = apiResponseLPRTimelineSchema.safeParse({
      res_data: [
        {
          id: 695811,
          source: 'anpr',
          captured_at: '2026-07-15T15:08:42+07:00',
          captured_at_display: '15 ก.ค. 2569 15:08:42',
          detection_point: null,
          camera_name: null,
          detection_location: null,
          vehicle_image: 'https://its.drr.go.th/its-media/images/vehicle.jpg',
          plate_image: null,
          speed: 0,
          lane: null,
          grossweight: null,
          legalweight: null,
          is_overweight: null,
        },
      ],
      has_more: false,
    })
    expect(result.success).toBe(true)
  })
})
