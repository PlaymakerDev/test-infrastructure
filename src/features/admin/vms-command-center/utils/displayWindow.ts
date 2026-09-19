import dayjs, { Dayjs } from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'

// `BBBB` (พ.ศ.) ใช้ใน describeWindow · extend ซ้ำได้ ไม่มีผลข้างเคียง
dayjs.extend(buddhistEra)

/**
 * หน้าต่างการแสดงผลจริงของคำสั่ง VMS — สูตรเดียวกับที่ตัวป้ายใช้
 *
 * ของจริงมีสองโหมด และ **ความหมายไม่เหมือนกัน** (ที่หน้าจอเคยเขียนว่า "ตลอดวัน"
 * คือคำที่ผิด และเป็นต้นเหตุที่ operator ตั้งเวลาพลาดมาแล้ว):
 *
 *  - `is_all_day = true`  "แสดงผลตลอดเวลา" = **ช่วงเดียวยาวต่อเนื่องข้ามคืน**
 *    ขึ้นจอที่ (date_since + time_since) ดับจอที่ (date_to + time_to)
 *    `days_of_week` ถูกเมินทั้งฝั่ง API และฝั่งป้าย
 *
 *  - `is_all_day = false` "เลือกช่วงเวลา" = รอบรายวันซ้ำทุกวันใน [date_since, date_to]
 *    ที่บิตของ `days_of_week` ตรง · ช่วง 00:00:00–00:00:00 = เต็ม 24 ชม.
 *    (ดับตอนเที่ยงคืนของวันถัดไป) ซึ่งเป็นเคสเดียวที่ time_since == time_to ได้
 *
 * แหล่งความจริงที่ลอกสูตรมา (ห้ามแก้ที่นี่โดยไม่ไปดูสองที่นี้ก่อน):
 *  - ฝั่ง API  `vms/internal/dto/vmssetting/service.go` validateAllDaySchedule / validateSchedules
 *  - ฝั่งป้าย  `ScreenCaptureVMS.py` _on_command_received (สาขา is_all_day / recurring)
 *
 * ไฟล์นี้ใช้ "บอกว่าตามตารางแล้วตอนนี้ควรขึ้นจอไหม" เท่านั้น
 * **ห้ามเอาไปแทนค่า `status` ที่ป้ายรายงานมา** — ปฏิทินยืนยันภาพบนป้ายไม่ได้
 * (ที่ปรึกษา 2 หัวชี้ตรงกัน 20 ก.ย. 2569 · ask 20260920-063736-59a9)
 */

/** ฟิลด์เวลาที่ /command-center/monitor ส่งมาให้อยู่แล้ว */
export interface CommandTiming {
  date_since?: string | null
  date_to?: string | null
  is_all_day?: boolean | null
  time_since?: string | null
  time_to?: string | null
  /** bitmask ISO weekday: จ.=bit0 … อา.=bit6 · 0/ไม่ส่ง = ทุกวัน */
  days_of_week?: number | null
}

export interface DisplayWindow {
  start: Dayjs
  end: Dayjs
}

export type LiveDisplayState =
  /** ข้อมูลไม่พอจะบอกได้ (ไม่มี date_since/date_to) */
  | { kind: 'unknown' }
  /** ตามตารางแล้วตอนนี้ควรขึ้นจอ */
  | { kind: 'playing'; window: DisplayWindow }
  /** ยังไม่ถึงรอบ — มีรอบถัดไป */
  | { kind: 'waiting'; next: Dayjs }
  /** เลยรอบสุดท้ายไปแล้ว */
  | { kind: 'ended'; end: Dayjs }

const MIDNIGHT = '00:00:00'

/** "HH:MM" หรือ "HH:MM:SS" -> "HH:MM:SS" · ค่าว่าง/เพี้ยน -> null */
const normalizeTime = (time?: string | null): string | null => {
  if (!time) return null
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time.trim())
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  const s = m[3] ? Number(m[3]) : 0
  if (h > 23 || mi > 59 || s > 59) return null
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** รวมวันที่ (YYYY-MM-DD) กับเวลา (HH:MM[:SS]) เป็น Dayjs เวลาท้องถิ่น */
export const combineDateTime = (date?: string | null, time?: string | null): Dayjs | null => {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return null
  const t = normalizeTime(time) ?? MIDNIGHT
  const d = dayjs(`${date.trim()}T${t}`)
  return d.isValid() ? d : null
}

/** ทุกวันที่บิตอนุญาต · 0 หรือไม่ส่ง = ทุกวัน (ตรงกับตัวป้าย: `if not dow: dow = {1..7}`) */
export const dayAllowed = (mask: number | null | undefined, isoDow: number): boolean => {
  if (mask == null || mask === 0) return true
  return (mask & (1 << (isoDow - 1))) !== 0
}

const isoDowOf = (d: Dayjs): number => (d.day() === 0 ? 7 : d.day())

/**
 * โหมด "แสดงผลตลอดเวลา" — ช่วงเดียวต่อเนื่อง
 * คืน null เมื่อวันที่/เวลาไม่ครบหรือกลับด้าน (API ปฏิเสธไว้แล้ว แต่ข้อมูลเก่าอาจมี)
 */
export const continuousWindow = (t: CommandTiming): DisplayWindow | null => {
  const start = combineDateTime(t.date_since, t.time_since)
  const end = combineDateTime(t.date_to, t.time_to)
  if (!start || !end || !start.isBefore(end)) return null
  return { start, end }
}

