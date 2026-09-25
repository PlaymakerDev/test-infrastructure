import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Road, RoadSolutionListRaw, SolutionLocation } from '@/types/manage/project-detail-api'

vi.mock('../ApiService', () => ({ default: { fetchData: vi.fn() } }))

import ApiService from '../ApiService'
import { getRoadSolutionAPI, normalizeRoadSolutions } from './ProjectDetailService'

const road: Road = {
  id: 5,
  road_name: 'ถนนกัลปพฤกษ์',
  road_code: 'กท.1001',
  subdistrict: '',
  district: '',
  province: 'กรุงเทพมหานคร',
  department_id: 1,
  start_sta: '',
  end_sta: '',
  distance: 0,
  created_at: '',
  created_by: '',
}

const point: SolutionLocation = {
  solution_location_id: 3666,
  project_id: 5745,
  location_name: 'จุดติดตั้งที่ 1',
  created_at: '2026-09-25 20:15:30',
  created_by: 'drr',
}

// Shapes seen live on 2026-09-25: project 1275's only road after its last
// จุดติดตั้ง was deleted carries no `solution_locations` key at all; project
// 1274's road still has its point.
const roadWithoutKey: RoadSolutionListRaw = { project_road_id: 5746, project_id: 1275, road_id: 5, road }
const roadWithPoint: RoadSolutionListRaw = { project_road_id: 5745, project_id: 1274, road_id: 5, road, solution_locations: [point] }

describe('normalizeRoadSolutions', () => {
  it('gives a road sent without solution_locations an empty array', () => {
    const [normalized] = normalizeRoadSolutions([roadWithoutKey])
    expect(normalized.solution_locations).toEqual([])
  })

  it('treats null (or any non-array) solution_locations as empty', () => {
    const rows = normalizeRoadSolutions([
      { ...roadWithoutKey, solution_locations: null },
      { ...roadWithoutKey, solution_locations: {} as unknown as SolutionLocation[] },
    ])
    expect(rows.map((r) => r.solution_locations)).toEqual([[], []])
  })

  it('keeps an existing list as-is, by reference', () => {
    const [normalized] = normalizeRoadSolutions([roadWithPoint])
    expect(normalized.solution_locations).toBe(roadWithPoint.solution_locations)
  })

  it('leaves every other field of the road untouched', () => {
    const [normalized] = normalizeRoadSolutions([roadWithoutKey])
    expect(normalized).toEqual({ ...roadWithoutKey, solution_locations: [] })
    expect(normalized.road).toBe(road)
  })

  it('handles a mix of roads with and without points, in order', () => {
    const rows = normalizeRoadSolutions([roadWithPoint, roadWithoutKey])
    expect(rows.map((r) => [r.project_road_id, r.solution_locations.length])).toEqual([[5745, 1], [5746, 0]])
  })

  it('does not mutate the rows it was given', () => {
    const input = { ...roadWithoutKey }
    normalizeRoadSolutions([input])
    expect('solution_locations' in input).toBe(false)
  })

  it('turns a body that is not an array into no roads', () => {
    expect(normalizeRoadSolutions(null)).toEqual([])
    expect(normalizeRoadSolutions(undefined)).toEqual([])
    expect(normalizeRoadSolutions({ res_code: 40000 })).toEqual([])
  })
})

describe('getRoadSolutionAPI', () => {
  const fetchData = vi.mocked(ApiService.fetchData)

  beforeEach(() => {
    fetchData.mockReset()
  })

  it('returns the AxiosResponse with only data normalized', async () => {
    const response = { data: [roadWithoutKey], status: 200, statusText: 'OK', headers: {}, config: {} }
    fetchData.mockResolvedValue(response as never)

    const res = await getRoadSolutionAPI({ project_id: '1275' })

    expect(fetchData).toHaveBeenCalledWith({
      url: '/manage/solution/road_solution',
      method: 'GET',
      params: { project_id: '1275' },
    })
    expect(res.status).toBe(200)
    expect(res.headers).toBe(response.headers)
    expect(res.data).toEqual([{ ...roadWithoutKey, solution_locations: [] }])
  })

  it('passes a request failure through unchanged', async () => {
    const error = new Error('Network Error')
    fetchData.mockRejectedValue(error)
    await expect(getRoadSolutionAPI({ project_id: '1275' })).rejects.toBe(error)
  })
})
