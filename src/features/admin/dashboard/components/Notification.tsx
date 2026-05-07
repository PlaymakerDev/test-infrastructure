"use client"
import React from 'react'
import { TbAlertTriangle } from 'react-icons/tb'

interface Props {
  count?: number
  title?: string
  description?: string
  /**
   * Compact pill (icon + count only) — for tight spaces like the mobile map overlay.
   * Default false = full card with title + description (used in desktop right panel).
   */
  compact?: boolean
}

const Notification: React.FC<Props> = (props) => {
  const {
    count = 74,
    title = "แจ้งเตือนด่วน",
    description = "อุปกรณ์ตรวจจับใหม่",
    compact = false,
  } = props

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
        style={{
          background: "rgba(10,14,26,0.95)",
          border: "1px solid rgba(245,200,66,0.5)",
          backdropFilter: "blur(5px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
        title={`${title} · ${description}`}
      >
        <TbAlertTriangle size={16} color="#f5c842" />
        <span className="text-[#f5c842] text-sm font-bold leading-none tabular-nums">
          {count}
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 1.5,
        borderRadius: 20,
        background:
          "linear-gradient(135deg, rgba(245,200,66,0.8) 0%, rgba(245,200,66,0.1) 50%, rgba(245,200,66,0.4) 100%)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: "rgba(10,14,26,0.95)",
          borderRadius: 19,
          backdropFilter: "blur(5px)",
        }}
      >
        <div className="rounded-lg p-2" style={{ background: "rgba(245,200,66,0.12)" }}>
          <TbAlertTriangle size={30} color="#f5c842" />
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-white text-sm font-medium">{title}</div>
          <div className="text-[#6b7f9a] text-[10px]">{description}</div>
        </div>
        <div className="text-[#f5c842] text-3xl font-bold leading-none">{count}</div>
      </div>
    </div>
  )
}

export default React.memo<Props>(Notification)