/**
 * โหมด "เลือกช่วงเวลา" — หน้าต่างของ "วันนั้น" วันเดียว
 * คืน null เมื่อวันนั้นอยู่นอก [date_since, date_to] หรือบิตวันไม่อนุญาต
 */
export const windowOnDay = (t: CommandTiming, day: Dayjs): DisplayWindow | null => {
  const rangeStart = combineDateTime(t.date_since, MIDNIGHT)
  const rangeEnd = combineDateTime(t.date_to, MIDNIGHT)
  if (!rangeStart || !rangeEnd) return null

  const d = day.startOf('day')
  if (d.isBefore(rangeStart) || d.isAfter(rangeEnd)) return null
  if (!dayAllowed(t.days_of_week, isoDowOf(d))) return null

  const since = normalizeTime(t.time_since) ?? MIDNIGHT
  const to = normalizeTime(t.time_to) ?? MIDNIGHT
  const start = combineDateTime(d.format('YYYY-MM-DD'), since)
  if (!start) return null

  // 00:00:00 → 00:00:00 = เต็ม 24 ชม. ดับเที่ยงคืนของวันถัดไป
  // (เคสเดียวที่ time_since == time_to ได้ · ตรงกับ isAllDaySlot ฝั่ง API
  //  และ `slot_all_day` ฝั่งป้าย)
  if (since === MIDNIGHT && to === MIDNIGHT) {
    return { start, end: start.add(1, 'day') }
  }
  const end = combineDateTime(d.format('YYYY-MM-DD'), to)
  if (!end || !start.isBefore(end)) return null
  return { start, end }
}

/** จำนวนวันมากสุดที่เดินหารอบถัดไป — บิตวันวนซ้ำทุก 7 วัน เกินนี้ไม่ได้อะไรเพิ่ม */
const LOOKAHEAD_DAYS = 8

/**
 * ตามตารางแล้ว ณ เวลานี้ควรขึ้นจอไหม และรอบถัดไปเมื่อไหร่
 * nowMs เป็น epoch ms เพื่อให้เทสตรึงเวลาได้
 */
export const liveDisplayState = (t: CommandTiming, nowMs: number): LiveDisplayState => {
  const now = dayjs(nowMs)

  if (t.is_all_day === true) {
    const win = continuousWindow(t)
    if (!win) return { kind: 'unknown' }
    if (now.isBefore(win.start)) return { kind: 'waiting', next: win.start }
    if (now.isBefore(win.end)) return { kind: 'playing', window: win }
    return { kind: 'ended', end: win.end }
  }

  const rangeStart = combineDateTime(t.date_since, MIDNIGHT)
  const rangeEnd = combineDateTime(t.date_to, MIDNIGHT)
  if (!rangeStart || !rangeEnd) return { kind: 'unknown' }

  // เริ่มเดินจากวันนี้ หรือจากวันแรกของช่วงถ้ายังไม่ถึง
  let cursor = now.startOf('day')
  if (cursor.isBefore(rangeStart)) cursor = rangeStart
  let lastEnd: Dayjs | null = null

  for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
    const day = cursor.add(i, 'day')
    if (day.isAfter(rangeEnd)) break
    const win = windowOnDay(t, day)
    if (!win) continue
    if (now.isBefore(win.start)) return { kind: 'waiting', next: win.start }
    if (now.isBefore(win.end)) return { kind: 'playing', window: win }
    lastEnd = win.end
  }

  // ไม่เจอรอบข้างหน้าใน 8 วัน — ถ้าช่วงยังไม่หมดถือว่ายังบอกไม่ได้
  // (บิตวันวนทุก 7 วัน ดังนั้นกรณีนี้คือช่วงจบไปแล้วจริง ๆ)
  if (lastEnd) return { kind: 'ended', end: lastEnd }

  // ไม่มีรอบไหนเลยในช่วง (เช่นบิตวันไม่ตรงสักวัน) — API กันไว้แล้ว แต่ข้อมูลเก่าอาจมี
  return { kind: 'unknown' }
}

/**
 * ประโยคภาษาคนว่าคำสั่งนี้จะขึ้น–ดับเมื่อไหร่ ใช้บนหน้ายืนยันก่อนส่ง
 * เขียนเป็นผลลัพธ์จริง ไม่ใช่ค่าที่กรอก — คนกดจะได้เห็นว่าได้กี่ชั่วโมงจริง
 */
export const describeWindow = (t: CommandTiming): string => {
  const fmt = (d: Dayjs) => d.locale('th').format('D MMM BBBB HH:mm')
  if (t.is_all_day === true) {
    const win = continuousWindow(t)
    if (!win) return 'ช่วงเวลาไม่ถูกต้อง'
    const mins = win.end.diff(win.start, 'minute')
    const hrs = Math.floor(mins / 60)
    const rest = mins % 60
    const dur = hrs > 0 ? `${hrs} ชม.${rest > 0 ? ` ${rest} นาที` : ''}` : `${mins} นาที`
    return `ขึ้นจอ ${fmt(win.start)} → ดับจอ ${fmt(win.end)} · ต่อเนื่องไม่ดับกลางคืน รวม ${dur}`
  }
  const since = normalizeTime(t.time_since)
  const to = normalizeTime(t.time_to)
  if (!since || !to) return 'ช่วงเวลาไม่ถูกต้อง'
  const perDay =
    since === MIDNIGHT && to === MIDNIGHT
      ? 'ทั้งวัน (00:00–24:00)'
      : `${since.slice(0, 5)}–${to.slice(0, 5)}`
  return `ขึ้น–ดับวันละรอบ ${perDay} ระหว่าง ${t.date_since} ถึง ${t.date_to}`
}
