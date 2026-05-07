"use client"
import React, { useCallback } from 'react'
import { TbCamera, TbMapPin, TbRoad } from "react-icons/tb"

interface CardProps {
  icon: React.ReactNode
  value: number
  label: string
}

interface Props {}

const STATS: CardProps[] = [
  { icon: <TbCamera size={36} />, value: 1255, label: "กล้องทั้งหมด" },
  { icon: <TbMapPin size={36} />, value: 517, label: "จุดติดตั้ง" },
  { icon: <TbRoad size={36} />, value: 274, label: "สายทาง" },
]

const StatusChart: React.FC<Props> = () => {
  const renderStatCard = useCallback((card: CardProps) => {
    const { icon, value, label } = card
    return (
      <div
        className="flex-1 flex flex-col items-center gap-3 py-5 px-3"
        style={{
          background: "rgba(184,205,181,0.2)",
          borderRadius: 20,
          backdropFilter: "blur(5px)",
        }}
      >
        <div
          className="flex items-center justify-center text-(--yellow)"
          style={{ width: 80, height: 80, background: "#191919", borderRadius: 10 }}
        >
          {icon}
        </div>
        <div className="text-3xl font-bold" style={{ color: "#FCD116" }}>
          {value.toLocaleString()}
        </div>
        <div className="text-sm" style={{ color: "#FCD116" }}>
          {label}
        </div>
      </div>
    )
  }, [])

  return (
    <div className="flex gap-2">
      {STATS.map((stat) => (
        <React.Fragment key={stat.label}>{renderStatCard(stat)}</React.Fragment>
      ))}
    </div>
  )
}

export default React.memo<Props>(StatusChart)
