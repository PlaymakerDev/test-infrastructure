import { describe, expect, it } from 'vitest'
import {
  DETAIL_SOLUTION_TYPE,
  buildLightingSolutionHref,
  buildSolutionDetailUrl,
  type SolutionDetailContext,
} from './solutionDetailUrl'

const CTX: SolutionDetailContext = { deptId: 12, projectId: 340, roadId: 56, isWarranty: true }

const url = (href: string) => new URL(href, 'https://example.test')

const readyHref = (typeId: number, ctx = CTX) => {
  const target = buildSolutionDetailUrl(typeId, 900, ctx)
  if (target.kind !== 'ready') throw new Error(`expected a ready target, got ${target.kind}`)
  return url(target.href)
}

describe('settings → solution detail navigation', () => {
  it('sends the four road-scoped menus to their own route with dept/project/road', () => {
    const cases: Array<[number, string]> = [
      [DETAIL_SOLUTION_TYPE.COUNTING, '/admin/traffic-volume/detail/900'],
      [DETAIL_SOLUTION_TYPE.ANALYTIC, '/admin/incident-detection/detail/900'],
      [DETAIL_SOLUTION_TYPE.TRAFFIC, '/admin/traffic-signal/detail/900'],
      [DETAIL_SOLUTION_TYPE.CROSSWALK, '/admin/crosswalk/detail/900'],
    ]

    for (const [typeId, pathname] of cases) {
      const parsed = readyHref(typeId)
      expect(parsed.pathname).toBe(pathname)
      expect(parsed.searchParams.get('dept_id')).toBe('12')
      expect(parsed.searchParams.get('project_id')).toBe('340')
      expect(parsed.searchParams.get('road_id')).toBe('56')
    }
  })

  it('gives CCTV only dept_id — the one param its detail page reads', () => {
    const parsed = readyHref(DETAIL_SOLUTION_TYPE.CCTV)
    expect(parsed.pathname).toBe('/admin/cctv/detail/900')
    expect(parsed.searchParams.get('dept_id')).toBe('12')
    expect(parsed.searchParams.has('project_id')).toBe(false)
    expect(parsed.searchParams.has('road_id')).toBe(false)
  })

  it('gives VMS its warranty flag and no dept_id, even without a department', () => {
    const parsed = readyHref(DETAIL_SOLUTION_TYPE.VMS, { ...CTX, deptId: null })
    expect(parsed.pathname).toBe('/admin/vms/detail/900')
    expect(parsed.searchParams.get('is_warranty')).toBe('true')
    expect(parsed.searchParams.has('dept_id')).toBe(false)
    // No live status on this page — the detail page reads a missing flag as
    // false, so emitting `is_online=false` would only look authoritative.
    expect(parsed.searchParams.has('is_online')).toBe(false)
  })

  it('gives Bridge Lighting dept + project + warranty, and no road_id', () => {
    const parsed = readyHref(DETAIL_SOLUTION_TYPE.BRIDGE_LIGHTING)
    expect(parsed.pathname).toBe('/admin/bridge-lighting/detail/900')
    expect(parsed.searchParams.get('dept_id')).toBe('12')
    expect(parsed.searchParams.get('project_id')).toBe('340')
    expect(parsed.searchParams.get('is_warranty')).toBe('true')
    expect(parsed.searchParams.has('road_id')).toBe(false)
  })

  it('blocks the two types this page cannot address correctly', () => {
    expect(buildSolutionDetailUrl(DETAIL_SOLUTION_TYPE.TUNNEL, 900, CTX).kind).toBe('blocked')
    expect(buildSolutionDetailUrl(DETAIL_SOLUTION_TYPE.WIM, 900, CTX).kind).toBe('blocked')
  })

  it('blocks rather than linking when the department is unknown', () => {
    // useDeptId() falls back to dept 50 when ?dept_id= is missing, so a link
    // built without one would silently show another bureau's data.
    for (const deptId of [null, undefined, '', 0, '0']) {
      const target = buildSolutionDetailUrl(DETAIL_SOLUTION_TYPE.CROSSWALK, 900, { ...CTX, deptId })
      expect(target.kind).toBe('blocked')
    }
  })

  it('drops not-loaded-yet project and road ids instead of sending 0', () => {
    const parsed = readyHref(DETAIL_SOLUTION_TYPE.COUNTING, { ...CTX, projectId: 0, roadId: 0 })
    expect(parsed.searchParams.get('dept_id')).toBe('12')
    expect(parsed.searchParams.has('project_id')).toBe(false)
    expect(parsed.searchParams.has('road_id')).toBe(false)
  })

  it('blocks an unmapped solution type instead of guessing a route', () => {
    expect(buildSolutionDetailUrl(99, 900, CTX).kind).toBe('blocked')
  })

  it('defers Traffic Lighting until its central-list row is known', () => {
    expect(buildSolutionDetailUrl(DETAIL_SOLUTION_TYPE.LIGHTING, 900, CTX).kind)
      .toBe('needs-lighting-row')
  })

  it('addresses a lighting device by IMEI, and a โคมไฟ by the lamp route', () => {
    const cabinet = url(buildLightingSolutionHref(
      { id: '860946061754746', imei: '860946061754746', equipmentType: 'phase' },
      12,
    ))
    expect(cabinet.pathname).toBe('/admin/traffic-lighting/detail/860946061754746')
    expect(cabinet.searchParams.get('dept_id')).toBe('12')
    expect(cabinet.searchParams.get('type')).toBe('phase')

    const lamp = url(buildLightingSolutionHref(
      { id: '900-0', imei: undefined, equipmentType: 'lamp' },
      12,
    ))
    expect(lamp.pathname).toBe('/admin/traffic-lighting/detail/lamp/900-0')
    expect(lamp.searchParams.has('imei')).toBe(false)
  })
})
