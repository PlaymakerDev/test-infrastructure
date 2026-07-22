"use client"
import React, { useMemo } from 'react'
import { Empty, Skeleton, Tag } from 'antd'
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
  /** vms_ids that should render as online in the tree, regardless of the
   *  departments-API's own is_online flag. Used by the Command Center to align
   *  sidebar with the eligibility (screen-info) source of truth — otherwise
   *  the tree can show a sign as ออนไลน์ while the LiveMonitor bucket says
   *  Offline (different agent stacks, different heartbeats). */
  onlineOverrideIds?: Set<number>
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
  onlineOverrideIds,
  onViewSign,
}) {
  const { data, isLoading, isError } = useVMSDepartments()
  const rawItems: BureauItem[] = useMemo(() => data?.data ?? [], [data])
  // Walk the tree once per (data, override) and rewrite `is_online` on every
  // sign — cheap because BureauItem is <1000 signs total in prod. Preserves
  // rest of the sign shape so BureauList doesn't need to know an override
  // existed. Field names come from VMSDepartmentList → SubDepartment → Road →
  // Solution (see types/control-vms/vms-api.ts).
  const items: BureauItem[] = useMemo(() => {
    if (!onlineOverrideIds) return rawItems
    return rawItems.map((bureau) => ({
      ...bureau,
      sub_department: bureau.sub_department.map((state) => ({
        ...state,
        roads: state.roads.map((route) => ({
          ...route,
          solution: route.solution.map((s) => ({
            ...s,
            is_online: onlineOverrideIds.has(s.vms_id),
          })),
        })),
      })),
    }))
  }, [rawItems, onlineOverrideIds])

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
          เลือกได้ทั้งระดับสำนัก / แขวง / สายทาง หรือทีละป้าย — "เลือกทั้งหมด" ติ๊กเฉพาะป้ายออนไลน์ (ป้ายออฟไลน์ต้องติ๊กเอง)
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-3"><Skeleton active paragraph={{ rows: 6 }} /></div>}
        {isError && <div className="p-6"><Empty description="โหลดโครงสร้างองค์กรไม่สำเร็จ" /></div>}
        {!isLoading && !isError && (
          <BureauList
            data={items}
            alwaysSelectMode={alwaysSelectMode}
            defaultExpandAll={false}
            onSelectionChange={onSelectionChange}
            onViewSign={onViewSign ? (sign) => onViewSign(sign.vms_id) : undefined}
          />
        )}
      </div>
    </div>
  )
})

export default ScopePicker
