"use client"
import React from 'react'
import { fmtNumber } from '@/utils/formatNumber'

export interface StatusFilterChip<Key extends string> {
  key: Key
  label: string
  color: string
  /** `null` = no figure yet — the badge reads "-". */
  count: number | null
  /** Can't be picked: nothing to filter by yet. */
  disabled?: boolean
  /** Hover text — say why a chip is disabled. */
  title?: string
}

interface Props<Key extends string> {
  chips: StatusFilterChip<Key>[]
  active: Key
  onChange: (key: Key) => void
}

/** ทั้งหมด / UP / DOWN — an outlined chip with its count in a box beside the
 *  label; the picked one fills with its colour. The OVERVIEW tab's
 *  ตารางข้อมูลรายเหตุการณ์ and the lamp page's ตารางข้อมูลอุปกรณ์ (Figma) both
 *  filter with it. Renders the chips only — the caller's flex row lays them
 *  out (on a phone each takes half the row). */
const StatusFilterChips = <Key extends string>({ chips, active, onChange }: Props<Key>) => (
  <>
    {chips.map((chip) => {
      const isActive = active === chip.key
      const pick = () => {
        if (!chip.disabled) onChange(chip.key)
      }
      return (
        <div
          key={chip.key}
          role='button'
          tabIndex={chip.disabled ? -1 : 0}
          aria-pressed={isActive}
          aria-disabled={chip.disabled || undefined}
          title={chip.title}
          onClick={pick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pick() }}
          className={`box-border flex flex-row items-center justify-between rounded-[10px] px-2 w-[calc(50%-4px)] min-w-27.5 max-w-32.5 sm:w-32.5 h-11.5 select-none transition-colors ${chip.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          style={isActive
            ? { background: chip.color }
            : { background: 'transparent', border: `2px solid ${chip.color}` }}
        >
          <span
            className='fs-12 font-normal m-0 leading-none shrink-0'
            style={{ color: isActive ? '#212121' : chip.color }}
          >
            {chip.label}
          </span>
          <span
            className='flex items-center justify-center fs-12 font-normal m-0 leading-none shrink-0 rounded-[5px]'
            style={{
              width: 50,
              height: 30,
              ...(isActive
                ? { background: '#212121', color: chip.color }
                : { background: chip.color, color: '#212121' }),
            }}
          >
            {fmtNumber(chip.count)}
          </span>
        </div>
      )
    })}
  </>
)

export default StatusFilterChips
