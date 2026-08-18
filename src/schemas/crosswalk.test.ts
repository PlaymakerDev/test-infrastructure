import { describe, expect, it } from 'vitest'
import {
  apiResponseCrosswalkCamerasSchema,
  apiResponseCrosswalkCentralListSchema,
  apiResponseCrosswalkGraphSchema,
  apiResponseCrosswalkOverviewSchema,
  apiResponseCrosswalkRandomCamerasSchema,
  apiResponseCrosswalkSolutionDetailSchema,
  apiResponseCrosswalkSummaryDailySchema,
  apiResponseCrosswalkTotalsSchema,
  apiResponseCrosswalkViolationListSchema,
} from './crosswalk'

describe('apiResponseCrosswalkOverviewSchema', () => {
  it('parses locations + optional centroid', () => {
    const result = apiResponseCrosswalkOverviewSchema.safeParse({
      locations: [
        {
          solution: { id: 1, solution_name: 'CW-1' },
          road: { id: 10, code_name: 'RC-01' },
          camera: { total: 4, online_count: 3, offline_count: 1 },
          crosswalk: { total: 1, is_online: true },
          GeometryPoint: [100.5, 13.7],
        },
      ],
      centroid: [100.5, 13.7],
    })
    expect(result.success).toBe(true)
  })

  it('parses when centroid is missing', () => {
    const result = apiResponseCrosswalkOverviewSchema.safeParse({ locations: [] })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCrosswalkTotalsSchema', () => {
  it('parses totals + warranty counters', () => {
    const result = apiResponseCrosswalkTotalsSchema.safeParse({
      solution: { total: 10, online: 8, offline: 2 },
      warranty: { active: 5, expired: 5 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative counts silently — schema only asserts number type', () => {
    const result = apiResponseCrosswalkTotalsSchema.safeParse({
      solution: { total: 'ten', online: 8, offline: 2 },
      warranty: { active: 5, expired: 5 },
    })
    expect(result.success).toBe(false)
  })
})

describe('apiResponseCrosswalkRandomCamerasSchema', () => {
  it('parses a valid random-camera payload', () => {
    const result = apiResponseCrosswalkRandomCamerasSchema.safeParse({
      count: 1,
      data: [
        {
          camera: {
            id: 'CAM-1',
            name: 'Camera 1',
            hls_url: 'https://example.com/stream.m3u8',
            is_online: true,
          },
          road: { id: 10, code_name: 'RC-01' },
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCrosswalkCentralListSchema', () => {
  it('parses a bureau → sub_department → solutions tree', () => {
    const result = apiResponseCrosswalkCentralListSchema.safeParse([
      {
        department_id: 1,
        department_short_name: 'สทช.1',
        sub_department: [
          {
            department_id: 10,
            department_short_name: 'สาขา A',
            solutions: [
              {
                road: { id: 100, code_name: 'RC-01' },
                project: {
                  id: 1,
                  project_name: 'โครงการทดสอบ',
                  budget_year: 2568,
                  contract_no: 'CON-001',
                },
                solution: { id: 1, solution_name: 'CW-1' },
                camera: { total: 4, online_count: 3, offline_count: 1 },
                crosswalk: { total: 1, is_online: true },
                is_warranty: true,
              },
            ],
          },
        ],
      },
    ])
    expect(result.success).toBe(true)
  })

  it('parses empty top-level array', () => {
    expect(apiResponseCrosswalkCentralListSchema.safeParse([]).success).toBe(true)
  })
})

describe('apiResponseCrosswalkCamerasSchema', () => {
  it('parses cameras with per-solution flags', () => {
    const result = apiResponseCrosswalkCamerasSchema.safeParse({
      cameras: [
        {
          id: 'CAM-1',
          camera_name: 'Camera 1',
          hls_url: 'https://example.com/stream.m3u8',
          geometry_point: [100.5, 13.7],
          ip_address: '10.0.0.1',
          is_online: true,
          counting: null,
          analytic: null,
          traffic: null,
          crosswalk: { solution_id: 1, solution_name: 'CW-1' },
          wim_camera: null,
          vms: null,
        },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCrosswalkSummaryDailySchema', () => {
  it('parses crossing + counting totals', () => {
    const result = apiResponseCrosswalkSummaryDailySchema.safeParse({
      crossing: {
        total: 100,
        button_pressed: 80,
        violation: 5,
        red_light_violation: 2,
      },
      counting: { total_count: 500, total_pcu: 620, avg_speed: 40.5 },
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCrosswalkGraphSchema', () => {
  it('parses hourly buckets for both series', () => {
    const result = apiResponseCrosswalkGraphSchema.safeParse({
      crossing_stats: [
        { hour_timestamp: '2026-07-06T00:00:00+07:00', total_pedestrians: 10, button_pressed: 8 },
      ],
      violation_stats: [
        { hour_timestamp: '2026-07-06T00:00:00+07:00', unbuttoned_crossing: 1, red_light_violation: 0 },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCrosswalkViolationListSchema', () => {
  it('parses a paged violation-list envelope', () => {
    const result = apiResponseCrosswalkViolationListSchema.safeParse({
      res_data: [
        {
          crosswalk: {
            type: 2,
            name_en: 'unbuttoned-crossing',
            name_th: 'คนข้ามฝ่าฝืน',
            timestamp: '22/06/2569 16:24',
          },
          // camera_ip: BE added 2026-08 (live rows carry e.g. "10.2.1.4")
          camera: { id: 'CAM-1', name: 'Camera 1', sta: '', camera_ip: '10.2.1.4' },
          image_path: 'https://example.com/event.jpg',
        },
      ],
      meta_data: { count: 1, page: 1, limit: 10, total_pages: 1 },
    })
    expect(result.success).toBe(true)
  })

  it('parses when meta_data is missing', () => {
    const result = apiResponseCrosswalkViolationListSchema.safeParse({ res_data: [] })
    expect(result.success).toBe(true)
  })
})

describe('apiResponseCrosswalkSolutionDetailSchema', () => {
  it('parses when anydesk is a number', () => {
    const result = apiResponseCrosswalkSolutionDetailSchema.safeParse({
      id: 1,
      solution_name: 'CW-1',
      anydesk: 123456789,
      geometry_point: [100.5, 13.7],
    })
    expect(result.success).toBe(true)
  })

  it('parses when anydesk is null and geometry_point is null', () => {
    const result = apiResponseCrosswalkSolutionDetailSchema.safeParse({
      id: 1,
      solution_name: 'CW-1',
      anydesk: null,
      geometry_point: null,
    })
    expect(result.success).toBe(true)
  })
})
