import { describe, expect, it } from 'vitest'
import type { DeviceTotals, ProjectDeviceSolutionsRow, ProjectDeviceSummaryRow, SolutionCamera } from '@/types/manage/device-status-api'
import { allContractorsReport, isPlaceholder, solutionRings } from './allContractors'

const header = (id: number, warrantyEnd: string | null) => ({
  project_id: id,
  project_name: `โครงการ ${id}`,
  contract_no: warrantyEnd ? `สัญญา ${id}` : null,
  budget_year: 2567,
  department: { id: 1, department_short_name: 'ขทช.สิงห์บุรี' },
  contractor: { id: 'u', company_name: 'บริษัท ก จำกัด', short_name: 'k' },
  warranty_start_date: warrantyEnd ? '2023-01-01' : null,
  warranty_end_date: warrantyEnd,
  is_warranty: false,
  access_scope: 'project' as const,
  roads: [],
})

const none: DeviceTotals = { total: 0, online: 0, offline: 0 }
const IN_HOUSE = { id: '0199b853', company_name: 'กรมทางหลวงชนบท (ในกำกับ)', short_name: 'drr' }
const summaryRow = (id: number, warrantyEnd: string | null, contractor = header(id, warrantyEnd).contractor): ProjectDeviceSummaryRow => ({
  ...header(id, warrantyEnd),
  contractor,
  cctv: none,
  counting: none,
  analytic: none,
  lpr: none,
  traffic: { system: none, camera: none },
  crosswalk: { system: none, camera: none },
  lighting: none,
  vms: { system: none, camera: none },
  bridge_lighting: none,
  tunnel: none,
})

const solutionsRow = (id: number, overrides: Partial<ProjectDeviceSolutionsRow> = {}): ProjectDeviceSolutionsRow => ({
  ...header(id, '2025-01-01'),
  cctv: [],
  counting: [],
  analytic: [],
  lpr: [],
  traffic: [],
  crosswalk: [],
  vms: [],
  lighting: [],
  bridge_lighting: [],
  tunnel: [],
  ...overrides,
})

const camera = (id: string, isOnline: boolean): SolutionCamera => ({ id, camera_name: id, sta: '', ip_address: '', is_online: isOnline, solution_group: ['CCTV'] })
const point = (solutionId: number, cameras: SolutionCamera[]) => ({ solution_id: solutionId, solution_name: `จุด ${solutionId}`, cameras })
const controller = (id: number, isOnline: boolean, cameras: SolutionCamera[] = []) => ({ id, solution_id: id, solution_name: `ตู้ ${id}`, is_online: isOnline, cameras })
const ring = (solutions: ProjectDeviceSolutionsRow[]) => Object.fromEntries(solutionRings(solutions).map(({ system, totals }) => [system.key, totals]))

describe('รวมผู้รับจ้าง — the projects', () => {
  it('a placeholder is a project with no warranty end date — whoever’s it is (user 2026-10-29)', () => {
    expect(isPlaceholder({ warranty_end_date: null })).toBe(true)
    expect(isPlaceholder({ warranty_end_date: '' })).toBe(true)
    expect(isPlaceholder({ warranty_end_date: '2025-06-30' })).toBe(false)
  })

  it('leaves the placeholders out of the tables and of the rings — the department’s and a contractor’s — keeping the order', () => {
    const report = allContractorsReport(
      [summaryRow(3, '2025-01-01'), summaryRow(277, null, IN_HOUSE), summaryRow(92, null), summaryRow(1, '2024-05-01')],
      [
        solutionsRow(1, { cctv: [point(10, [camera('a', true)])] }),
        // The placeholders' cameras — all of them down.
        solutionsRow(277, { cctv: [point(20, [camera('x', false), camera('y', false)])], traffic: [controller(9, false)] }),
        solutionsRow(92, { cctv: [point(40, [camera('z', false)])] }),
        solutionsRow(3, { cctv: [point(30, [camera('b', false)])] }),
      ],
    )
    expect(report.summary.map((row) => row.project_id)).toEqual([3, 1])
    expect(report.solutions.map((row) => row.project_id)).toEqual([1, 3])
    expect(report.rings.map(({ system, totals }) => [system.key, totals])).toEqual([['cctv', { total: 2, online: 1, offline: 1 }]])
  })
})

describe('รวมผู้รับจ้าง — the rings, in their uptime-statistics units', () => {
  it('CCTV: each camera once, a camera two projects share too', () => {
    const shared = camera('s', true)
    expect(ring([
      solutionsRow(1, { cctv: [point(1, [camera('a', false), shared])] }),
      solutionsRow(2, { cctv: [point(2, [{ ...shared, is_online: false }, camera('b', false)])] }),
    ]).cctv).toEqual({ total: 3, online: 1, offline: 2 })
  })

  it('Traffic Volume, Incident Detection, LPR: each install point, up while any of its cameras is', () => {
    const rings = ring([
      solutionsRow(1, {
        counting: [point(1, [camera('a', false), camera('b', true)]), point(2, [camera('c', false)])],
        analytic: [point(3, [camera('d', true)]), point(4, [])],
        lpr: [point(5, [camera('e', false)])],
      }),
    ])
    expect([rings.counting, rings.analytic, rings.lpr]).toEqual([
      { total: 2, online: 1, offline: 1 },
      { total: 2, online: 1, offline: 1 },
      { total: 1, online: 0, offline: 1 },
    ])
  })

  it('Traffic Signal, Crosswalk, VMS, Street Light, Bridge Lighting: each by its own state, not its cameras', () => {
    const rings = ring([
      solutionsRow(1, {
        traffic: [controller(1, false, [camera('a', true)]), controller(2, true)],
        crosswalk: [controller(3, false)],
        vms: [controller(4, true), controller(5, true)],
        lighting: [{ id: 6, solution_id: 6, solution_name: 'ตู้ 6', sta: '', is_online: true, has_broken_wire: true, lamps: [] }],
        bridge_lighting: [{ id: 7, solution_id: 7, solution_name: 'สะพาน', is_online: false }],
      }),
    ])
    expect(rings).toEqual({
      vms: { total: 2, online: 2, offline: 0 },
      lighting: { total: 1, online: 1, offline: 0 },
      traffic: { total: 2, online: 1, offline: 1 },
      bridge_lighting: { total: 1, online: 0, offline: 1 },
      crosswalk: { total: 1, online: 0, offline: 1 },
    })
  })

  it('Tunnel: each tunnel, up while any sensor is; one without sensors is down', () => {
    expect(ring([
      solutionsRow(1, {
        tunnel: [
          { solution_id: 1, solution_name: 'A', devices: [{ id: 's1', device_name: 'Lux', is_online: false, last_update: null }, { id: 's2', device_name: 'CO', is_online: true, last_update: null }] },
          { solution_id: 2, solution_name: 'B', devices: [] },
        ],
      }),
    ]).tunnel).toEqual({ total: 2, online: 1, offline: 1 })
  })

  it('in the page’s order, a system with nothing left gets no ring', () => {
    const rings = solutionRings([solutionsRow(1, { tunnel: [{ solution_id: 1, solution_name: 'A', devices: [] }], cctv: [point(1, [camera('a', true)])], vms: [controller(4, false)] })])
    expect(rings.map(({ system }) => system.label)).toEqual(['CCTV', 'VMS', 'Tunnel'])
    expect(solutionRings([])).toEqual([])
  })
})
