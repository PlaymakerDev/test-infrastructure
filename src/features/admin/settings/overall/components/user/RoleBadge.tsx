import React from 'react'
import type { UserRole } from '../../types/user'

interface Props {
  role: UserRole
}

// admin=red, operator=blue, viewer=gray — matches the palette used by
// StatusBadge on the Project tab.
const ROLE_MAP: Record<UserRole, { label: string; color: string }> = {
  admin: { label: 'ผู้ดูแลระบบ', color: '#FF6666' },
  operator: { label: 'ผู้ปฏิบัติงาน', color: '#66AEFF' },
  viewer: { label: 'ผู้ดูข้อมูล', color: '#9CA3AF' },
}

const RoleBadge: React.FC<Props> = ({ role }) => {
  const { label, color } = ROLE_MAP[role]
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-1 rounded-full text-xs whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}

export default React.memo<Props>(RoleBadge)
