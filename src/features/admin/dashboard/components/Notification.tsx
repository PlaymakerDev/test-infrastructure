"use client"
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { TbAlertTriangle } from 'react-icons/tb'
import { useNotificationSummary } from '@/hooks/queries/manage'
import { TAB_TO_TYPE, useDashboardContext } from '../context'
import { useDeptId } from '@/hooks/useDeptId'
import { DashboardBucketType } from '@/types/dashboard/api'
import { useDashboardAnalytic } from '@/hooks/queries/dashboard'
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

const Notification: React.FC<Props> = ({ compact = false }) => {
  const router = useRouter()
  // API
  const { tab } = useDashboardContext()
  const deptId = useDeptId()
  const type = TAB_TO_TYPE[tab]
  const { data: analyticData, isLoading: isAnalyticLoading } = useDashboardAnalytic(deptId, type)

  // "Today" window in Bangkok time — same date on both sides so the backend
  // aggregates a single day. Rebuilt every render is fine: dayjs() is cheap
  // and TanStack Query dedupes by the resulting query key.
  const today = dayjs().format('YYYY-MM-DD')
  const { data, isLoading } = useNotificationSummary({
    start_date: today,
    end_date: today,
  })

  const getCount = useMemo(() => {
    if (isLoading || isAnalyticLoading) return 0
    return Number(analyticData?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0)
  }, [analyticData, isLoading, isAnalyticLoading])

  // The card is anchored to `analytic` (= Incident Detection events). Label
  // "อุปกรณ์ตรวจจับใหม่" already lived on this card as a placeholder — the
  // number now matches. Lighting/VMS source_types are ignored here because
  // Lighting is a noisy heartbeat feed (10k+/day) that would drown the pill.
  const analytic = useMemo(
    () => data?.find((row) => row.source_type === 'analytic'),
    [data]
  )
  const count = analytic?.count ?? 0
  const topLabel = analytic?.most_type?.name

  const onOpen = () => {
    // The pill counts nationwide (backend scopes by JWT — admin sees the
    // whole system), so the target page should too. Hard-code dept_id=0 +
    // scope=all so opening the alert from any dashboard view lands on the
    // full-country incident list for today, not just the bureau the user
    // was already looking at.
    router.push('/admin/incident-detection?dept_id=0&scope=all')
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
    'aria-label': `แจ้งเตือนอุบัติการณ์ ${count} รายการวันนี้ — คลิกเพื่อดูทุกจุดติดตั้ง`,
  }

  if (compact) {
    return (
      <div
        {...clickable}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-pointer hover:brightness-110 transition"
        style={{
          background: "rgba(10,14,26,0.95)",
          border: "1px solid rgba(245,200,66,0.5)",
          backdropFilter: "blur(5px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
        title={`แจ้งเตือนอุบัติการณ์ · ${count.toLocaleString('th-TH')} รายการวันนี้ (ทุกจุด)`}
      >
        <TbAlertTriangle size={16} color="#f5c842" />
        <span className="text-[#f5c842] fs-12 font-bold leading-none tabular-nums">
          {isLoading ? '…' : fmt(count)}
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
          "linear-gradient(135deg, rgba(245,200,66,0.8) 0%, rgba(245,200,66,0.1) 50%, rgba(245,200,66,0.4) 100%)",
      }}
      title="คลิกเพื่อดูอุบัติการณ์ทุกจุดติดตั้งวันนี้"
    >
      <Tooltip
        title={isLoading
          ? 'กำลังโหลด…'
          : count === 0
            ? 'ยังไม่มีอุบัติการณ์วันนี้ (ทุกจุด)'
            : topLabel
              ? `เหตุการณ์เด่นวันนี้: ${topLabel}`
              : 'อุบัติการณ์วันนี้ทุกจุดติดตั้ง'}
      >
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{
            background: "rgba(10,14,26,0.95)",
            borderRadius: 19,
            backdropFilter: "blur(5px)",
          }}
        >
          <div className="rounded-lg p-1.5" style={{ background: "rgba(245,200,66,0.12)" }}>
            <TbAlertTriangle size={24} color="#f5c842" />
          </div>
          <div className="flex-1 leading-tight min-w-0">
            <div className="text-white fs-12 font-medium">แจ้งเตือนอุบัติการณ์</div>
            <div className="text-[#6b7f9a] fs-12 truncate">
              {isLoading
                ? 'กำลังโหลด…'
                : count === 0
                  ? 'ยังไม่มีอุบัติการณ์วันนี้ (ทุกจุด)'
                  : topLabel
                    ? `เหตุการณ์เด่นวันนี้: ${topLabel}`
                    : 'อุบัติการณ์วันนี้ทุกจุดติดตั้ง'}
            </div>
          </div>
          <div className="text-[#f5c842] text-3xl font-bold leading-none tabular-nums shrink-0">
            {(isLoading || isAnalyticLoading) ? '—' : fmt(getCount)}
          </div>
        </div>
      </Tooltip>
    </div>
  )
}

export default React.memo<Props>(Notification)
