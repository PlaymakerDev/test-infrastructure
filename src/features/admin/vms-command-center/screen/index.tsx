"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { App, Tabs, Tooltip } from 'antd'
import { TbAlertTriangle, TbClockPause } from 'react-icons/tb'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { BureauSelection } from '@/types/control-vms/bureau'
import ScopePicker from '../components/ScopePicker'
import Composer from '../components/Composer'
import LiveMonitor from '../components/LiveMonitor'
import GlobalHistoryTable from '../components/GlobalHistoryTable'
import SignDetailModal from '../components/SignDetailModal'
import MediaLibraryTab from '../components/MediaLibraryTab'
import StatusTable from '../components/StatusTable'
import { useScreenInfo } from '../hooks/useScreenInfo'
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

const VMSCommandCenterScreen: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: TabKey = (VALID_TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as TabKey)
    : 'dispatch'

  const changeTab = useCallback(
    (key: string) => {
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

  // Poll screen-info so dispatch can gate on capability. Slower cadence than
  // STATUS tab (that one polls 30s); here we mainly need it for filtering, so
  // 60s is plenty and any change made in STATUS is broadcast via invalidation.
  const { data: screenInfoResp } = useScreenInfo({ refetchIntervalMs: 60_000 })

  // Split eligibility into three buckets, driven by every SELECTED sign
  // (not just what screen-info returned) so signs missing from screen-info
  // still land somewhere sensible. Signs that aren't in screen-info yet
  // (never-provisioned agents) get treated as "offline queue-ahead" so the
  // LiveMonitor bucketing agrees with what the sidebar already tells the
  // operator ("this sign is offline"). Buckets:
  //   immediate: has screen-info row + is_centralized + is_controllable
  //              → dispatched now
  //   queued:    is_centralized (assumed true when unknown) + not immediate
  //              → stored, plays when the agent connects (first-time OK)
  //   excluded:  has screen-info row + is_centralized === false
  //              (operator explicitly opted the sign out in the ข้อมูลป้าย VMS
  //              tab — dispatching would be silently discarded)
  const { immediateIds, queuedIds } = useMemo(() => {
    const items = screenInfoResp?.data?.data ?? []
    const infoByVmsId = new Map(items.map((i) => [i.vms_id, i]))
    const immediate = new Set<number>()
    const queued = new Set<number>()
    for (const s of selection.signs) {
      const info = infoByVmsId.get(s.vms_id)
      if (info && info.is_centralized === false) continue  // excluded
      if (info?.is_controllable) {
        immediate.add(s.vms_id)
      } else {
        queued.add(s.vms_id)
      }
    }
    return { immediateIds: immediate, queuedIds: queued }
  }, [screenInfoResp, selection.signs])

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

  return (
    <App>
      <div className="h-[calc(100vh-96px)] w-full px-10 pt-4 pb-3 flex flex-col">
        <section>
          <h1 className='text-(--yellow)'>Control VMS</h1>
          <p className='text-(--yellow)'>ระบบจัดการป้าย VMS ระยะไกล</p>
        </section>
        <Tabs
          activeKey={activeTab}
          onChange={changeTab}
          // Keep all tab panes mounted — operators sit in this feature and
          // switch (dispatch ↔ media ↔ status) constantly. Destroying on
          // hide reset the LiveMonitor timer ("ล่าสุด —"), the ScopePicker
          // scroll position, MediaLibrary filters, etc. Trade-off is a few
          // background polls (all payloads small); worth it for continuous
          // context. Selection state was already persisted in parent scope.
          className="vms-cc-tabs flex-1 min-h-0 mt-4"
          items={[
            {
              key: 'dispatch',
              label: 'การสั่งงาน',
              children: (
                <div className="h-[calc(100vh-240px)] grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(360px,1fr)_minmax(360px,1fr)] gap-3">
                  <div className="rounded-xl bg-(--dark-black) overflow-hidden flex flex-col">
                    <ScopePicker
                      onSelectionChange={setSelection}
                      selection={selection}
                      onlineOverrideIds={immediateIds}
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
                      <Tooltip title="ป้ายที่ยังไม่เคย provision, agent เวอร์ชันเก่าเกินไป, หรือถูกถอดจากกลุ่มควบคุมรวม — ตรวจสอบและเปิดใช้งานได้ในแท็บ 'ข้อมูลป้าย VMS'">
                        <div className="px-3 py-2 border-t border-white/10 fs-12 text-(--yellow) flex items-start gap-1.5">
                          <TbAlertTriangle className="fs-14 shrink-0 mt-0.5" />
                          <span>ข้าม {excludedCount} ป้ายที่ไม่รองรับ</span>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  <div className="rounded-xl bg-(--dark-black) overflow-hidden">
                    <Composer
                      vmsIds={vmsIds}
                      targetSignSummary={targetSummary}
                      onGotoLibrary={() => changeTab('media')}
                    />
                  </div>
                  <div className="rounded-xl bg-(--dark-black) overflow-hidden">
                    <LiveMonitor
                      vmsIds={vmsIds}
                      immediateIds={immediateIds}
                      queuedIds={queuedIds}
                      excludedSigns={excludedSelectedSigns}
                      onOpenSignDetail={openDetail}
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'media',
              label: 'คลังสื่อ',
              children: (
                <div className="h-[calc(100vh-240px)]">
                  <MediaLibraryTab />
                </div>
              ),
            },
            {
              key: 'display',
              label: 'กำหนดการแสดงผล',
              children: (
                <div className="h-[calc(100vh-240px)] overflow-auto">
                  <ControlVMSProvider>
                    <DisplaySection />
                  </ControlVMSProvider>
                </div>
              ),
            },
            {
              key: 'status',
              label: 'สถานะการแสดงผล',
              children: (
                <div className="h-[calc(100vh-240px)] overflow-auto">
                  <ControlVMSProvider>
                    <StatusSection />
                  </ControlVMSProvider>
                </div>
              ),
            },
            {
              key: 'history',
              label: 'ประวัติสั่งงานทั้งหมด',
              children: (
                <div className="h-[calc(100vh-240px)]">
                  <GlobalHistoryTable onOpenSign={openDetail} />
                </div>
              ),
            },
            {
              key: 'vmsinfo',
              label: 'ข้อมูลป้าย VMS',
              children: (
                <div className="h-[calc(100vh-240px)]">
                  <StatusTable onOpenSignDetail={openDetail} />
                </div>
              ),
            },
          ]}
        />
      </div>
      <SignDetailModal open={detailVmsId !== null} onClose={closeDetail} vmsId={detailVmsId} />
    </App>
  )
}

export default VMSCommandCenterScreen
