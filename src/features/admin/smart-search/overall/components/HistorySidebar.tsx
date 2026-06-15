"use client"
import { Button, Input, Tooltip } from "antd"
import React from "react"
import { TbSearch, TbSparkles } from "react-icons/tb"
import { useSmartSearchContext } from "../context"

// Step 1 placeholder: the search box + "new chat" shell. The grouped
// conversation history (วันนี้ / เมื่อวานนี้ / 7 วัน) is wired to
// GET /conversations in a later step.
const HistorySidebar: React.FC = () => {
  const { newChat } = useSmartSearchContext()

  return (
    <aside className="hidden md:flex w-[280px] shrink-0 flex-col gap-4 bg-(--dark-black) rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Input
          allowClear
          placeholder="ค้นหาประวัติ..."
          prefix={<TbSearch className="text-(--yellow)" />}
        />
        <Tooltip title="เริ่มการค้นหาใหม่">
          <Button
            type="primary"
            shape="circle"
            aria-label="แชตใหม่"
            icon={<TbSparkles />}
            onClick={newChat}
          />
        </Tooltip>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <p className="fs-12 text-(--yellow) mb-2">ประวัติการค้นหา</p>
        <p className="fs-12 text-white/40">ยังไม่มีประวัติการค้นหา</p>
      </div>
    </aside>
  )
}

export default React.memo(HistorySidebar)
