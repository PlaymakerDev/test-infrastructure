import React from 'react'
import type { UserStatus } from '../../types/user'

interface Props {
  status: UserStatus
}

// Active = teal (matches "in-warranty" from Project), inactive = gray
const STATUS_MAP: Record<UserStatus, { label: string; color: string }> = {
  active: { label: 'ใช้งาน', color: '#05F2DB' },
  inactive: { label: 'ปิดใช้งาน', color: '#9CA3AF' },
}

const StatusPill: React.FC<Props> = ({ status }) => {
  const { label, color } = STATUS_MAP[status]
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}

export default React.memo<Props>(StatusPill)
