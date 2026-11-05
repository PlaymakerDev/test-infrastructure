import { describe, expect, it } from 'vitest'
import type { LightingLamp } from '@/types/lighting'
import {
  LAMP_EXPORT_COLUMNS,
  countWithShare,
  currentStats,
  filterLamps,
  formatHourWindow,
  formatLampStamp,
  hasLampStatus,
  lampCountTicks,
  lampCurrentPoints,
  lampExportNote,
  lampHistoryFromWeekly,
  lampRowsFromLamps,
  lampSummaryFromRows,
  latestLampReport,
  parseIsoDay,
  parseLampDay,
  parseLightingStamp,
  searchLamps,
  type LampRow,
} from './lampRows'

// A lamp as /lighting/solutions/{id}/lamps sends it (2026-11-05).
const lamp = (pole: string, deviceId: string, lastUpdate: string, more: Partial<LightingLamp> = {}): LightingLamp => ({
  device_id: deviceId,
  dev_eui: '',
  device_type: 'SEM',
  pole,
  lamp_type: '1',
  current: 0,
  status: 'ดับ',
  state: 'ดับ 1 โคม',
  is_online: false,
  battery: 0,
  rssi: -95,
  sta: '',
  highmast_group: '',
  lat: 13.82,
  lng: 100.44,
  last_update: lastUpdate,
  ...more,
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

describe('lampRowsFromLamps', () => {
  it('lists the lamps in pole order — by number, not by the text', () => {
    const rows = lampRowsFromLamps([
      lamp('10', '24E124746F137268', '19/07/2569 06:18:48'),
      lamp('2', '24E124746F137667 ', '15/09/2569 07:36:28'),
    ])
    expect(rows.map((r) => [r.order, r.code, r.updatedAt])).toEqual([
      [2, '24E124746F137667', '15 ก.ย. 2569 07:36:28'],
      [10, '24E124746F137268', '19 ก.ค. 2569 06:18:48'],
    ])
  })

  it('carries the status, connection and current BE gives', () => {
    const rows = lampRowsFromLamps([
      lamp('1', 'a', '05/11/2569 13:27:48', { status: 'ปกติ', state: 'ใช้งานได้', is_online: true, current: 0.42 }),
      lamp('2', 'b', '14/07/2568 22:05:10'),
      lamp('3', 'c', '', { status: 'อื่น ๆ', current: null }),
    ])
    expect(rows.map((r) => [r.isWorking, r.isConnected, r.current])).toEqual([
      [true, true, 0.42],
      [false, false, 0],
      [null, false, null],
    ])
  })

  it('a lamp with no pole number goes last, numbered by its place; one that never reported shows "-"', () => {
    const rows = lampRowsFromLamps([lamp('', '', ''), lamp('1', 'b', '01/08/2569 06:02:47')])
    expect(rows.map((r) => [r.order, r.code, r.updatedAt])).toEqual([
      [1, 'b', '1 ส.ค. 2569 06:02:47'],
      [2, '-', '-'],
    ])
    expect(new Set(rows.map((r) => r.key)).size).toBe(2)
    expect(lampRowsFromLamps(null)).toEqual([])
  })
})

describe('สถานะโคมไฟวันนี้ and its age', () => {
  it('counts the table’s rows, so the donut and the chips agree', () => {
    const rows = lampRowsFromLamps([
      lamp('1', 'a', '', { status: 'ปกติ' }),
      lamp('2', 'b', '', { status: 'ปกติ' }),
      lamp('3', 'c', ''),
    ])
    expect(lampSummaryFromRows(rows)).toEqual({ total: 3, working: 2, notWorking: 1 })
    expect(lampSummaryFromRows([])).toBeNull()
  })

  it('dates it by the newest lamp report — by time, not by the string', () => {
    const at = latestLampReport([
      lamp('1', 'a', '31/08/2569 06:29:49'),
      lamp('2', 'b', '15/09/2569 07:36:28'),
      lamp('3', 'c', ''),
    ])
    expect(at && formatLampStamp(at)).toBe('15 ก.ย. 2569 07:36:28')
    expect(latestLampReport([])).toBeNull()
  })
})

describe('แผนภูมิแสดงประวัติสถานะโคมไฟ 7 วันย้อนหลัง', () => {
  it('reads the tally’s dd/mm/yy Buddhist dates', () => {
    const day = parseLampDay('30/10/69')
    expect(day && [day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([2026, 9, 30])
    expect(parseLampDay('31/02/69')).toBeNull()
    expect(parseLampDay('2026-10-30')).toBeNull()
  })

  it('one bar group per day, oldest first, labelled like the rest of the page', () => {
    expect(lampHistoryFromWeekly([
      { date: '30/10/69', total: 180, work: 1, fail: 179 },
      { date: '05/11/69', total: 180, work: 0, fail: 180 },
    ])).toEqual([
      { label: '30 ต.ค. 2569', tooltipLabel: '30 ต.ค. 2569', working: 1, notWorking: 179 },
      { label: '5 พ.ย. 2569', tooltipLabel: '5 พ.ย. 2569', working: 0, notWorking: 180 },
    ])
    expect(lampHistoryFromWeekly(null)).toEqual([])
  })

  it('whole-lamp ticks in about five steps', () => {
    expect(lampCountTicks(414)).toEqual([0, 100, 200, 300, 400, 500])
    expect(lampCountTicks(180)).toEqual([0, 50, 100, 150, 200])
    expect(lampCountTicks(16)).toEqual([0, 5, 10, 15, 20])
    expect(lampCountTicks(8)).toEqual([0, 2, 4, 6, 8])
    expect(lampCountTicks(1)).toEqual([0, 1])
    expect(lampCountTicks(0)).toEqual([0, 1])
  })
})

describe('ทั้งหมด / UP / DOWN and นำออกเอกสาร (user 2026-11-05)', () => {
  const row = (order: number, isWorking: boolean | null, isConnected: boolean | null = null, current: number | null = null): LampRow => ({
    key: String(order), order, code: `D${order}`, isWorking, isConnected, current, updatedAt: '15 ก.ย. 2569 07:36:28',
  })
  const today = [row(1, null), row(2, null)]
  const later = [row(1, true, true, 0.934), row(2, false, false, 0), row(3, true, false, null)]

  it('UP / DOWN wait for the API’s per-lamp status', () => {
    expect(hasLampStatus(today)).toBe(false)
    expect(hasLampStatus(later)).toBe(true)
    expect(filterLamps(today, 'ALL')).toBe(today)
  })

  it('UP = working, DOWN = not working, unknown in neither', () => {
    expect(filterLamps(later, 'UP').map((r) => r.order)).toEqual([1, 3])
    expect(filterLamps(later, 'DOWN').map((r) => r.order)).toEqual([2])
    expect(filterLamps([row(9, null)], 'UP')).toEqual([])
  })

  it('exports the table’s columns in its order — "-" where the API has nothing, Excel keeps the current a number', () => {
    expect(LAMP_EXPORT_COLUMNS.map((c) => c.header)).toEqual(['ลำดับโคม', 'รหัสอุปกรณ์', 'สถานะโคมไฟ', 'การเชื่อมต่อ', 'กระแสไฟฟ้า (A)', 'อัพเดตล่าสุด'])
    expect(LAMP_EXPORT_COLUMNS.reduce((sum, c) => sum + c.widthPct, 0)).toBe(100)
    expect(LAMP_EXPORT_COLUMNS.map((c) => c.pdf(today[0]))).toEqual([1, 'D1', '-', '-', '-', '15 ก.ย. 2569 07:36:28'])
    expect(LAMP_EXPORT_COLUMNS.map((c) => c.pdf(later[0]))).toEqual([1, 'D1', 'ทำงาน', 'เชื่อมต่อ', '0.93', '15 ก.ย. 2569 07:36:28'])
    expect(LAMP_EXPORT_COLUMNS.map((c) => c.excel(later[1])).slice(2, 5)).toEqual(['ไม่ทำงาน', 'ไม่เชื่อมต่อ', 0])
    expect(LAMP_EXPORT_COLUMNS[4].excel(later[2])).toBe('-')
  })
})

describe('ค้นหา (user 2026-11-05)', () => {
  const row = (order: number, code: string): LampRow => ({
    key: String(order), order, code, isWorking: null, isConnected: null, current: null, updatedAt: '-',
  })
  const rows = [row(1, '24E124746F069297'), row(15, '24E124746F061709'), row(115, '24E124746F060510'), row(150, 'AB15CD')]

  it('a pole number is the whole number — "15" is โคม 15, plus any code holding "15"', () => {
    expect(searchLamps(rows, '15').map((r) => r.order)).toEqual([15, 150])
    // Trimmed, and whole: "115" is not 1 or 15.
    expect(searchLamps(rows, ' 115 ').map((r) => r.order)).toEqual([115])
  })

  it('any part of a device code, any case; empty = every lamp', () => {
    expect(searchLamps(rows, 'f069297').map((r) => r.order)).toEqual([1])
    expect(searchLamps(rows, 'ab15').map((r) => r.order)).toEqual([150])
    expect(searchLamps(rows, '   ')).toBe(rows)
    expect(searchLamps(rows, 'ไม่มีจริง')).toEqual([])
  })

  it('the export names the status and the search', () => {
    expect(lampExportNote('ALL', '')).toBe('สถานะโคมไฟ: ทั้งหมด')
    expect(lampExportNote('DOWN', ' F0697 ')).toBe('สถานะโคมไฟ: DOWN (ไม่ทำงาน) · ค้นหา "F0697"')
  })
})

describe('กระแสไฟฟ้าเฉลี่ย + Peak Hour Current (Figma, BE 2026-11-05)', () => {
  const hour = (h: string, avg: number | null) => ({ hour: h, avg_amp: avg, min_amp: avg, max_amp: avg, lamps: avg == null ? 0 : 3, samples: avg == null ? 0 : 5 })

  it('averages the hours that have a reading; the peak is the highest hour', () => {
    const points = lampCurrentPoints([hour('00:00', 0.5), hour('01:00', null), hour('03:00', 0.8), hour('12:00', 0)])
    expect(points).toEqual([
      { hour: '00:00', amp: 0.5 }, { hour: '01:00', amp: null }, { hour: '03:00', amp: 0.8 }, { hour: '12:00', amp: 0 },
    ])
    const stats = currentStats(points)
    expect(stats.average).toBeCloseTo(1.3 / 3, 10)
    expect(stats.peakHour).toBe('03.00 - 04.00')
  })

  it('no reading at all → no average, no peak; only zeros → 0 A but no peak hour', () => {
    expect(currentStats(lampCurrentPoints([hour('00:00', null), hour('01:00', null)]))).toEqual({ average: null, peakHour: null })
    expect(currentStats(lampCurrentPoints(null))).toEqual({ average: null, peakHour: null })
    expect(currentStats([{ hour: '07:00', amp: 0 }, { hour: '08:00', amp: 0 }])).toEqual({ average: 0, peakHour: null })
  })

  it('writes an hour the Figma way, the last one through 24.00', () => {
    expect(formatHourWindow('03:00')).toBe('03.00 - 04.00')
    expect(formatHourWindow('23:00')).toBe('23.00 - 24.00')
    expect(formatHourWindow('8:00')).toBe('08.00 - 09.00')
    expect(formatHourWindow('สามโมง')).toBeNull()
  })

  it('Active and the donut legend: a count and its share', () => {
    expect(countWithShare(286, 414)).toBe('286 (69.1%)')
    expect(countWithShare(1234, 2000)).toBe('1,234 (61.7%)')
    expect(countWithShare(0, 0)).toBe('0 (0.0%)')
  })

  it('reads the hourly endpoint’s day', () => {
    const day = parseIsoDay('2026-11-05')
    expect(day && [day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([2026, 10, 5])
    expect(parseIsoDay('2026-02-30')).toBeNull()
    expect(parseIsoDay('05/11/69')).toBeNull()
  })
})

describe('a pin per lamp', () => {
  it('keeps the raw device id for the per-lamp endpoints and the lamp’s position', () => {
    const [row] = lampRowsFromLamps([lamp('12', '24E124746F137262 ', '', { lat: 15.85, lng: 104.63 })])
    expect([row.code, row.deviceId, row.coord]).toEqual(['24E124746F137262', '24E124746F137262 ', [104.63, 15.85]])
  })

  it('no position → no pin', () => {
    const rows = lampRowsFromLamps([lamp('1', 'a', '', { lat: null, lng: null }), lamp('2', 'b', '', { lat: 0, lng: 0 })])
    expect(rows.map((r) => r.coord)).toEqual([null, null])
  })
})
