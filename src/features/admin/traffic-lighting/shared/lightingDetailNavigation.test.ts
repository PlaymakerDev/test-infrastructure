import { describe, expect, it } from 'vitest'
import {
  buildLightingDetailUrl,
  resolveLightingImei,
} from './lightingDetailNavigation'

describe('traffic-lighting detail navigation', () => {
  it('uses an explicit IMEI and only infers IMEI-shaped route ids', () => {
    expect(resolveLightingImei('solution-12', ' 860946061754746 ')).toBe('860946061754746')
    expect(resolveLightingImei('860946061754746')).toBe('860946061754746')
    expect(resolveLightingImei('1910')).toBe('')
  })

  it('builds a portable lamp URL with department and device context', () => {
    const path = buildLightingDetailUrl({
      routeId: 'device/1',
      imei: '860946061754746',
      type: 'lamp',
      deptId: 0,
    })
    const url = new URL(path, 'https://example.test')

    expect(url.pathname).toBe('/admin/traffic-lighting/detail/lamp/device%2F1')
    expect(url.searchParams.get('dept_id')).toBe('0')
    expect(url.searchParams.get('imei')).toBe('860946061754746')
    expect(url.searchParams.get('type')).toBe('lamp')
  })

  it('drops the imei param when the route id already carries it', () => {
    const path = buildLightingDetailUrl({
      routeId: '860946061754746',
      imei: '860946061754746',
      type: 'phase',
      deptId: 0,
    })
    const url = new URL(path, 'https://example.test')

    expect(url.pathname).toBe('/admin/traffic-lighting/detail/860946061754746')
    expect(url.searchParams.has('imei')).toBe(false)
    // Still resolvable from the path alone — the reason dropping it is safe.
    expect(resolveLightingImei('860946061754746')).toBe('860946061754746')
  })

  it('omits an empty imei rather than emitting a blank param', () => {
    const url = new URL(
      buildLightingDetailUrl({ routeId: '1910-1', imei: '', type: 'phase', deptId: 3 }),
      'https://example.test',
    )

    expect(url.searchParams.has('imei')).toBe(false)
    expect(url.searchParams.get('dept_id')).toBe('3')
    expect(resolveLightingImei('1910-1')).toBe('')
  })
})
