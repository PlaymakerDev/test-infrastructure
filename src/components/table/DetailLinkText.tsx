"use client"
import React from 'react'

interface DetailLinkTextProps {
  /** Navigate to the detail page (caller owns the feature-specific route). */
  onClick: () => void
  children: React.ReactNode
  /** Extra classes layered after the base. Defaults to white text. */
  className?: string
}

/**
 * Clickable text cell that navigates to a detail page. Provides the shared
 * "hover → yellow + underline" affordance so the click-to-detail interaction
 * is IDENTICAL across every overall list table (cctv / traffic-signal /
 * incident-detection / traffic-volume). Use it for the รหัสสายทาง /
 * ชื่อโครงการ / จุดติดตั้ง columns.
 *
 * Keyboard accessible (Enter / Space) and announced as a link.
 */
const DetailLinkText: React.FC<DetailLinkTextProps> = ({ onClick, children, className }) => (
  <span
    role='link'
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    }}
    className={`detail-link cursor-pointer transition-colors hover:text-(--yellow) hover:underline ${className ?? 'text-white'}`}
  >
    {children}
  </span>
)

export default React.memo(DetailLinkText)
