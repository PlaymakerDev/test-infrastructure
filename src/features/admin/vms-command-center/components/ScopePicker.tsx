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
}) {
  const { data, isLoading, isError } = useVMSDepartments()
  const items: BureauItem[] = useMemo(() => data?.data ?? [], [data])

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
          />
        )}
      </div>
    </div>
  )
})

export default ScopePicker
