"use client"
import React, { useMemo, useState } from 'react'
import { Empty, Skeleton, Switch, Tag, Tooltip } from 'antd'
import { TbBuilding, TbMapPin, TbRoad, TbSignRight } from 'react-icons/tb'
import BureauList from '@/components/list/BureauList'
import type { BureauItem, BureauSelection } from '@/types/control-vms/bureau'
import { useVMSDepartments } from '@/features/admin/control-vms/overall/hooks/useVMSDepartments'

interface Props {
  onSelectionChange: (selection: BureauSelection) => void
  selection: BureauSelection
  /** Force "select mode" on — checkboxes always visible (default true, matches
   *  the Command Center dispatch flow). Set false for a click-to-drill-in view. */
  alwaysSelectMode?: boolean
  /** Initial value of the "รวมออฟไลน์เมื่อเลือกทั้งหมด" switch. Default false
   *  (Command Center dispatch). Set true for the STATUS tab where offline
   *  signs are the whole point. */
  includeOfflineOnSelectAll?: boolean
}

const summaryTagStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 6,
}

const ScopePicker: React.FC<Props> = React.memo(function ScopePicker({
  onSelectionChange,
  selection,
  alwaysSelectMode = true,
  includeOfflineOnSelectAll = false,
}) {
  const { data, isLoading, isError } = useVMSDepartments()
  const items: BureauItem[] = useMemo(() => data?.data ?? [], [data])

  // Off by default — "เลือกทั้งหมด" then only picks online signs. Offline
  // signs stay visible and individually tickable; operators still get to
  // opt-in when they want to queue up commands for offline boards.
  const [includeOffline, setIncludeOffline] = useState(includeOfflineOnSelectAll)

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-white/10 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Tag color="processing" style={summaryTagStyle} icon={<TbBuilding style={{ verticalAlign: -2 }} />}>
            สำนัก {selection.bureaus.length}
          </Tag>
          <Tag color="cyan" style={summaryTagStyle} icon={<TbMapPin style={{ verticalAlign: -2 }} />}>
            แขวง {selection.states.length}
          </Tag>
          <Tag color="geekblue" style={summaryTagStyle} icon={<TbRoad style={{ verticalAlign: -2 }} />}>
            สายทาง {selection.routes.length}
          </Tag>
          <Tag color="gold" style={summaryTagStyle} icon={<TbSignRight style={{ verticalAlign: -2 }} />}>
            ป้าย {selection.signs.length}
          </Tag>
        </div>
        <div className="fs-12 opacity-60">
          เลือกได้ทั้งระดับสำนัก / แขวง / สายทาง หรือทีละป้าย — ใช้ checkbox เพื่อรวมหลายป้าย
        </div>
        <div className="flex items-center gap-2 fs-12">
          <Tooltip title='เมื่อกด "เลือกทั้งหมด" ป้ายออฟไลน์จะถูกรวมด้วยหรือไม่ (คำสั่งจะรอส่งเมื่อกลับมาออนไลน์)'>
            <span className="opacity-70">รวมป้ายออฟไลน์เมื่อเลือกทั้งหมด</span>
          </Tooltip>
          <Switch size="small" checked={includeOffline} onChange={setIncludeOffline} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-3"><Skeleton active paragraph={{ rows: 6 }} /></div>}
        {isError && <div className="p-6"><Empty description="โหลดโครงสร้างองค์กรไม่สำเร็จ" /></div>}
        {!isLoading && !isError && (
          <BureauList
            data={items}
            alwaysSelectMode={alwaysSelectMode}
            includeOfflineOnSelectAll={includeOffline}
            defaultExpandAll={false}
            onSelectionChange={onSelectionChange}
          />
        )}
      </div>
    </div>
  )
})

export default ScopePicker
