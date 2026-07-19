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
}

const summaryTagStyle: React.CSSProperties = {
  fontSize: 12,
  padding: '2px 8px',
  borderRadius: 6,
}

// Left column: hierarchical bureau → district → road → sign picker with a
// count summary at the top so operators know exactly how many signs will
// receive the command.
const ScopePicker: React.FC<Props> = React.memo(function ScopePicker({ onSelectionChange, selection }) {
  const { data, isLoading, isError } = useVMSDepartments()

  const items: BureauItem[] = useMemo(() => data?.data ?? [], [data])

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-white/10">
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
        <div className="text-xs opacity-60 mt-2">
          เลือกได้ทั้งระดับสำนัก / แขวง / สายทาง หรือทีละป้าย — ใช้ checkbox เพื่อรวมหลายป้าย
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="p-3"><Skeleton active paragraph={{ rows: 6 }} /></div>}
        {isError && <div className="p-6"><Empty description="โหลดโครงสร้างองค์กรไม่สำเร็จ" /></div>}
        {!isLoading && !isError && (
          <BureauList
            data={items}
            defaultSelectMode
            defaultExpandAll={false}
            onSelectionChange={onSelectionChange}
          />
        )}
      </div>
    </div>
  )
})

export default ScopePicker
