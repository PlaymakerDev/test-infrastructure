"use client"
import { Skeleton } from "antd"
import React, { useEffect, useState } from "react"
import { TbLayoutDashboard, TbRefresh, TbTargetArrow, TbX } from "react-icons/tb"
import { askOnce } from "@/services/routes/ChatService"
import type { AskResult } from "@/types/chat"
import { useSmartSearchContext } from "../context"
import type { DashboardPin } from "../hooks/useDashboardPins"

const REFRESH_MS = 60_000

interface CardState {
  loading: boolean
  result?: AskResult
  error?: boolean
  at?: Date
}

const PinnedCard: React.FC<{ pin: DashboardPin; onRemove: () => void }> = ({
  pin,
  onRemove,
}) => {
  const [state, setState] = useState<CardState>({ loading: true })
  const { question, mode } = pin

  // Fetch on mount, then poll so the card stays fresh (monitoring). setState
  // only lands in .then/.catch (never synchronously in the effect body).
  useEffect(() => {
    let alive = true
    const tick = () =>
      askOnce(question, mode)
        .then((result) => {
          if (alive) setState({ loading: false, result, at: new Date() })
        })
        .catch(() => {
          if (alive) setState({ loading: false, error: true, at: new Date() })
        })
    void tick()
    const id = setInterval(tick, REFRESH_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [question, mode])

  // Manual refresh — in an event handler, so a synchronous setState is fine.
  const refresh = () => {
    setState((s) => ({ ...s, loading: true }))
    askOnce(question, mode)
      .then((result) => setState({ loading: false, result, at: new Date() }))
      .catch(() => setState({ loading: false, error: true, at: new Date() }))
  }

  const { loading, result, error, at } = state
  const metricValue =
    result?.chart?.type === "metric" ? result.chart.value : undefined

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-(--dark-black) p-4 min-h-[140px]">
      <div className="flex items-start gap-2">
        <p className="flex-1 min-w-0 fs-14 text-white/90 line-clamp-2" title={pin.question}>
          {pin.question}
        </p>
        {pin.mode === "accurate" && (
          <TbTargetArrow className="shrink-0 text-(--yellow) mt-0.5" size={14} />
        )}
        <button
          type="button"
          aria-label="เอาออก"
          onClick={onRemove}
          className="shrink-0 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          <TbX size={15} />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {loading && !result ? (
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
        ) : error ? (
          <p className="fs-12 text-red-400">โหลดข้อมูลไม่สำเร็จ</p>
        ) : (
          <>
            {metricValue !== undefined && (
              <p className="text-2xl font-bold text-(--yellow) leading-tight mb-1">
                {typeof metricValue === "number"
                  ? metricValue.toLocaleString("en-US")
                  : metricValue}
              </p>
            )}
            <p className="fs-12 text-white/60 leading-snug line-clamp-4">
              {result?.answer}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between fs-12 text-white/35">
        <span>
          {at
            ? `อัปเดต ${at.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`
            : ""}
        </span>
        <button
          type="button"
          aria-label="รีเฟรช"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <TbRefresh size={13} className={loading ? "animate-spin" : ""} /> รีเฟรช
        </button>
      </div>
    </div>
  )
}

// Live monitoring dashboard (Future #1) — pinned questions re-run on a poll.
const PinnedDashboard: React.FC = () => {
  const { dashboardPins, unpinQuestion } = useSmartSearchContext()

  if (dashboardPins.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
        <TbLayoutDashboard className="text-white/30" size={56} />
        <p className="text-white/70">ยังไม่มีการ์ดที่ปักหมุด</p>
        <p className="fs-14 text-white/45 max-w-md">
          กดปุ่มปักหมุด (📌) ใต้คำตอบในแชต เพื่อนำผลลัพธ์มาติดตามแบบเรียลไทม์ที่นี่
          — การ์ดจะรีเฟรชอัตโนมัติทุก 1 นาที
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-2 pb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {dashboardPins.map((pin) => (
          <PinnedCard
            key={pin.id}
            pin={pin}
            onRemove={() => unpinQuestion(pin.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default React.memo(PinnedDashboard)
