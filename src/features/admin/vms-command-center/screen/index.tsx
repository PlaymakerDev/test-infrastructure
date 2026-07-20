"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { App, Tabs, Tooltip } from 'antd'
import { TbAlertTriangle } from 'react-icons/tb'
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


const emptySelection: BureauSelection = {
  keys: [],
  bureaus: [],
  states: [],
  routes: [],
  signs: [],
}

const VALID_TABS = ['dispatch', 'history', 'media', 'display', 'status'] as const
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
  const eligibleVmsIds = useMemo(() => {
    const items = screenInfoResp?.data?.data ?? []
    // Fail-open: if screen-info hasn't loaded yet we don't punish the operator
    // by hiding every sign — Composer's own validation still catches empty
    // dispatch. Once data arrives, non-controllable / non-centralized signs
    // are silently dropped from the outbound vms_ids list.
    if (items.length === 0) return null // sentinel: "no filter"
    return new Set(items.filter((i) => i.is_controllable && i.is_centralized).map((i) => i.vms_id))
  }, [screenInfoResp])

  // Full set from ScopePicker
  const allSelectedIds = useMemo(() => selection.signs.map((s) => s.vms_id), [selection.signs])
  // What Composer actually sends — post-filter for controllable + centralized
  const vmsIds = useMemo(() => {
    if (!eligibleVmsIds) return allSelectedIds
    return allSelectedIds.filter((id) => eligibleVmsIds.has(id))
  }, [allSelectedIds, eligibleVmsIds])
  const excludedCount = allSelectedIds.length - vmsIds.length

  const targetSummary = useMemo(() => {
    if (selection.signs.length === 0) return 'ยังไม่ได้เลือกป้าย'
    const parts: string[] = []
    if (selection.bureaus.length) parts.push(`${selection.bureaus.length} สำนัก`)
    if (selection.states.length) parts.push(`${selection.states.length} แขวง`)
    if (selection.routes.length) parts.push(`${selection.routes.length} สายทาง`)
    parts.push(`${selection.signs.length} ป้าย`)
    if (excludedCount > 0) parts.push(`(ข้าม ${excludedCount} ป้ายที่ควบคุมไม่ได้)`)
    return `เป้าหมาย: ${parts.join(' / ')}`
  }, [selection, excludedCount])

  return (
    <App>
      <div className="h-[calc(100vh-96px)] w-full p-3">
        <Tabs
          activeKey={activeTab}
          onChange={changeTab}
          destroyOnHidden
          className="vms-cc-tabs h-full"
          items={[
            {
              key: 'dispatch',
              label: 'การสั่งงาน + ติดตาม',
              children: (
                <div className="h-[calc(100vh-160px)] grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(360px,1fr)_minmax(360px,1fr)] gap-3">
                  <div className="rounded-xl bg-(--dark-black) overflow-hidden flex flex-col">
                    <ScopePicker onSelectionChange={setSelection} selection={selection} />
                    {excludedCount > 0 && (
                      <div className="px-3 py-2 border-t border-white/10 text-[11px] text-(--yellow) flex items-start gap-1.5">
                        <TbAlertTriangle className="fs-14 shrink-0 mt-0.5" />
                        <Tooltip title="ป้ายที่ agent เวอร์ชันต่ำหรือถูกถอดจากกลุ่มควบคุมรวมจะถูกข้ามอัตโนมัติ — ตรวจสอบและเปิดใช้งานได้ในแท็บ 'สถานะการแสดงผล'">
                          <span>ข้าม {excludedCount} ป้ายที่ยังควบคุมไม่ได้</span>
                        </Tooltip>
                      </div>
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
                    <LiveMonitor vmsIds={vmsIds} onOpenSignDetail={openDetail} />
                  </div>
                </div>
              ),
            },
            {
              key: 'history',
              label: 'ประวัติสั่งงานทั้งหมด',
              children: (
                <div className="h-[calc(100vh-160px)]">
                  <GlobalHistoryTable onOpenSign={openDetail} />
                </div>
              ),
            },
            {
              key: 'media',
              label: 'คลังสื่อ',
              children: (
                <div className="h-[calc(100vh-160px)]">
                  <MediaLibraryTab />
                </div>
              ),
            },
            {
              key: 'display',
              label: 'กำหนดการแสดงผล',
              children: (
                <div className="h-[calc(100vh-160px)] overflow-auto">
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
                <div className="h-[calc(100vh-160px)]">
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
