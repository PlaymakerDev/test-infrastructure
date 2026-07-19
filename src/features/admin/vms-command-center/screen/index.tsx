"use client"
import React, { useMemo, useState } from 'react'
import { App } from 'antd'
import type { BureauSelection } from '@/types/control-vms/bureau'
import ScopePicker from '../components/ScopePicker'
import Composer from '../components/Composer'
import LiveMonitor from '../components/LiveMonitor'

const emptySelection: BureauSelection = {
  keys: [],
  bureaus: [],
  states: [],
  routes: [],
  signs: [],
}

const VMSCommandCenterScreen: React.FC = () => {
  const [selection, setSelection] = useState<BureauSelection>(emptySelection)

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
      <div className="h-[calc(100vh-96px)] w-full grid grid-cols-1 md:grid-cols-[minmax(280px,340px)_minmax(360px,1fr)_minmax(360px,1fr)] gap-3 p-3">
        <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
          <ScopePicker onSelectionChange={setSelection} selection={selection} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
          <Composer vmsIds={vmsIds} targetSignSummary={targetSummary} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[.03] overflow-hidden">
          <LiveMonitor vmsIds={vmsIds} />
        </div>
      </div>
    </App>
  )
}

export default VMSCommandCenterScreen
