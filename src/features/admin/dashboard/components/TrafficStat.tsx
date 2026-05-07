"use client"
import React from 'react'
import { TbClock } from 'react-icons/tb'

interface Props {}

const TrafficStat: React.FC<Props> = () => {
  return (
    <div
      className="p-4"
      style={{
        background: "rgba(0,0,0,0.55)",
        borderRadius: 20,
        backdropFilter: "blur(5px)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TbClock size={30} color="#FCD116" />
        <span className="text-sm font-medium" style={{ color: "#FCD116" }}>
          ช่วงเวลาปริมาณการจราจรสูงสุดวันนี้
        </span>
      </div>
      <div
        className="mb-3"
        style={{
          height: 1,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(252,209,22,0.4) 0, rgba(252,209,22,0.4) 6px, transparent 6px, transparent 14px)",
        }}
      />
      <div className="grid grid-cols-3 gap-1">
        <span className="text-[14px]" style={{ color: "#6b7f9a" }}>ช่วงเวลา</span>
        <span className="text-[14px] text-center" style={{ color: "#6b7f9a" }}>คัน</span>
        <span className="text-[14px] text-right" style={{ color: "#6b7f9a" }}>PCU</span>
        <span className="text-[14px] font-medium mt-1 tabular-nums text-white">08:00</span>
        <span className="text-[14px] font-medium mt-1 text-center tabular-nums text-white">
          48,293
        </span>
        <span className="text-[14px] font-medium mt-1 text-right tabular-nums text-white">
          42,182
        </span>
      </div>
    </div>
  )
}

export default React.memo<Props>(TrafficStat)
