import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'

import {
  combineDateTime,
  continuousWindow,
  dayAllowed,
  describeWindow,
  liveDisplayState,
  windowOnDay,
  type CommandTiming,
} from './displayWindow'

const at = (iso: string) => dayjs(iso).valueOf()

// 2026-09-19 = เสาร์ · 20 = อาทิตย์ · 21 = จันทร์ · 22 = อังคาร
// เคสจริงที่ทำให้ต้องเขียนไฟล์นี้: คำสั่งคืน 19 ก.ย. 2569 22:51–23:51
// (is_all_day=false · days_of_week=97 = จ.+ส.+อา.) ป้ายดับ 23:51 ตรงเวลา
// แต่ worker เขียนสถานะกลับเป็น "กำลังแสดงผล" ตอน 23:55
const realRecurring: CommandTiming = {
  date_since: '2026-09-19',
  date_to: '2026-09-22',
  is_all_day: false,
  time_since: '22:51:00',
  time_to: '23:51:00',
  days_of_week: 97,
}

// เคสจริงชุดที่สอง: 20 ก.ย. 01:35 → 22 ก.ย. 02:30 แบบ "แสดงผลตลอดเวลา"
const realAllDay: CommandTiming = {
  date_since: '2026-09-20',
  date_to: '2026-09-22',
  is_all_day: true,
  time_since: '01:35:00',
  time_to: '02:30:00',
  days_of_week: 65,
}

describe('combineDateTime', () => {
  it('รวมวันกับเวลาแบบ HH:MM:SS', () => {
    expect(combineDateTime('2026-09-20', '06:01:00')?.format('YYYY-MM-DD HH:mm:ss')).toBe(
      '2026-09-20 06:01:00'
    )
  })

  it('รับ HH:MM ด้วย (ฟอร์มส่งมาแบบนี้ได้)', () => {
    expect(combineDateTime('2026-09-20', '06:01')?.format('HH:mm:ss')).toBe('06:01:00')
  })

  it('ไม่มีเวลา = เที่ยงคืน', () => {
    expect(combineDateTime('2026-09-20', null)?.format('HH:mm:ss')).toBe('00:00:00')
  })

  it('วันที่เพี้ยน/ว่าง คืน null ไม่ใช่ Invalid Date', () => {
    expect(combineDateTime('', '06:01')).toBeNull()
    expect(combineDateTime('20/09/2026', '06:01')).toBeNull()
    expect(combineDateTime(null, '06:01')).toBeNull()
  })

  it('เวลานอกช่วง (25:00) ตกกลับเป็นเที่ยงคืน ไม่ใช่เลื่อนวัน', () => {
    expect(combineDateTime('2026-09-20', '25:00')?.format('YYYY-MM-DD HH:mm')).toBe(
      '2026-09-20 00:00'
    )
  })
})

describe('dayAllowed', () => {
  it('97 = จ.(1) + ส.(6) + อา.(7)', () => {
    expect(dayAllowed(97, 1)).toBe(true)
    expect(dayAllowed(97, 2)).toBe(false)
    expect(dayAllowed(97, 6)).toBe(true)
    expect(dayAllowed(97, 7)).toBe(true)
  })

  it('0 หรือไม่ส่ง = ทุกวัน (ตรงกับตัวป้าย)', () => {
    for (let d = 1; d <= 7; d++) {
      expect(dayAllowed(0, d)).toBe(true)
      expect(dayAllowed(null, d)).toBe(true)
      expect(dayAllowed(undefined, d)).toBe(true)
    }
  })

  it('127 = ทุกวัน', () => {
    for (let d = 1; d <= 7; d++) expect(dayAllowed(127, d)).toBe(true)
  })
})

