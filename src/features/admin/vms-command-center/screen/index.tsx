"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { App, Tooltip } from 'antd'
import { TbAlertTriangle, TbClockPause } from 'react-icons/tb'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { BureauSelection } from '@/types/control-vms/bureau'
import TitleSection from '@/components/section/TitleSection'
import ScopePicker from '../components/ScopePicker'
import Composer from '../components/Composer'
import LiveMonitor from '../components/LiveMonitor'
import GlobalHistoryTable from '../components/GlobalHistoryTable'
import SignDetailModal from '../components/SignDetailModal'
import MediaLibraryTab from '../components/MediaLibraryTab'
import StatusTable from '../components/StatusTable'
import { ControlVMSProvider } from '@/features/admin/control-vms/overall/context'
import DisplaySection from '@/features/admin/control-vms/overall/components/DisplaySection'
import StatusSection from '@/features/admin/control-vms/overall/components/StatusSection'


const emptySelection: BureauSelection = {
  keys: [],
  bureaus: [],
  states: [],
  routes: [],
  signs: [],
}

// Order reflects the operator workflow: primary actions first (dispatch, media
// prep, scheduling), then observation (status, history), then rarely-touched
// device config (vmsinfo) last. `vmsinfo` was previously named `status`; the
// current `status` key now routes to the "สถานะการแสดงผล" tab that used to
// live inside the (now-removed) legacy screen.
const VALID_TABS = ['dispatch', 'media', 'display', 'status', 'history', 'vmsinfo'] as const
type TabKey = (typeof VALID_TABS)[number]

// Tab labels, in workflow order — fed to the shared TitleSection's SwapButton
// so this screen wears the same yellow-pill tab bar as every other admin menu
// (statistics is the closest sibling), instead of a bespoke antd <Tabs>.
const TAB_OPTIONS: { label: string; value: TabKey }[] = [
  { label: 'การสั่งงาน', value: 'dispatch' },
  { label: 'คลังสื่อ', value: 'media' },
  { label: 'กำหนดการแสดงผล', value: 'display' },
  { label: 'สถานะการแสดงผล', value: 'status' },
  { label: 'ประวัติสั่งงานทั้งหมด', value: 'history' },
  { label: 'ข้อมูลป้าย VMS', value: 'vmsinfo' },
]

// Lightweight "ขั้นที่ N" wayfinding label rendered above each dispatch panel.
// Keeps each panel's own internal header intact (no duplicate chrome) while
// giving the dispatch flow a clear 1 → 2 → 3 reading order.
const StepLabel: React.FC<{ n: number; title: string; hint?: string }> = ({ n, title, hint }) => (
  <div className="flex items-center gap-2 mb-2 px-0.5">
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-(--yellow) text-(--dark-black) fs-12 font-bold shrink-0">
      {n}
    </span>
    <span className="text-(--yellow) font-medium">{title}</span>
    {hint && <span className="fs-12 text-white/40 hidden sm:inline">· {hint}</span>}
  </div>
)

