import React from 'react'

interface Props {
  /** Free-form role slug from the server. Known slugs get a themed color +
   *  Thai label; unknown values fall through to a neutral gray pill and show
   *  the raw slug so we don't hide unexpected data. */
  role: string
}

// The system issues only `admin` and `user`. `operator`/`viewer` are LEGACY
// slugs kept here for display so pre-existing rows don't render as raw text —
// they are deliberately absent from the create form and the filter dropdown.
const KNOWN_ROLES: Record<string, { label: string; color: string }> = {
  admin: { label: 'ผู้ดูแลระบบ', color: '#FF6666' },
  user: { label: 'ผู้ใช้งาน', color: '#66AEFF' },
  operator: { label: 'ผู้ปฏิบัติงาน', color: '#9CA3AF' },
  viewer: { label: 'ผู้ดูข้อมูล', color: '#9CA3AF' },
}

const FALLBACK_COLOR = '#9CA3AF'

const RoleBadge: React.FC<Props> = ({ role }) => {
  const known = KNOWN_ROLES[role]
  const label = known?.label ?? role ?? '-'
  const color = known?.color ?? FALLBACK_COLOR
  return (
    <span
      className='inline-flex items-center justify-center px-3 py-1 rounded-full fs-12 whitespace-nowrap'
      style={{ border: `1px solid ${color}`, color }}
    >
      {label}
    </span>
  )
}

export default React.memo<Props>(RoleBadge)