describe('continuousWindow — โหมดแสดงผลตลอดเวลา', () => {
  it('ข้ามคืนได้ ไม่ตัดที่สิ้นวัน', () => {
    const win = continuousWindow(realAllDay)!
    expect(win.start.format('YYYY-MM-DD HH:mm')).toBe('2026-09-20 01:35')
    expect(win.end.format('YYYY-MM-DD HH:mm')).toBe('2026-09-22 02:30')
  })

  it('วันเดียวกัน = ได้แค่ช่วงสั้น ๆ ไม่ใช่ 24 ชม.', () => {
    const win = continuousWindow({
      date_since: '2026-09-20',
      date_to: '2026-09-20',
      is_all_day: true,
      time_since: '06:01:00',
      time_to: '07:01:00',
    })!
    expect(win.end.diff(win.start, 'minute')).toBe(60)
  })

  it('กลับด้าน (จบก่อนเริ่ม) คืน null', () => {
    expect(
      continuousWindow({
        date_since: '2026-09-20',
        date_to: '2026-09-20',
        is_all_day: true,
        time_since: '07:00:00',
        time_to: '06:00:00',
      })
    ).toBeNull()
  })
})

describe('windowOnDay — โหมดเลือกช่วงเวลา', () => {
  it('วันที่บิตอนุญาตและอยู่ในช่วง = ได้หน้าต่างของวันนั้น', () => {
    const win = windowOnDay(realRecurring, dayjs('2026-09-19'))!
    expect(win.start.format('YYYY-MM-DD HH:mm')).toBe('2026-09-19 22:51')
    expect(win.end.format('YYYY-MM-DD HH:mm')).toBe('2026-09-19 23:51')
  })

  it('วันที่บิตไม่อนุญาต คืน null (อังคาร 22 ก.ย. ไม่อยู่ใน 97)', () => {
    expect(windowOnDay(realRecurring, dayjs('2026-09-22'))).toBeNull()
  })

  it('วันนอกช่วงวันที่ คืน null — ไม่ใช่คืนช่วงเต็มแบบของเดิม', () => {
    expect(windowOnDay(realRecurring, dayjs('2026-09-18'))).toBeNull()
    expect(windowOnDay(realRecurring, dayjs('2026-09-23'))).toBeNull()
  })

  it('00:00:00 → 00:00:00 = เต็ม 24 ชม. ดับเที่ยงคืนวันถัดไป', () => {
    const win = windowOnDay(
      {
        date_since: '2026-09-20',
        date_to: '2026-09-20',
        is_all_day: false,
        time_since: '00:00:00',
        time_to: '00:00:00',
      },
      dayjs('2026-09-20')
    )!
    expect(win.start.format('YYYY-MM-DD HH:mm')).toBe('2026-09-20 00:00')
    expect(win.end.format('YYYY-MM-DD HH:mm')).toBe('2026-09-21 00:00')
  })
})

describe('liveDisplayState — เคสจริงคืน 19 ก.ย. 2569', () => {
  it('23:03 (หลังส่งคำสั่ง) = กำลังขึ้นจอ', () => {
    const s = liveDisplayState(realRecurring, at('2026-09-19T23:03:30'))
    expect(s.kind).toBe('playing')
  })

  it('23:51:30 = ดับแล้ว ต้องไม่ใช่ playing — นี่คือจุดที่ worker เขียนผิด', () => {
    const s = liveDisplayState(realRecurring, at('2026-09-19T23:51:30'))
    expect(s.kind).toBe('waiting')
    if (s.kind === 'waiting') {
      // รอบถัดไปคืนวันอาทิตย์ 20 ก.ย.
      expect(s.next.format('YYYY-MM-DD HH:mm')).toBe('2026-09-20 22:51')
    }
  })

  it('23:55 (จังหวะที่ worker เขียนทับ) ก็ยังต้องไม่ใช่ playing', () => {
    expect(liveDisplayState(realRecurring, at('2026-09-19T23:55:00')).kind).toBe('waiting')
  })

  it('ข้ามวันอังคารที่บิตไม่อนุญาต ไปวันที่ตรงถัดไป', () => {
    // 21 ก.ย. = จันทร์ (อยู่ใน 97) · หลังจบคืนจันทร์แล้วไม่มีวันตรงเหลือในช่วง
    const s = liveDisplayState(realRecurring, at('2026-09-21T23:52:00'))
    expect(s.kind).toBe('ended')
  })

  it('ก่อนวันแรกของช่วง = รอรอบแรก', () => {
    const s = liveDisplayState(realRecurring, at('2026-09-18T10:00:00'))
    expect(s.kind).toBe('waiting')
    if (s.kind === 'waiting') expect(s.next.format('YYYY-MM-DD HH:mm')).toBe('2026-09-19 22:51')
  })
})

