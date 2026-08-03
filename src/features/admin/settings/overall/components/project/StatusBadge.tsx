import React from 'react'
import type { WarrantyStatus } from '../../types/project'

interface Props {
  status: WarrantyStatus
}

// Matches Figma pill colours: teal for "ในค้ำ", red for "หมดค้ำ", yellow for
// "ระหว่างส่งมอบ" (delivery/hand-over period).
const STATUS_MAP: Record<WarrantyStatus, { label: string; color: string }> = {
  'in-warranty': { label: 'ในค้ำ', color: '#05F2DB' },
  expired: { label: 'หมดค้ำ', color: '#FF6666' },
  delivering: { label: 'ระหว่างส่งมอบ', color: '#66AEFF' },
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const { label, color } = STATUS_MAP[status]
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-1 rounded-full fs-12 whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}

export default React.memo<Props>(StatusBadge)
