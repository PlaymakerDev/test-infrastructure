"use client"
import React from 'react'

interface Props {
  text: string
  color: string
  icon?: React.ReactNode
}

/** Outline pill — same pattern as `TableTrafficLighting` in overall. */
const Pill: React.FC<Props> = ({ text, color, icon }) => (
  <span
    className='inline-flex items-center gap-1 px-3 py-1 rounded-full fs-12 whitespace-nowrap'
    style={{ border: `1px solid ${color}`, color }}
  >
    {icon}
    {text}
  </span>
)

export default React.memo(Pill)
