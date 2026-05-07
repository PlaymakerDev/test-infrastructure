"use client"
import React from 'react'
import { TbAlertTriangle } from 'react-icons/tb'

interface Props {
  count?: number
  title?: string
  description?: string
}

const Notification: React.FC<Props> = (props) => {
  const { count = 74, title = "แจ้งเตือนด่วน", description = "อุปกรณ์ตรวจจับใหม่" } = props

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
