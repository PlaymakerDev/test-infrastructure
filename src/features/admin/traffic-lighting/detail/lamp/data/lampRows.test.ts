import { describe, expect, it } from 'vitest'
import type { LightingSolutionDevice } from '@/types/lighting'
import {
  formatLampStamp,
  lampRowsFromDevices,
  lampSummaryFromGateway,
  latestLampReport,
  parseLightingStamp,
} from './lampRows'

const lamp = (id: number, pole: number | null, deviceId: string, lastConnected: string): LightingSolutionDevice => ({
  id,
  device_id: deviceId,
  pole_number: pole,
  device_type: 'SEM',
  device_desc: 'CT Sensor',
  last_connectd: lastConnected,
  last_update: '',
})

describe('the lighting service’s stamps', () => {
  it('reads "dd/mm/yyyy HH:mm:ss" in the Buddhist year, local time', () => {
    const at = parseLightingStamp('15/09/2569 07:36:28')
    expect(at && [at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes(), at.getSeconds()]).toEqual([2026, 8, 15, 7, 36, 28])
    expect(parseLightingStamp('02/11/2569 13:15:48')?.getMonth()).toBe(10)
  })

  it('gives null for an empty or foreign stamp', () => {
    expect(parseLightingStamp('')).toBeNull()
    expect(parseLightingStamp(null)).toBeNull()
    expect(parseLightingStamp('2026-09-15T07:36:28+07:00')).toBeNull()
  })

  it('prints the table cell like the rest of the page', () => {
    expect(formatLampStamp(new Date(2026, 8, 15, 7, 36, 28))).toBe('15 ก.ย. 2569 07:36:28')
  })
})

describe('lampRowsFromDevices', () => {
  it('lists the lamps in pole order with their own ids and last reports', () => {
    const rows = lampRowsFromDevices([
      lamp(5172, 2, '24E124746F137268', '19/07/2569 06:18:48'),
      lamp(5171, 1, '24E124746F137667', '15/09/2569 07:36:28'),
    ])
    expect(rows.map((r) => [r.order, r.code, r.updatedAt])).toEqual([
      [1, '24E124746F137667', '15 ก.ย. 2569 07:36:28'],
      [2, '24E124746F137268', '19 ก.ค. 2569 06:18:48'],
    ])
  })

  it('claims no status or current the API does not send', () => {
    const [row] = lampRowsFromDevices([lamp(1, 1, 'a', '15/09/2569 07:36:28')])
    expect([row.isWorking, row.isConnected, row.current]).toEqual([null, null, null])
  })

  it('a lamp with no pole number goes last, numbered by its place; one that never reported shows "-"', () => {
    const rows = lampRowsFromDevices([lamp(9, null, '', ''), lamp(3, 1, 'b', '01/08/2569 06:02:47')])
    expect(rows.map((r) => [r.key, r.order, r.code, r.updatedAt])).toEqual([
      ['3', 1, 'b', '1 ส.ค. 2569 06:02:47'],
      ['9', 2, '-', '-'],
    ])
    expect(lampRowsFromDevices(null)).toEqual([])
  })
})

describe('the gateway’s tally and its age', () => {
  it('splits the lamps as the gateway counts them', () => {
    expect(lampSummaryFromGateway({ online_count: 171, offline_count: 206, is_online: false })).toEqual({ total: 377, working: 171, notWorking: 206 })
    expect(lampSummaryFromGateway(null)).toBeNull()
  })

  it('dates it by the newest lamp report — by time, not by the string', () => {
    const at = latestLampReport([
      lamp(1, 1, 'a', '31/08/2569 06:29:49'),
      lamp(2, 2, 'b', '15/09/2569 07:36:28'),
      lamp(3, 3, 'c', ''),
    ])
    expect(at && formatLampStamp(at)).toBe('15 ก.ย. 2569 07:36:28')
    expect(latestLampReport([])).toBeNull()
  })
})
