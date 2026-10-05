import { describe, expect, it } from 'vitest'
import type { RoadSolutionList } from '@/types/manage/project-detail-api'
import {
  buildAddRoadBody,
  missingFieldsFromError,
  missingProjectFields,
  roadAfterDelete,
  roadLabel,
  type ProjectDetailWithRoads,
} from './projectRoads'

// Shaped like GET /manage/project/1316 (2026-09-29).
const DETAIL: ProjectDetailWithRoads = {
  id: 1316,
  project_name: 'ทดสอบระบบ222',
  contract_no: '111',
  project_no: 'test-0001',
  contractor_id: '2e6dc8ac-7202-4e3c-95a5-56881558e564',
  department_id: 2,
  warranty_start_date: '2026-09-28T00:00:00Z',
  warranty_end_date: '2026-10-31T00:00:00Z',
  created_at: '2026-09-28T16:05:24.802652+07:00',
  updated_at: '2026-09-28T16:56:42.940099+07:00',
  created_by: null,
  updated_by: null,
  budget_year: 2569,
  is_warranty: true,
  contract_document: {
    document_url: 'https://its.drr.go.th/its-media/images/project/2026/09/28/a.pdf?exp=1&sig=abc',
    file_name: 'ตัวอย่าง.pdf',
  },
  project_roads: [
    { project_road_id: 6365, road_id: 10026 },
    { project_road_id: 6366, road_id: 12 },
  ],
}

const road = (project_road_id: number): RoadSolutionList => ({
  project_road_id,
  project_id: 1316,
  road_id: project_road_id,
  solution_locations: [],
  road: {
    id: project_road_id, road_name: '', road_code: '', subdistrict: '', district: '', province: '',
    department_id: 0, start_sta: '', end_sta: '', distance: 0, created_at: '', created_by: '',
  },
})

describe('adding one road to a project', () => {
  it('re-sends every existing road with its id and appends the new one without', () => {
    expect(buildAddRoadBody(DETAIL, 10000).project_road).toEqual([
      { road_id: 10026, project_road_id: 6365 },
      { road_id: 12, project_road_id: 6366 },
      { road_id: 10000 },
    ])
  })

  it('keeps the rest of the project exactly as read', () => {
    const body = buildAddRoadBody(DETAIL, 10000)
    expect(body).toMatchObject({
      id: 1316,
      project_name: 'ทดสอบระบบ222',
      contract_no: '111',
      project_no: 'test-0001',
      budget_year: 2569,
      department_id: 2,
      contractor_id: '2e6dc8ac-7202-4e3c-95a5-56881558e564',
      warranty_start_date: '2026-09-28',
      warranty_end_date: '2026-10-31',
      contract_document: DETAIL.contract_document,
    })
  })

  it('reads a date-only field as written, not shifted into local time', () => {
    const body = buildAddRoadBody({ ...DETAIL, warranty_start_date: '2026-01-01T00:00:00Z' }, 1)
    expect(body.warranty_start_date).toBe('2026-01-01')
  })

  it('falls back to the singular road key and to no roads at all', () => {
    const rest: ProjectDetailWithRoads = { ...DETAIL, project_roads: undefined }
    expect(buildAddRoadBody({ ...rest, project_road: [{ project_road_id: 9, road_id: 3 }] }, 4).project_road)
      .toEqual([{ road_id: 3, project_road_id: 9 }, { road_id: 4 }])
    expect(buildAddRoadBody(rest, 4).project_road).toEqual([{ road_id: 4 }])
  })
})

describe('fields the backend requires before it takes the update', () => {
  it('passes a complete project', () => {
    expect(missingProjectFields(DETAIL)).toEqual([])
  })

  it('names a missing document — the common real case', () => {
    expect(missingProjectFields({ ...DETAIL, contract_document: null })).toEqual(['เอกสารเชื่อมต่อระบบ'])
    expect(missingProjectFields({ ...DETAIL, project_no: '  ', contract_document: { document_url: '', file_name: '' } }))
      .toEqual(['เอกสารเชื่อมต่อระบบ'])
  })

  it('never blocks on รหัสโครงการ — optional, sent as the "-" stand-in', () => {
    expect(missingProjectFields({ ...DETAIL, project_no: null as unknown as string })).toEqual([])
    expect(missingProjectFields({ ...DETAIL, project_no: '' })).toEqual([])
    expect(buildAddRoadBody({ ...DETAIL, project_no: '' }, 1).project_no).toBe('-')
    expect(buildAddRoadBody({ ...DETAIL, project_no: null as unknown as string }, 1).project_no).toBe('-')
  })

  it('reads the keys of a 400 "required" answer', () => {
    const error = { response: { data: { res_code: 40010, res_data: { keys: ['project_no', 'contract_document', 'x'], details: 'required' } } } }
    expect(missingFieldsFromError(error)).toEqual(['รหัสโครงการ', 'เอกสารเชื่อมต่อระบบ', 'x'])
    expect(missingFieldsFromError(new Error('network'))).toEqual([])
  })
})

describe('after a road is deleted', () => {
  const before = [road(1), road(2), road(3)]

  it('lands on the road before it', () => {
    expect(roadAfterDelete(before, 3, [road(1), road(2)])?.project_road_id).toBe(2)
  })

  it('lands on the new first road when the first one went', () => {
    expect(roadAfterDelete(before, 1, [road(2), road(3)])?.project_road_id).toBe(2)
  })

  it('has nowhere to land when it was the last road', () => {
    expect(roadAfterDelete([road(1)], 1, [])).toBeUndefined()
  })
})

describe('road label', () => {
  it('shows code and name like the project form does', () => {
    expect(roadLabel({ road_code: 'ปท.3010', road_name: 'บ้านบึง' })).toBe('ปท.3010 - บ้านบึง')
    expect(roadLabel({ road_code: 'ปท.3010', road_name: '' })).toBe('ปท.3010')
    expect(roadLabel(null)).toBe('-')
  })
})
