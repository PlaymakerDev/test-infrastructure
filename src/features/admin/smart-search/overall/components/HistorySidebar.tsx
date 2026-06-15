"use client"
import { Button, Input, Skeleton, Tooltip } from "antd"
import dayjs from "dayjs"
import React, { useMemo, useState } from "react"
import { TbSearch, TbSparkles } from "react-icons/tb"
import type { ConversationSummary } from "@/types/chat"
import { useSmartSearchContext } from "../context"
import ConversationItem from "./ConversationItem"

interface Group {
  label: string
  items: ConversationSummary[]
}

// Bucket conversations (already newest-first) by recency of updated_at.
const groupByRecency = (list: ConversationSummary[]): Group[] => {
  const now = dayjs()
  const groups: Group[] = [
    { label: "วันนี้", items: [] },
    { label: "เมื่อวานนี้", items: [] },
    { label: "7 วันที่ผ่านมา", items: [] },
    { label: "ก่อนหน้า", items: [] },
  ]

  for (const c of list) {
    const d = dayjs(c.updated_at)
    if (d.isSame(now, "day")) groups[0].items.push(c)
    else if (d.isSame(now.subtract(1, "day"), "day")) groups[1].items.push(c)
    else if (d.isAfter(now.subtract(7, "day"))) groups[2].items.push(c)
    else groups[3].items.push(c)
  }

  return groups.filter((g) => g.items.length > 0)
}

const HistorySidebar: React.FC = () => {
  const { conversations, loadingList, conversationId, newChat } =
    useSmartSearchContext()
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? conversations.filter((c) => c.title.toLowerCase().includes(q))
      : conversations
    return groupByRecency(filtered)
  }, [conversations, query])

  const isEmpty = !loadingList && groups.length === 0

  return (
    <aside className="hidden md:flex w-[280px] shrink-0 flex-col gap-4 bg-(--dark-black) rounded-lg p-4">
      <div className="flex items-center gap-2">
        <Input
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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

        {loadingList && conversations.length === 0 ? (
          <Skeleton active paragraph={{ rows: 6 }} title={false} />
        ) : isEmpty ? (
          <p className="fs-12 text-white/40">
            {query ? "ไม่พบประวัติที่ตรงกับคำค้น" : "ยังไม่มีประวัติการค้นหา"}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="fs-12 text-white/40 mb-1 px-1">{group.label}</p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((c) => (
                    <ConversationItem
                      key={c.id}
                      conversation={c}
                      active={c.id === conversationId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

export default React.memo(HistorySidebar)
