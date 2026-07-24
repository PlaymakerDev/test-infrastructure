"use client"
import React, { useDeferredValue, useMemo, useState } from 'react'
import { Empty, Input, Skeleton, Tag } from 'antd'
import { TbBuilding, TbMapPin, TbRoad, TbSearch, TbSignRight } from 'react-icons/tb'
import BureauList from '@/components/list/BureauList'
import type { BureauItem, BureauSelection } from '@/types/control-vms/bureau'
import { useVMSDepartments } from '@/features/admin/control-vms/overall/hooks/useVMSDepartments'
import { filterBureauData } from '@/utils/bureauFilter'

interface Props {
  onSelectionChange: (selection: BureauSelection) => void
  selection: BureauSelection
  /** Force "select mode" on — checkboxes always visible (default true, matches
   *  the Command Center dispatch flow). Set false for a click-to-drill-in view. */
  alwaysSelectMode?: boolean
  /** Opens the sign-detail modal for the clicked sign — same eye icon /
   *  same modal as LiveMonitor's cards, so the sidebar tree offers the same
   *  "inspect before you dispatch" shortcut. */
  onViewSign?: (vmsId: number) => void
}

const summaryTagBase: React.CSSProperties = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 6,
  margin: 0,
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  justifyContent: 'center',
}

// Tinted-border tags in theme colours — no AntD stock palette (see
// feedback_theme_no_invent). `color-mix(...)` gives a 12%-alpha tint of the
// same CSS var used for the border + text so a single palette move updates all.
const tintTag = (cssVar: string): React.CSSProperties => ({
  ...summaryTagBase,
  background: `color-mix(in srgb, var(${cssVar}) 12%, transparent)`,
  border: `1px solid var(${cssVar})`,
  color: `var(${cssVar})`,
})

const ScopePicker: React.FC<Props> = React.memo(function ScopePicker({
  onSelectionChange,
  selection,
  alwaysSelectMode = true,
  onViewSign,
}) {
  const { data, isLoading, isError } = useVMSDepartments()
  const rawItems: BureauItem[] = useMemo(() => data?.data ?? [], [data])
  // The departments API's own `is_online` is a LEGACY heartbeat
  // (tv.last_connected within 30 min) — a different agent stack than the one
  // Command Center dispatches through. Rewrite it to `is_controllable`
  // (same tbl_vms_screen_info join used everywhere else in Command Center)
  // so the sidebar dot always agrees with LiveMonitor's buckets and the
  // sign-detail modal. Cheap — BureauItem is <1000 signs total in prod.
  const items: BureauItem[] = useMemo(() => rawItems.map((bureau) => ({
    ...bureau,
    sub_department: bureau.sub_department.map((state) => ({
      ...state,
      roads: state.roads.map((route) => ({
        ...route,
        solution: route.solution.map((s) => ({
          ...s,
          is_online: s.is_controllable,
        })),
      })),
    })),
  })), [rawItems])

  const [searchTerm, setSearchTerm] = useState('')
  const deferredTerm = useDeferredValue(searchTerm)
  const filteredItems = useMemo(() => filterBureauData(items, deferredTerm), [items, deferredTerm])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-white/10 space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <Tag variant="filled" style={tintTag('--default-blue')} icon={<TbBuilding style={{ verticalAlign: -2 }} />}>
            สำนัก {selection.bureaus.length}
          </Tag>
          <Tag variant="filled" style={tintTag('--light-blue')} icon={<TbMapPin style={{ verticalAlign: -2 }} />}>
            แขวง {selection.states.length}
          </Tag>
          <Tag variant="filled" style={tintTag('--light-gray-3')} icon={<TbRoad style={{ verticalAlign: -2 }} />}>
            สายทาง {selection.routes.length}
          </Tag>
          <Tag variant="filled" style={tintTag('--yellow')} icon={<TbSignRight style={{ verticalAlign: -2 }} />}>
            ป้าย {selection.signs.length}
          </Tag>
        </div>
        <div className="fs-12 opacity-60">
          เลือกได้ทั้งระดับสำนัก / แขวง / สายทาง หรือทีละป้าย — "เลือกทั้งหมด" ติ๊กทุกป้าย แล้วดูสถานะพร้อมสั่งงานได้ที่คอลัมน์ขวา
        </div>
        <Input
          placeholder="ค้นหาสายทาง, ป้าย VMS..."
          suffix={<TbSearch className="text-(--yellow)" />}
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-3"><Skeleton active paragraph={{ rows: 6 }} /></div>}
        {isError && <div className="p-6"><Empty description="โหลดโครงสร้างองค์กรไม่สำเร็จ" /></div>}
        {!isLoading && !isError && deferredTerm && filteredItems.length === 0 && (
          <div className="p-6"><Empty description="ไม่พบผลการค้นหา" /></div>
        )}
        {!isLoading && !isError && !(deferredTerm && filteredItems.length === 0) && (
          <BureauList
            key={deferredTerm ? 'filtered' : 'full'}
            data={filteredItems}
            alwaysSelectMode={alwaysSelectMode}
            defaultExpandAll={!!deferredTerm}
            onSelectionChange={onSelectionChange}
            onViewSign={onViewSign ? (sign) => onViewSign(sign.vms_id) : undefined}
          />
        )}
      </div>
    </div>
  )
})

export default ScopePicker
