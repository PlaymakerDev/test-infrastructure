import { describe, expect, it } from 'vitest'
import {
  cameraBadges,
  hasDevices,
  offlinePercent,
  outOfWarrantyPercent,
  readUptimeCounts,
  staLabel,
  WARRANTY_FILTER_OPTIONS,
  warrantyParam,
  withoutOutOfWarranty,
} from './deviceStatus'

describe('uptime-statistics → ring counts', () => {
  it('reads each service’s own block', () => {
    expect(readUptimeCounts('camera', { camera: { total: 58, online: 0, offline: 58 }, percentage: 0 })?.totals)
      .toEqual({ total: 58, online: 0, offline: 58 })
    expect(readUptimeCounts('vms', { vms: { total: 4, online: 1, offline: 3 } })?.totals).toEqual({ total: 4, online: 1, offline: 3 })
  })

  it('unwraps Street Light, which answers an array', () => {
    expect(readUptimeCounts('lighting', [{ lighting: { total: 258, online: 129, offline: 129 } }])?.totals)
      .toEqual({ total: 258, online: 129, offline: 129 })
  })

  it('gives null for a missing or broken block', () => {
    expect(readUptimeCounts('camera', null)).toBeNull()
    expect(readUptimeCounts('camera', { camera: null })).toBeNull()
    expect(readUptimeCounts('camera', { vms: { total: 1, online: 1, offline: 0 } })).toBeNull()
    expect(readUptimeCounts('camera', { camera: { total: 'x', online: 0, offline: 0 } })).toBeNull()
    expect(readUptimeCounts('lighting', [])).toBeNull()
  })
})

describe('นอกเหนือการประกัน — out of ออฟไลน์ and ทั้งหมด alike (option ก.)', () => {
  // แมสซีฟ's CCTV ring on 2026-11-16, with 12 cameras recorded out of warranty.
  const ring = { total: 1124, online: 662, offline: 462 }

  it('reads out_of_warranty from the system’s own block; absent = 0', () => {
    expect(readUptimeCounts('camera', { camera: { ...ring, out_of_warranty: 12 } })?.outOfWarranty).toBe(12)
    expect(readUptimeCounts('lighting', [{ lighting: { ...ring, out_of_warranty: 3 } }])?.outOfWarranty).toBe(3)
    expect(readUptimeCounts('camera', { camera: ring })?.outOfWarranty).toBe(0)
    // Only the block counts — not a stray field at the root.
    expect(readUptimeCounts('camera', { camera: ring, out_of_warranty: 12 })?.outOfWarranty).toBe(0)
  })

  it('the ring still adds up: 662 + 450 = 1,112; raw keeps what was read', () => {
    const counts = readUptimeCounts('camera', { camera: { ...ring, out_of_warranty: 12 }, percentage: 59 })!
    expect(counts.totals).toEqual({ total: 1112, online: 662, offline: 450 })
    expect(counts.totals.online + counts.totals.offline).toBe(counts.totals.total)
    expect(offlinePercent(counts.totals)).toBe(40)
    expect(counts.raw).toEqual(ring)
  })

  it('without the field the ring is what it was', () => {
    expect(readUptimeCounts('camera', { camera: ring })?.totals).toEqual(ring)
  })

  it('never takes away more than is offline', () => {
    expect(withoutOutOfWarranty({ total: 10, online: 5, offline: 5 }, 8)).toEqual({ total: 5, online: 5, offline: 0 })
    expect(withoutOutOfWarranty({ total: 10, online: 5, offline: 5 }, -2)).toEqual({ total: 10, online: 5, offline: 5 })
    expect(readUptimeCounts('vms', { vms: { total: 10, online: 5, offline: 5, out_of_warranty: 8 } })?.outOfWarranty).toBe(5)
  })

  it('the นอกเหนือการประกัน tab’s ring: the share of the offline ones', () => {
    expect(outOfWarrantyPercent({ raw: ring, outOfWarranty: 12 })).toBe(3)
    expect(outOfWarrantyPercent({ raw: { total: 4, online: 1, offline: 3 }, outOfWarranty: 3 })).toBe(100)
    expect(outOfWarrantyPercent({ raw: { total: 4, online: 4, offline: 0 }, outOfWarranty: 0 })).toBe(0)
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
  it('ทั้งหมด / นอกเหนือการประกัน / ในค้ำ / หมดค้ำ, in the Figma’s order', () => {
    expect(WARRANTY_FILTER_OPTIONS.map((option) => option.label)).toEqual(['ทั้งหมด', 'นอกเหนือการประกัน', 'ในค้ำ', 'หมดค้ำ'])
  })

  it('maps to the list’s is_warranty — นอกเหนือการประกัน reads every project', () => {
    expect(warrantyParam('all')).toBeUndefined()
    expect(warrantyParam('excluded')).toBeUndefined()
    expect(warrantyParam('in')).toBe(true)
    expect(warrantyParam('out')).toBe(false)
  })
})
