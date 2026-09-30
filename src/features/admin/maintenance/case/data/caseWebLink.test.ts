import { describe, expect, it } from 'vitest'
import { resolveCaseWebLink, solutionTypeFromPrefix, type CaseWebLinkInput } from './caseWebLink'

// C-20260928-0007: CCTV solution 5479 on road 10026 (กรมทางหลวงชนบท, dept 0)
// of project 1316, whose own bureau is dept 2 (checked 2026-09-29).
const BASE: CaseWebLinkInput = {
  solutionId: 5479,
  solution: { solution_type_id: 1, solution_location_id: 3728 },
  roads: [
    { project_id: 1316, road_id: 8, road: { department_id: 2 }, solution_locations: [] },
    { project_id: 1316, road_id: 10026, road: { department_id: 0 }, solution_locations: [{ solution_location_id: 3728 }] },
  ],
  projectId: 1316,
  isWarranty: true,
  pending: false,
}

describe('case page → ไปยังหน้าเว็บ', () => {
  it("opens the solution's own menu page under its road's bureau", () => {
    expect(resolveCaseWebLink(BASE)).toEqual({ kind: 'ready', href: '/admin/cctv/detail/5479?dept_id=0' })
  })

  it('road-scoped menus also get project and road', () => {
    const link = resolveCaseWebLink({ ...BASE, solution: { solution_type_id: 2, solution_location_id: 3728 } })
    expect(link).toEqual({ kind: 'ready', href: '/admin/traffic-volume/detail/5479?dept_id=0&project_id=1316&road_id=10026' })
  })

  it('waits while a lookup is on its way', () => {
    expect(resolveCaseWebLink({ ...BASE, pending: true })).toEqual({ kind: 'loading' })
  })

  it('falls back to the detail-page context when the road list is not readable', () => {
    const link = resolveCaseWebLink({ ...BASE, roads: undefined, context: { typeId: 1, deptId: '0', roadId: '10026' } })
    expect(link).toEqual({ kind: 'ready', href: '/admin/cctv/detail/5479?dept_id=0' })
    const byPrefix = resolveCaseWebLink({ ...BASE, solution: null, roads: null, context: { typeId: solutionTypeFromPrefix('CCTV'), deptId: '50' } })
    expect(byPrefix).toEqual({ kind: 'ready', href: '/admin/cctv/detail/5479?dept_id=50' })
  })

  it('refuses to guess a bureau it could not find', () => {
    expect(resolveCaseWebLink({ ...BASE, roads: [] }).kind).toBe('blocked')
    expect(resolveCaseWebLink({ ...BASE, solutionId: undefined }).kind).toBe('blocked')
    expect(resolveCaseWebLink({ ...BASE, solution: null }).kind).toBe('blocked')
  })

  it('passes on the builder’s refusals (e.g. WIM is addressed by station)', () => {
    const link = resolveCaseWebLink({ ...BASE, solution: { solution_type_id: 9, solution_location_id: 3728 } })
    expect(link.kind).toBe('blocked')
  })
})
