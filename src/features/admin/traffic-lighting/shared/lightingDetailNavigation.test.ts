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
})
