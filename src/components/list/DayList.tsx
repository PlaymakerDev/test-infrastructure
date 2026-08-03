'use client'
import { Tooltip } from 'antd'
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
  getTooltip?: (day: number) => React.ReactNode
}

const DayList: React.FC<DayListProps> = ({
  value = [],
  onChange,
  label,
  disabled = false,
  disabledDate,
  className,
  getTooltip,
}) => {
  const toggle = (day: number) => {
    if (disabled || disabledDate?.(day) || !onChange) return
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }

  return (
    <div className={className}>
      {label && (
        <p className="text-(--yellow) mb-2 fs-12">{label}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const active = value.includes(d.value)
          const isDayDisabled = disabled || disabledDate?.(d.value)
          const button = (
            <button
              key={d.value}
              type="button"
              onClick={() => toggle(d.value)}
              disabled={isDayDisabled}
              className={[
                'min-w-10 rounded px-3 py-1.5 fs-12 font-medium transition-colors',
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

          const tooltip = getTooltip?.(d.value)
          if (!tooltip) return button

          // wrap in a span so the tooltip still fires when the button itself is disabled
          return (
            <Tooltip key={d.value} title={tooltip}>
              <span>{button}</span>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

export default DayList