describe('liveDisplayState — เคสจริงชุด all-day 20-22 ก.ย.', () => {
  it('06:20 ของวันที่ 20 ยังขึ้นจออยู่ (ข้ามคืนมา)', () => {
    expect(liveDisplayState(realAllDay, at('2026-09-20T06:20:00')).kind).toBe('playing')
  })

  it('เที่ยงคืนวันที่ 21 ก็ยังขึ้นอยู่ — ไม่ดับตอนสิ้นวัน', () => {
    expect(liveDisplayState(realAllDay, at('2026-09-21T00:10:00')).kind).toBe('playing')
  })

  it('บิตวันไม่มีผลในโหมดนี้ (21 ก.ย. = จันทร์ อยู่ใน 65 อยู่แล้ว · ลองอังคาร 22 ที่ไม่อยู่)', () => {
    expect(liveDisplayState(realAllDay, at('2026-09-22T02:00:00')).kind).toBe('playing')
  })

  it('หลัง 22 ก.ย. 02:30 = จบ', () => {
    const s = liveDisplayState(realAllDay, at('2026-09-22T02:31:00'))
    expect(s.kind).toBe('ended')
  })

  it('ก่อนเริ่ม = รอ', () => {
    expect(liveDisplayState(realAllDay, at('2026-09-20T01:00:00')).kind).toBe('waiting')
  })
})

describe('liveDisplayState — ข้อมูลไม่ครบ', () => {
  it('ไม่มีวันที่ = unknown ไม่ใช่เดาว่ากำลังแสดง', () => {
    expect(liveDisplayState({}, at('2026-09-20T06:00:00')).kind).toBe('unknown')
  })

  it('all-day ที่ช่วงกลับด้าน = unknown', () => {
    const s = liveDisplayState(
      { date_since: '2026-09-20', date_to: '2026-09-20', is_all_day: true, time_since: '07:00:00', time_to: '06:00:00' },
      at('2026-09-20T06:30:00')
    )
    expect(s.kind).toBe('unknown')
  })
})

describe('describeWindow — ประโยคบนหน้ายืนยัน', () => {
  it('all-day บอกเวลาขึ้น-ดับจริง และบอกว่าไม่ดับกลางคืน', () => {
    const text = describeWindow(realAllDay)
    expect(text).toContain('ขึ้นจอ')
    expect(text).toContain('ดับจอ')
    expect(text).toContain('ต่อเนื่องไม่ดับกลางคืน')
    // 20/09 01:35 → 22/09 02:30 = 48 ชม. 55 นาที (ไม่ใช่ "2 วัน")
    expect(text).toContain('48 ชม. 55 นาที')
  })

  it('all-day วันเดียวกันต้องบอกตรง ๆ ว่าได้ 1 ชม. ไม่ใช่ "ตลอดเวลา"', () => {
    const text = describeWindow({
      date_since: '2026-09-20',
      date_to: '2026-09-20',
      is_all_day: true,
      time_since: '06:01:00',
      time_to: '07:01:00',
    })
    expect(text).toContain('1 ชม.')
  })

  it('โหมดรายวันบอกว่าเป็นรอบต่อวัน', () => {
    expect(describeWindow(realRecurring)).toContain('วันละรอบ 22:51–23:51')
  })
})
