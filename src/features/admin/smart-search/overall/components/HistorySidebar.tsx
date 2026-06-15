"use client"
import { ConfigProvider, Input, Skeleton, Tooltip } from "antd"
import dayjs from "dayjs"
import React, { useMemo, useState } from "react"
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbPlus,
  TbSearch,
} from "react-icons/tb"
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
  const [open, setOpen] = useState(true)
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
    <div className="relative shrink-0 max-md:hidden h-full">
      {/* Collapsible panel — animates width like control-vms */}
      <div
        className={`overflow-hidden transition-[width] duration-300 ease-in-out h-full ${open ? "w-[400px]" : "w-0"
          }`}
      >
        <div className="w-[400px] h-full flex flex-col gap-3 bg-(--dark-black) rounded-tr-2xl pl-18 pr-9 py-6">
          <ConfigProvider
            theme={{
              token: {
                // clear (×) icon — visible on the dark fill (default is too dim)
                colorTextQuaternary: "rgba(255,255,255,0.5)",
                colorTextTertiary: "#FFFFFF",
              },
              components: {
                Input: {
                  colorBgContainer: "#1F1F1F",
                  colorBorder: "transparent",
                  hoverBorderColor: "transparent",
                  activeBorderColor: "var(--yellow)",
                  colorTextPlaceholder: "#FCD11680",
                  borderRadius: 10,
                },
              },
            }}
          >
            <Input
              allowClear
              size="large"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาประวัติ..."
              prefix={<TbSearch className="text-(--yellow)" />}
            />
          </ConfigProvider>

          <div className="flex items-center justify-between">
            <p className="fs-12 text-[#66AEFF]">ประวัติการค้นหา</p>
            <Tooltip title="แชตใหม่">
              <button
                type="button"
                aria-label="แชตใหม่"
                onClick={newChat}
                className="text-white/50 hover:text-(--yellow) transition-colors p-1"
              >
                <TbPlus size={16} />
              </button>
            </Tooltip>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto -mr-1 pr-1">
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
                    <p className="fs-12 text-white/40 mb-1 px-1 text-right">
                      {group.label}
                    </p>
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
        </div>
      </div>

      {/* Collapse / expand toggle — floats on the panel's right edge */}
      <Tooltip title={open ? "ซ่อนประวัติ" : "แสดงประวัติ"}>
        <button
          type="button"
          aria-label={open ? "ซ่อนประวัติ" : "แสดงประวัติ"}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute top-6 -right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[#2F6FED] hover:bg-[#2a63d4] text-white shadow-lg transition-colors"
        >
          {open ? (
            <TbLayoutSidebarLeftCollapse size={18} />
          ) : (
            <TbLayoutSidebarLeftExpand size={18} />
          )}
        </button>
      </Tooltip>
    </div>
  )
}

export default React.memo(HistorySidebar)
