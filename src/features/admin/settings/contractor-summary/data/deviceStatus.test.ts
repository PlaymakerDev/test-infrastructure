import { describe, expect, it } from 'vitest'
import {
  cameraBadges,
  hasDevices,
  offlinePercent,
  readUptimeTotals,
  staLabel,
  warrantyParam,
} from './deviceStatus'

describe('uptime-statistics → ring totals', () => {
  it('reads each service’s own block', () => {
    expect(readUptimeTotals('camera', { camera: { total: 58, online: 0, offline: 58 }, percentage: 0 }))
      .toEqual({ total: 58, online: 0, offline: 58 })
    expect(readUptimeTotals('vms', { vms: { total: 4, online: 1, offline: 3 } })).toEqual({ total: 4, online: 1, offline: 3 })
  })

  it('unwraps Street Light, which answers an array', () => {
    expect(readUptimeTotals('lighting', [{ lighting: { total: 258, online: 129, offline: 129 } }]))
      .toEqual({ total: 258, online: 129, offline: 129 })
  })

  it('gives null for a missing or broken block', () => {
    expect(readUptimeTotals('camera', null)).toBeNull()
    expect(readUptimeTotals('camera', { camera: null })).toBeNull()
    expect(readUptimeTotals('camera', { vms: { total: 1, online: 1, offline: 0 } })).toBeNull()
    expect(readUptimeTotals('camera', { camera: { total: 'x', online: 0, offline: 0 } })).toBeNull()
    expect(readUptimeTotals('lighting', [])).toBeNull()
  })
})

describe('which rings show', () => {
  it('hides a system the contractor has none of — null or all zeros', () => {
    expect(hasDevices(null)).toBe(false)
    expect(hasDevices({ total: 0, online: 0, offline: 0 })).toBe(false)
    expect(hasDevices({ total: 27, online: 27, offline: 0 })).toBe(true)
  })

  it('shows the offline share in whole percent', () => {
    expect(offlinePercent({ total: 2372, online: 1362, offline: 1010 })).toBe(43)
    expect(offlinePercent({ total: 27, online: 27, offline: 0 })).toBe(0)
    expect(offlinePercent({ total: 10, online: 5, offline: 5 })).toBe(50)
    expect(offlinePercent({ total: 0, online: 0, offline: 0 })).toBe(0)
  })
})

describe('camera group heading', () => {
  it('writes กม. once, even when the chainage already has it', () => {
    expect(staLabel('2+800')).toBe('กม. 2+800')
    expect(staLabel('กม.2+800')).toBe('กม. 2+800')
    expect(staLabel(' กม. 2+800 ')).toBe('กม. 2+800')
  })

  it('leaves กม. out when there is no chainage', () => {
    expect(staLabel('')).toBe('')
    expect(staLabel(null)).toBe('')
    expect(staLabel('  ')).toBe('')
    expect(staLabel('กม.')).toBe('')
  })
})

describe('camera tags', () => {
  it('maps solution types to the app badges, CCTV first', () => {
    expect(cameraBadges([{ id: 3 }, { id: 1 }])).toEqual(['cctv', 'analytic'])
    expect(cameraBadges([{ id: 7 }, { id: 2 }, { id: 4 }])).toEqual(['cctv', 'counting', 'traffic', 'vms'])
    expect(cameraBadges([])).toEqual(['cctv'])
    expect(cameraBadges([{ id: 99 }])).toEqual(['cctv'])
    expect(cameraBadges([{ id: 11 }, { id: 2 }])).toEqual(['cctv', 'counting', 'lpr'])
  })
})

describe('warranty filter', () => {
  it('maps to the list’s is_warranty', () => {
    expect(warrantyParam('all')).toBeUndefined()
    expect(warrantyParam('in')).toBe(true)
    expect(warrantyParam('out')).toBe(false)
  })
})