const VMSCommandCenterScreen: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = (VALID_TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as TabKey)
    : 'dispatch'

  // Track which tabs have been opened at least once. Panels mount lazily on
  // first visit, then stay mounted (hidden via CSS) — same as the previous
  // antd <Tabs> default (destroy-on-hide off). Operators switch between
  // dispatch ↔ media ↔ status constantly; unmounting would reset the
  // LiveMonitor countdown, ScopePicker scroll, and MediaLibrary filters.
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(() => new Set([activeTab]))

  const changeTab = useCallback(
    (key: string) => {
      setVisitedTabs((prev) => (prev.has(key as TabKey) ? prev : new Set(prev).add(key as TabKey)))
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', key)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const [selection, setSelection] = useState<BureauSelection>(emptySelection)
  const [detailVmsId, setDetailVmsId] = useState<number | null>(null)
  const openDetail = useCallback((id: number) => setDetailVmsId(id), [])
  const closeDetail = useCallback(() => setDetailVmsId(null), [])

  // Split eligibility into three buckets. selection.signs (BureauSign =
  // departments API's Solution type) now carries is_controllable/is_centralized/
  // is_reported directly from the backend — same tbl_vms_screen_info join used
  // by /vms/screen-info and /vms/command-center/monitor, so no separate fetch or
  // client-side merge is needed here anymore; every VMS endpoint in this app
  // agrees on eligibility by construction.
  //   immediate: is_centralized && is_controllable
  //              → dispatched now
  //   queued:    is_centralized && is_reported && !is_controllable
  //              → agent has checked in before, just currently offline/old
  //              version — queue-ahead is a safe bet, it'll likely reconnect
  //   excluded:  is_centralized === false (operator opted the sign out in the
  //              ข้อมูลป้าย VMS tab) OR is_reported === false (agent has NEVER
  //              checked in — queue-ahead would be misleading, this needs a
  //              technician to install/start the agent, not "just wait")
  const { immediateIds, queuedIds } = useMemo(() => {
    const immediate = new Set<number>()
    const queued = new Set<number>()
    for (const s of selection.signs) {
      if (s.is_centralized === false || !s.is_reported) continue  // excluded
      if (s.is_controllable) {
        immediate.add(s.vms_id)
      } else {
        queued.add(s.vms_id)
      }
    }
    return { immediateIds: immediate, queuedIds: queued }
  }, [selection.signs])

  // Full set from ScopePicker
  const allSelectedIds = useMemo(() => selection.signs.map((s) => s.vms_id), [selection.signs])
  // What Composer sends — union of immediate + queued (queue-ahead supported).
  const vmsIds = useMemo(
    () => allSelectedIds.filter((id) => immediateIds.has(id) || queuedIds.has(id)),
    [allSelectedIds, immediateIds, queuedIds]
  )
  const queuedCount = queuedIds.size
  const excludedCount = allSelectedIds.length - vmsIds.length

  // Excluded (ไม่รองรับ) sign objects — passed to LiveMonitor so it can render
  // placeholder cards for them (they aren't in the /monitor payload because
  // Composer never sends to them).
  const excludedSelectedSigns = useMemo(
    () => selection.signs.filter((s) => !immediateIds.has(s.vms_id) && !queuedIds.has(s.vms_id)),
    [selection.signs, immediateIds, queuedIds]
  )

  const targetSummary = useMemo(() => {
    if (selection.signs.length === 0) return 'ยังไม่ได้เลือกป้าย'
    const parts: string[] = []
    if (selection.bureaus.length) parts.push(`${selection.bureaus.length} สำนัก`)
    if (selection.states.length) parts.push(`${selection.states.length} แขวง`)
    if (selection.routes.length) parts.push(`${selection.routes.length} สายทาง`)
    parts.push(`${selection.signs.length} ป้าย`)
    if (queuedCount > 0) parts.push(`(queue ${queuedCount} ป้าย offline)`)
    if (excludedCount > 0) parts.push(`(ข้าม ${excludedCount} ป้ายที่ไม่รองรับ)`)
    return `เป้าหมาย: ${parts.join(' / ')}`
  }, [selection, excludedCount, queuedCount])

  // ── Dispatch tab — 3-column workspace, center-form driven ────────────────
  // ① เลือกป้าย (pick, fixed narrow) · ② เขียนคำสั่ง (compose, widest — the
  // FOCUS column) · ③ จอมอนิเตอร์สด (real-time monitor, right-hand column).
  //
  // The MIDDLE column (Composer) drives the whole row's height — no per-column
  // scrollbar on it. The dispatch grid is `min-h-full`, so at 100% zoom the
  // panels fill the viewport even when the form is short; when the form grows
  // taller than the viewport the row grows with it and the page's main scroll
  // region (the parent <section>) scrolls the whole thing.
  //
  // The two side columns are pinned to the middle column's height ONLY at xl+:
  // their box is `xl:relative xl:flex-1` and the panel lives in an
  // `xl:absolute xl:inset-0` child, so the side content contributes NO intrinsic
  // height to the grid track — only the middle column does. `items-stretch`
  // (grid default) then stretches both sides to exactly the middle column's
  // height, and each side scrolls internally if its content overflows.
  //
  // Below xl the columns STACK into one column. There the same side box drops
  // its absolute pinning and renders at natural height in normal flow, so the
  // whole stack shares the single page scrollbar (no per-form scrollbars) —
  // keeping the narrow-screen layout consistent with the desktop one.
  const sideCol = 'flex flex-col min-w-0'
  const sideBox = 'rounded-xl bg-(--dark-black) overflow-hidden xl:relative xl:flex-1 xl:min-h-0'
  const dispatchTab = (
    <div className="grid min-h-full grid-cols-1 xl:grid-cols-[minmax(300px,360px)_minmax(0,1.25fr)_minmax(0,1fr)] gap-5 items-stretch pb-2">
      {/* Step 1 — pick signs (xl: pinned to center height; stacked: natural) */}
      <div className={sideCol}>
        <StepLabel n={1} title="เลือกป้าย VMS" hint="สำนัก / แขวง / สายทาง หรือทีละป้าย" />
        <div className={sideBox}>
          <div className="flex flex-col xl:absolute xl:inset-0">
            <ScopePicker
              onSelectionChange={setSelection}
              selection={selection}
              onViewSign={openDetail}
            />
            {queuedCount > 0 && (
              <Tooltip title="ป้ายที่ยัง offline จะเก็บคำสั่งไว้ในระบบ — เมื่อ agent กลับมาออนไลน์จะ sync แล้วเริ่มเล่นตามช่วงเวลา/วันที่ที่กำหนด">
                <div className="px-3 py-2 border-t border-white/10 fs-12 text-(--default-blue) flex items-start gap-1.5">
                  <TbClockPause className="fs-14 shrink-0 mt-0.5" />
                  <span>{queuedCount} ป้าย queue-ahead (จะรับคำสั่งเมื่อกลับมาออนไลน์)</span>
                </div>
              </Tooltip>
            )}
            {excludedCount > 0 && (
              <Tooltip title="ป้ายที่ agent ยังไม่เคย provision เลย หรือถูกถอดจากกลุ่มควบคุมรวม — ต้องมีคนไปตั้งค่า/ติดตั้งก่อน ตรวจสอบและเปิดใช้งานได้ในแท็บ 'ข้อมูลป้าย VMS'">
                <div className="px-3 py-2 border-t border-white/10 fs-12 text-(--yellow) flex items-start gap-1.5">
                  <TbAlertTriangle className="fs-14 shrink-0 mt-0.5" />
                  <span>ข้าม {excludedCount} ป้ายที่ไม่รองรับ</span>
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Step 2 — compose command (widest column, the FOCUS column). Its box
          `flex-1` fills the viewport when the form is short and grows with the
          form when it's tall (driving the page scroll + the side columns'
          height). No `overflow-hidden` here — on a flex item it zeroes the
          min-content and would clip a tall form instead of growing the page. */}
      <div className="flex flex-col min-w-0">
        <StepLabel n={2} title="เขียนคำสั่ง & กำหนดการ" hint="เลือกสื่อ / ข้อความ และช่วงเวลาแสดงผล" />
        <div className="flex-1 rounded-xl bg-(--dark-black)">
          <Composer
            vmsIds={vmsIds}
            targetSignSummary={targetSummary}
            onGotoLibrary={() => changeTab('media')}
          />
        </div>
      </div>

      {/* Step 3 — real-time monitor (xl: pinned to center height; stacked: natural) */}
      <div className={sideCol}>
        <StepLabel n={3} title="จอมอนิเตอร์สด" hint="ติดตามสถานะการแสดงผลแบบเรียลไทม์" />
        <div className={sideBox}>
          <div className="xl:absolute xl:inset-0">
            <LiveMonitor
              vmsIds={vmsIds}
              excludedSigns={excludedSelectedSigns}
              onOpenSignDetail={openDetail}
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Render a panel only after its tab has been visited (lazy mount), then keep
  // it mounted and toggle visibility with `hidden` so switching tabs never
  // resets a panel's internal state.
  //
  // All panels fill the section (`h-full`) so their children can resolve
  // percentage/`min-h-full` heights against a definite box. The dispatch grid
  // is `min-h-full`: it fills the viewport when the center form is short and
  // grows past it (spilling into the section's single scrollbar) when tall.
  const renderPanel = (key: TabKey, node: React.ReactNode) => (
    <div key={key} className={key === activeTab ? 'h-full' : 'hidden'}>
      {visitedTabs.has(key) || key === activeTab ? node : null}
    </div>
  )

  return (
    // antd App renders a wrapping <div class="ant-app"> — give it h-full so
    // main-screen's height:100% chains cleanly from <main class="h-screen">.
    <App className="h-full">
      <div className="main-screen px-10 flex flex-col">
        <TitleSection
          title="Control VMS"
          subtitle="ระบบจัดการป้าย VMS ระยะไกล"
          tabOptions={TAB_OPTIONS}
          defaultTab={activeTab}
          activeTab={activeTab}
          onTabChange={changeTab}
        />
        <section className="mt-6 flex-1 min-h-0 overflow-y-auto">
          {renderPanel('dispatch', dispatchTab)}
          {renderPanel('media', <MediaLibraryTab />)}
          {renderPanel(
            'display',
            <div className="h-full overflow-auto">
              <ControlVMSProvider>
                <DisplaySection />
              </ControlVMSProvider>
            </div>
          )}
          {renderPanel(
            'status',
            <div className="h-full overflow-auto">
              <ControlVMSProvider>
                <StatusSection />
              </ControlVMSProvider>
            </div>
          )}
          {renderPanel('history', <GlobalHistoryTable onOpenSign={openDetail} />)}
          {renderPanel('vmsinfo', <StatusTable onOpenSignDetail={openDetail} />)}
        </section>
      </div>
      <SignDetailModal open={detailVmsId !== null} onClose={closeDetail} vmsId={detailVmsId} />
    </App>
  )
}

export default VMSCommandCenterScreen
