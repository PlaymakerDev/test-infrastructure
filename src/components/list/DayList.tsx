'use client'
import React from 'react'

const DAYS = [
  { label: 'จ.', value: 1 },
  { label: 'อ.', value: 2 },
  { label: 'พ.', value: 3 },
  { label: 'พฤ.', value: 4 },
  { label: 'ศ.', value: 5 },
  { label: 'ส.', value: 6 },
  { label: 'อา.', value: 7 },
]

export interface DayListProps {
  value?: number[]
  onChange?: (days: number[]) => void
  label?: string
  disabled?: boolean
  disabledDate?: (day: number) => boolean
  className?: string
}

const DayList: React.FC<DayListProps> = ({
  value = [],
  onChange,
  label,
  disabled = false,
  disabledDate,
  className,
}) => {
  const toggle = (day: number) => {
    if (disabled || disabledDate?.(day) || !onChange) return
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }

  return (
    <div className={className}>
      {label && (
        <p className="text-(--yellow) mb-2 text-sm">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const active = value.includes(d.value)
          const isDayDisabled = disabled || disabledDate?.(d.value)
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              disabled={isDayDisabled}
              className={[
                'min-w-10 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                isDayDisabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer',
                active
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600',
              ].join(' ')}
            >
              {d.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DayList
