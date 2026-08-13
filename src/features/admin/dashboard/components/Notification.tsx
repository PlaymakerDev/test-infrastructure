"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { TbAlertTriangle } from 'react-icons/tb'
import { useNotificationSummary } from '@/hooks/queries/manage'
import { TAB_TO_TYPE, useDashboardContext } from '../context'
import { useDeptId } from '@/hooks/useDeptId'
import { useRoadId } from '@/hooks/useRoadId'
import { useDashboardAnalytic } from '@/hooks/queries/dashboard'
import { scopeQuerySuffix } from '@/services/routes/scopeParam'
import { Tooltip } from 'antd'

interface Props {
  /**
   * Compact pill (icon + count only) — for tight spaces like the mobile map overlay.
   * Default false = full card with title + description (used in desktop right panel).
   */
  compact?: boolean
}

/** Human-friendly number formatter for the counter. 999 → "999", 1234 → "1.2k",
 *  12345 → "12k". Keeps the pill width predictable no matter how noisy the day
 *  gets (e.g. Lighting `line_check` heartbeats hit ~11k/day). */
const fmt = (n: number): string => {
  if (n < 1000) return n.toLocaleString('th-TH')
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n / 1000)}k`
}

/** ช่วงเวลาตามแท็บ — ใช้ประกอบข้อความให้ตรงกับตัวเลขที่โชว์เสมอ. */
const SCOPE_WORD: Record<string, string> = {
  'วันนี้': 'วันนี้',
  'เดือน': 'เดือนนี้',
  'ปี': 'ปีนี้',
}

/**
 * ONE source of truth (2026-08-13 rework): every number/label on BOTH variants
 * comes from the same dept+tab+road-scoped `analytic` query. The old version
 * mixed it with the nationwide/today notifications summary — the big number
 * said "dept X, whole year" while the caption beside it said "today, ทุกจุด",
 * the mobile pill showed a different number than the desktop card, and the
 * click always landed on dept 0. The summary now ONLY supplies the
 * "เหตุการณ์เด่นวันนี้" flavour line, and ONLY when its scope truly matches
 * what's displayed (nationwide + วันนี้ + no road filter).
 */
const Notification: React.FC<Props> = ({ compact = false }) => {
  const router = useRouter()
  // API
  const { tab } = useDashboardContext()
  const deptId = useDeptId()
  const roadId = useRoadId()
  const type = TAB_TO_TYPE[tab]
  const {
    data: analyticData,
    isLoading: isAnalyticLoading,
    isError: isAnalyticError,
  } = useDashboardAnalytic(deptId, type, roadId)

  // "Today" window in Bangkok time — same date on both sides so the backend
  // aggregates a single day. Rebuilt every render is fine: dayjs() is cheap
  // and TanStack Query dedupes by the resulting query key.
  const today = dayjs().format('YYYY-MM-DD')
  const { data: summaryData } = useNotificationSummary({
    start_date: today,
    end_date: today,
  })

  // Displayed count — dept + tab + road scoped, same value for pill and card.
  const count = useMemo(
    () => Number(analyticData?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0),
    [analyticData],
  )

  // "เหตุการณ์เด่นวันนี้" comes from the nationwide/today summary (analytic
  // source_type only — Lighting is a 10k+/day heartbeat feed that would drown
  // the line). Shown ONLY when the displayed number covers the same scope.
  const topLabel = useMemo(
    () => summaryData?.find((row) => row.source_type === 'analytic')?.most_type?.name,
    [summaryData],
  )
  const scopeWord = SCOPE_WORD[tab] ?? 'วันนี้'
  const summaryMatchesScope = deptId === '0' && tab === 'วันนี้' && !roadId

  const caption = isAnalyticLoading
    ? 'กำลังโหลด…'
    : isAnalyticError
      ? 'โหลดข้อมูลไม่สำเร็จ'
      : count === 0
        ? `ยังไม่มีอุบัติการณ์${scopeWord}`
        : summaryMatchesScope && topLabel
          ? `เหตุการณ์เด่นวันนี้: ${topLabel}`
          : `อุบัติการณ์${scopeWord}`
  const countText = isAnalyticLoading || isAnalyticError ? '—' : fmt(count)

  const onOpen = () => {
    // Land on the SAME scope the number describes — the live dept from the
    // map (override context) + the page's scope=all when present. The old
    // hardcoded dept_id=0 sent a dept-scoped count to the nationwide list.
    router.push(`/admin/incident-detection?dept_id=${deptId}${scopeQuerySuffix()}`)
  }

  // Common accessibility affordances — role + keyboard for both variants.
  const clickable = {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen()
      }
    },
    'aria-label': `แจ้งเตือนอุบัติการณ์ ${count.toLocaleString('th-TH')} รายการ${scopeWord} — คลิกเพื่อดูรายการ`,
  }

  if (compact) {
    return (
      <div
        {...clickable}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-pointer hover:brightness-110 transition"
        style={{
          background: "rgba(10,14,26,0.95)",
          border: "1px solid rgba(252,209,22,0.5)",
          backdropFilter: "blur(5px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
        title={`แจ้งเตือนอุบัติการณ์ · ${count.toLocaleString('th-TH')} รายการ${scopeWord}`}
      >
        <TbAlertTriangle size={16} color="#FCD116" />
        <span className="text-(--yellow) fs-12 font-bold leading-none tabular-nums">
          {countText === '—' && isAnalyticLoading ? '…' : countText}
        </span>
      </div>
    )
  }

  return (
    <div
      {...clickable}
      className="cursor-pointer hover:brightness-110 transition"
      style={{
        padding: 1.5,
        borderRadius: 20,
        background:
          "linear-gradient(135deg, rgba(252,209,22,0.8) 0%, rgba(252,209,22,0.1) 50%, rgba(252,209,22,0.4) 100%)",
      }}
      title={`คลิกเพื่อดูรายการอุบัติการณ์${scopeWord}`}
    >
      <Tooltip title={caption}>
        {/* py-4.5 = 18px (was py-2 = 8px) — card is 20px taller per design
          * 2026-08-10; VehicleRatioChart's donut shrank by the same 20px so the
          * right rail still fits the viewport without scrolling. */}
        <div
          className="flex items-center gap-3 px-4 py-4.5"
          style={{
            background: "rgba(10,14,26,0.95)",
            borderRadius: 19,
            backdropFilter: "blur(5px)",
          }}
        >
          <div className="rounded-lg p-1.5" style={{ background: "rgba(252,209,22,0.12)" }}>
            <TbAlertTriangle size={24} color="#FCD116" />
          </div>
          <div className="flex-1 leading-tight min-w-0">
            <div className="text-white fs-12 font-medium">แจ้งเตือนอุบัติการณ์</div>
            <div className="text-[#6b7f9a] fs-12 truncate">{caption}</div>
          </div>
          <div className="text-(--yellow) text-3xl font-bold leading-none tabular-nums shrink-0">
            {countText}
          </div>
        </div>
      </Tooltip>
    </div>
  )
}

export default React.memo<Props>(Notification)
