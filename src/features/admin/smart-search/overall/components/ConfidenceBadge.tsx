"use client"
import { Tooltip } from "antd"
import React from "react"
import { TbAlertTriangle, TbCircleCheck, TbInfoCircle } from "react-icons/tb"
import type { Confidence } from "@/types/chat"

interface Props {
  confidence: Confidence
}

const CONFIG: Record<
  Confidence,
  { label: string; className: string; icon: React.ReactNode; tooltip?: string }
> = {
  high: {
    label: "ความเชื่อมั่นสูง",
    className: "border-emerald-500 text-emerald-400",
    icon: <TbCircleCheck />,
  },
  medium: {
    label: "ความเชื่อมั่นปานกลาง",
    className: "border-(--yellow) text-(--yellow)",
    icon: <TbInfoCircle />,
    tooltip: "ผลอาจต้องตรวจสอบ ลองถามให้เจาะจงขึ้นเพื่อความแม่นยำ",
  },
  low: {
    label: "ความเชื่อมั่นต่ำ",
    className: "border-orange-500 text-orange-400",
    icon: <TbAlertTriangle />,
    tooltip: "ผลอาจไม่ตรง ลองถามให้เจาะจงขึ้น",
  },
}

const ConfidenceBadge: React.FC<Props> = ({ confidence }) => {
  const config = CONFIG[confidence]

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full fs-12 whitespace-nowrap border ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )

  return config.tooltip ? (
    <Tooltip title={config.tooltip}>{badge}</Tooltip>
  ) : (
    badge
  )
}

export default React.memo(ConfidenceBadge)
