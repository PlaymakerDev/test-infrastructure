"use client"
import React from 'react'
import { Tooltip } from 'antd'
import { statusMeta } from '../constants/vmsStatus'

interface Props {
  status: number | null | undefined
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
  tooltip?: React.ReactNode
}

// Colored status pill. Consistent across every VMS surface in the app so
// operators associate the same colour with the same state.
const StatusPill: React.FC<Props> = React.memo(function StatusPill({
  status,
  size = 'md',
  showLabel = true,
  className = '',
  tooltip,
}) {
  const meta = statusMeta(status)
  const height = size === 'sm' ? 22 : 28
  const padding = size === 'sm' ? '0 8px' : '0 12px'
  const fontSize = size === 'sm' ? 11 : 13
  const dot = size === 'sm' ? 6 : 8

  const content = (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height,
        padding,
        borderRadius: 999,
        color: meta.color,
        background: `${meta.color}22`,
        border: `1px solid ${meta.color}55`,
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: dot,
          height: dot,
          borderRadius: '50%',
          background: meta.color,
          boxShadow: `0 0 0 2px ${meta.ring}33`,
        }}
      />
      {showLabel ? meta.label : null}
    </span>
  )
  return tooltip !== undefined ? <Tooltip title={tooltip}>{content}</Tooltip> : content
})

export default StatusPill
