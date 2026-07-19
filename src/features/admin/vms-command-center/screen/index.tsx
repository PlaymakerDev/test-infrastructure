"use client"
import React, { useCallback, useMemo, useState } from 'react'
import { App, Tabs } from 'antd'
import type { BureauSelection } from '@/types/control-vms/bureau'
import ScopePicker from '../components/ScopePicker'
import Composer from '../components/Composer'
import LiveMonitor from '../components/LiveMonitor'
import GlobalHistoryTable from '../components/GlobalHistoryTable'
import SignDetailModal from '../components/SignDetailModal'
import ControlVMSScreen from '@/features/admin/control-vms/overall/screen'

const emptySelection: BureauSelection = {
  keys: [],
  bureaus: [],
  states: [],
  routes: [],
  signs: [],
}

const VMSCommandCenterScreen: React.FC = () => {
  const [selection, setSelection] = useState<BureauSelection>(emptySelection)
  const [detailVmsId, setDetailVmsId] = useState<number | null>(null)
  const openDetail = useCallback((id: number) => setDetailVmsId(id), [])
  const closeDetail = useCallback(() => setDetailVmsId(null), [])

  const vmsIds = useMemo(() => selection.signs.map((s) => s.vms_id), [selection.signs])

  const targetSummary = useMemo(() => {
    if (selection.signs.length === 0) return 'ยังไม่ได้เลือกป้าย'
    const parts: string[] = []
    if (selection.bureaus.length) parts.push(`${selection.bureaus.length} สำนัก`)
    if (selection.states.length) parts.push(`${selection.states.length} แขวง`)
    if (selection.routes.length) parts.push(`${selection.routes.length} สายทาง`)
    parts.push(`${selection.signs.length} ป้าย`)
    return `เป้าหมาย: ${parts.join(' / ')}`
  }, [selection])

  return (
    <App>
      <div className="h-[calc(100vh-96px)] w-full p-3">
        <Tabs
          defaultActiveKey="dispatch"
          className="vms-cc-tabs h-full"
          items={[
            {
              key: 'dispatch',
              label: 'สั่งใหม่ + ติดตาม',
              children: (
                <div className="h-[calc(100vh-160px)] grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(360px,1fr)_minmax(360px,1fr)] gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
                    <ScopePicker onSelectionChange={setSelection} selection={selection} />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
                    <Composer vmsIds={vmsIds} targetSignSummary={targetSummary} />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
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
              key: 'library',
              label: 'คลังเนื้อหา / ปฏิทิน',
              children: (
                <div className="h-[calc(100vh-160px)] overflow-auto">
                  <ControlVMSScreen />
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
