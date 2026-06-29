"use client"
import React from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { DatePicker, Segmented, Select } from 'antd'
import { EVENT_TYPES, getEventTypeColor } from '@/features/admin/incident-detection/components/eventTypes'

const { RangePicker } = DatePicker

export type EventPeriod =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'THIS_YEAR'
  | 'ALL'
  | 'CUSTOM'

export interface EventFilterValues {
  /** Resolved date range used by the query. null = no date filter (ทั้งหมด). */
  date: [Dayjs, Dayjs] | null
  /** Active quick-period button. 'CUSTOM' when the user edits the range directly. */
  period: EventPeriod
  /** Event type — an `EventTypeName` enum value, or 'ALL'. */
  eventType: string
}

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: 'เมื่อวาน', value: 'YESTERDAY' },
  { label: '7 วัน', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

// Dropdown options — keeps the 10 event types out of a horizontal scrollbar.
const EVENT_TYPE_OPTIONS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  ...EVENT_TYPES.map((t) => ({ value: t.name, label: t.displayName })),
]

/** Resolve a quick-period into a concrete [start, end] range (null = ทั้งหมด). */
export const periodToRange = (period: EventPeriod): [Dayjs, Dayjs] | null => {
  const today = dayjs()
  switch (period) {
    case 'TODAY': return [today.startOf('day'), today.endOf('day')]
    case 'YESTERDAY': {
      const y = today.subtract(1, 'day')
      return [y.startOf('day'), y.endOf('day')]
    }
    case 'LAST_7_DAYS': return [today.subtract(6, 'day').startOf('day'), today.endOf('day')]
    case 'THIS_MONTH': return [today.startOf('month'), today.endOf('day')]
    case 'THIS_YEAR': return [today.startOf('year'), today.endOf('day')]
    case 'ALL':
    case 'CUSTOM':
    default: return null
  }
}

interface Props {
  value: EventFilterValues
  onChange: (next: EventFilterValues) => void
}

/** Coloured dot + label, for both the dropdown items and the selected value. */
const TypeOption: React.FC<{ value: string; label: React.ReactNode }> = ({ value, label }) => (
  <span className='flex items-center gap-2'>
    {value !== 'ALL' && (
      <span className='w-2.5 h-2.5 rounded-full shrink-0' style={{ background: getEventTypeColor(value) }} />
    )}
    {label}
  </span>
)

const FormSearchEvent: React.FC<Props> = ({ value, onChange }) => {
  return (
    // Filters sit adjacent (flex) on lg+ and stack on mobile. `items-end` lines
    // the inputs up at the same baseline; all controls are `large` so
    // วันที่ / ช่วงเวลา / ประเภท share the same height.
    <div className='flex flex-col lg:flex-row lg:flex-wrap lg:items-end gap-4'>
      {/* วันที่แสดงข้อมูล — editing it switches the active period to CUSTOM. */}
      <fieldset className='min-w-0'>
        <label className='block fs-12 text-(--yellow) mb-1'>วันที่แสดงข้อมูล</label>
        <RangePicker
          value={value.date}
          onChange={(d) =>
            onChange({
              ...value,
              date: d && d[0] && d[1] ? [d[0], d[1]] : null,
              period: d && d[0] && d[1] ? 'CUSTOM' : 'ALL',
            })
          }
          placeholder={['เริ่มต้น', 'สิ้นสุด']}
          format='DD/MM/YYYY'
          disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          size='large'
          className='w-full! lg:w-72!'
        />
      </fieldset>

      {/* ช่วงเวลา — quick presets that set the date range. */}
      <div className='min-w-0'>
        <label className='block fs-12 text-(--yellow) mb-1'>ช่วงเวลา</label>
        <div className='overflow-x-auto'>
          <Segmented
            value={value.period}
            onChange={(p) => {
              const period = p as EventPeriod
              onChange({ ...value, period, date: periodToRange(period) })
            }}
            options={PERIOD_OPTIONS}
            size='large'
            className='border! border-(--yellow)!'
          />
        </div>
      </div>

      {/* ประเภทเหตุการณ์ — dropdown (no horizontal scrollbar). */}
      <div className='min-w-0'>
        <label className='block fs-12 text-(--yellow) mb-1'>ประเภทเหตุการณ์</label>
        <Select
          value={value.eventType}
          onChange={(eventType) => onChange({ ...value, eventType })}
          size='large'
          className='w-full! lg:w-60!'
          options={EVENT_TYPE_OPTIONS}
          optionRender={(opt) => <TypeOption value={String(opt.value)} label={opt.label} />}
          labelRender={(props) => <TypeOption value={String(props.value)} label={props.label} />}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(FormSearchEvent)
