"use client"
import { Skeleton } from "antd"
import React from "react"
import { TbAlertTriangle, TbTrendingDown, TbTrendingUp } from "react-icons/tb"
import type { Insight } from "@/types/chat"
import { useSmartSearchContext } from "../context"
import { useInsights } from "../hooks/useInsights"

// Build a concrete follow-up question (with real values) so the model can act
// on it without ambiguity — clicking an insight drills into it via /ask.
const insightToQuestion = (insight: Insight): string => {
  if (insight.type === "mover" && insight.road_name) {
    const dir = insight.direction === "down" ? "ลดลง" : "เพิ่มขึ้น"
    return `ทำไมถนน${insight.road_name} ${insight.metric}${dir} ${insight.pct_change}%`
  }
  if (insight.type === "status") {
    return `ขอรายละเอียด${insight.metric}ที่ออฟไลน์ แยกตามพื้นที่`
  }
  return insight.summary
}

const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const { send, isStreaming } = useSmartSearchContext()

  const isStatus = insight.type === "status"
  const isUp = insight.direction === "up"
  const accent = isStatus
    ? "border-orange-500/50 text-orange-400"
    : isUp
      ? "border-emerald-500/50 text-emerald-400"
      : "border-red-500/50 text-red-400"
  const Icon = isStatus ? TbAlertTriangle : isUp ? TbTrendingUp : TbTrendingDown

  return (
    <button
      type="button"
      disabled={isStreaming}
      onClick={() => send(insightToQuestion(insight))}
      className={`text-left w-full rounded-lg border bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed ${accent}`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <Icon size={16} className="shrink-0" />
        <span className="fs-12 font-medium truncate">{insight.metric}</span>
        {!isStatus && (
          <span className="fs-12 ml-auto shrink-0">
            {isUp ? "▲" : "▼"} {Math.abs(insight.pct_change)}%
          </span>
        )}
      </div>
      <p className="fs-12 text-white/60 leading-snug line-clamp-2">
        {insight.summary}
      </p>
    </button>
  )
}

const InsightsPanel: React.FC = () => {
  const { insights, loading } = useInsights()

  if (loading) {
    return (
      <div className="w-full max-w-2xl">
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      </div>
    )
  }
  if (!insights.length) return null

  // Status (offline) alerts first, then traffic movers — capped so the empty
  // state stays scannable (the full set is reachable by asking).
  const ordered = [...insights]
    .sort((a, b) => (a.type === "status" && b.type !== "status" ? -1 : 0))
    .slice(0, 4)

  return (
    <div className="w-full max-w-2xl">
      <p className="fs-12 text-(--yellow) mb-2 text-left">อินไซต์ล่าสุด</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ordered.map((insight, i) => (
          <InsightCard key={`${insight.metric}-${i}`} insight={insight} />
        ))}
      </div>
    </div>
  )
}

export default React.memo(InsightsPanel)
