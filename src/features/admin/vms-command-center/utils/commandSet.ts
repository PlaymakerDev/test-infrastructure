import dayjs, { Dayjs } from 'dayjs'
import type { VMSMediaItem } from '@/types/vms/media-library-api'

/** One display window inside a command set. */
export interface TimeSlot {
  id: number
  range: [Dayjs, Dayjs]
}

/**
 * One ชุดคำสั่ง — its own name, working condition, date range, display windows
 * and content. Each set becomes one entry in the dispatch body's `settings[]`
 * array (the contract carries a date range + all-day flag + content per
 * setting).
 */
export interface CommandSetValue {
  id: number
  scheduleName: string
  /** "แสดงผลตลอดเวลา" — per set, mirrors the payload's per-setting flag. */
  isAllDay: boolean
  dateRange: [Dayjs, Dayjs]
  timeSlots: TimeSlot[]
  isMessageOnly: boolean
  message: string
  selectedMedia?: VMSMediaItem
  daysOfWeek: number[]
}

export const toMinutes = (d: Dayjs) => d.hour() * 60 + d.minute()

export const slotsOverlap = (a: [Dayjs, Dayjs], b: [Dayjs, Dayjs]) =>
  toMinutes(a[0]) < toMinutes(b[1]) && toMinutes(b[0]) < toMinutes(a[1])

/**
 * Slots whose end is at or before their start — the old single
 * TimePicker.RangePicker made this impossible, two standalone pickers don't.
 */
export const invalidSlotIdsOf = (slots: TimeSlot[]) =>
  new Set(slots.filter((s) => toMinutes(s.range[1]) <= toMinutes(s.range[0])).map((s) => s.id))

export const overlappingSlotIdsOf = (slots: TimeSlot[]) => {
  const bad = new Set<number>()
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slotsOverlap(slots[i].range, slots[j].range)) {
        bad.add(slots[i].id)
        bad.add(slots[j].id)
      }
    }
  }
  return bad
}

/**
 * Which weekdays actually fall inside the date range — mirrors legacy's
 * FormAddDetail.tsx exactly. A 1-2 day range can only ever hit 1-2 distinct
 * weekdays, so offering all 7 toggles is misleading; a 7+ day range can hit
 * any weekday, so nothing gets disabled.
 */
export const availableDaysFor = ([start, end]: [Dayjs, Dayjs]) => {
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) return [1, 2, 3, 4, 5, 6, 7]
  if (end.diff(start, 'day') >= 6) return [1, 2, 3, 4, 5, 6, 7]
  const days = new Set<number>()
  for (let i = 0; i <= end.diff(start, 'day'); i++) {
    const d = start.add(i, 'day').day()
    days.add(d === 0 ? 7 : d)
  }
  return Array.from(days).sort((a, b) => a - b)
}

/** Inclusive day-level overlap between two display date ranges. */
export const dateRangesOverlap = (a: [Dayjs, Dayjs], b: [Dayjs, Dayjs]) =>
  !a[0].isAfter(b[1], 'day') && !b[0].isAfter(a[1], 'day')

/**
 * Ids of sets whose date range collides with an EARLIER set's — set 1 is the
 * anchor, every later set has to pick days the ones above it don't use. Also
 * catches the case where set 1's range is widened after set 2 was added (the
 * pickers can only grey out days that were taken at the time of picking).
 */
export const conflictingSetIds = (sets: CommandSetValue[]) => {
  const bad = new Set<number>()
  for (let i = 1; i < sets.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dateRangesOverlap(sets[i].dateRange, sets[j].dateRange)) {
        bad.add(sets[i].id)
        break
      }
    }
  }
  return bad
}

export const isCommandSetValid = (set: CommandSetValue) =>
  (set.isMessageOnly ? set.message.trim().length > 0 : !!set.selectedMedia?.url) &&
  invalidSlotIdsOf(set.timeSlots).size === 0 &&
  overlappingSlotIdsOf(set.timeSlots).size === 0

let idSeq = 1
/** Monotonic React-key/slot id source, shared by sets and their slots. */
export const nextId = () => idSeq++

/**
 * A fresh set: `startDate` (today when omitted), "now → now + 1 hr" (rounded
 * to the minute so the picker shows 13:07 rather than 13:07:42), media mode,
 * nothing selected yet. Added sets pass the day after the previous set's end
 * so two sets never start out on the same date.
 */
export const createCommandSet = (startDate?: Dayjs): CommandSetValue => {
  const day = startDate ?? dayjs()
  const now = dayjs().startOf('minute')
  return {
    id: nextId(),
    scheduleName: 'ประกาศ',
    isAllDay: false,
    dateRange: [day, day],
    timeSlots: [{ id: nextId(), range: [now, now.add(1, 'hour')] }],
    isMessageOnly: false,
    message: '',
    daysOfWeek: [],
  }
}
