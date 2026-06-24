"use client"
import { ConfigProvider, Drawer, Input, Skeleton, Tooltip } from "antd"
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

// Search box + grouped conversation list — shared by the desktop inline panel
// and the mobile drawer. Each instance keeps its own query (only one is visible
// per breakpoint), so they never fight over state.
const PanelBody: React.FC<{ className?: string; onNavigate?: () => void }> = ({
  className,
  onNavigate,
}) => {
  const {
    conversations,
    loadingList,
    conversationId,
    newChat,
    pinnedIds,
    conversationMatches,
  } = useSmartSearchContext()
  const [query, setQuery] = useState("")

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Search matches the title or (for already-opened chats) their content.
    const filtered = q
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) || conversationMatches(c.id, q),
        )
      : conversations
    // Pinned chats float to the top in their own group; the rest by recency.
    const pinned = filtered.filter((c) => pinnedIds.has(c.id))
    const rest = filtered.filter((c) => !pinnedIds.has(c.id))
    const result = pinned.length
      ? [{ label: "ปักหมุด", items: pinned }, ...groupByRecency(rest)]
      : groupByRecency(rest)
    return result
  }, [conversations, query, pinnedIds, conversationMatches])

  const isEmpty = !loadingList && groups.length === 0

  return (
    <div className={`h-full flex flex-col gap-3 ${className ?? ""}`}>
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
            onClick={() => {
              newChat()
              onNavigate?.()
            }}
            className="text-white/50 hover:text-(--yellow) transition-colors p-1 cursor-pointer"
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
                      onAfterOpen={onNavigate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const HistorySidebar: React.FC = () => {
  const { historyOpen, setHistoryOpen } = useSmartSearchContext()
  const [open, setOpen] = useState(true)

  return (
    <>
      {/* Desktop: inline collapsible panel */}
      <div className="relative shrink-0 hidden md:block h-full">
        <div
          className={`overflow-hidden transition-[width] duration-300 ease-in-out h-full ${open ? "w-[400px]" : "w-0"
            }`}
        >
          <PanelBody className="w-[400px] bg-(--dark-black) rounded-tr-2xl pl-18 pr-9 py-6" />
        </div>

        {/* Collapse / expand toggle — floats on the panel's right edge */}
        <Tooltip title={open ? "ซ่อนประวัติ" : "แสดงประวัติ"}>
          <button
            type="button"
            aria-label={open ? "ซ่อนประวัติ" : "แสดงประวัติ"}
            onClick={() => setOpen((prev) => !prev)}
            className="absolute top-6 -right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-[#2F6FED] hover:bg-[#2a63d4] text-white shadow-lg transition-colors cursor-pointer"
          >
            {open ? (
              <TbLayoutSidebarLeftCollapse size={18} />
            ) : (
              <TbLayoutSidebarLeftExpand size={18} />
            )}
          </button>
        </Tooltip>
      </div>

      {/* Mobile: floating toggle. Like the desktop one it hugs the panel's
          edge — so it slides to the drawer's right edge when open (z above the
          drawer) and sits at the screen's left edge when closed. */}
      <button
        type="button"
        aria-label={historyOpen ? "ซ่อนประวัติ" : "แสดงประวัติ"}
        onClick={() => setHistoryOpen(!historyOpen)}
        style={{ left: historyOpen ? 302 : -16 }}
        className="md:hidden fixed top-1/2 -translate-y-1/2 z-[1100] w-9 h-9 rounded-full flex items-center justify-center bg-[#2F6FED] hover:bg-[#2a63d4] text-white shadow-lg transition-[left] duration-300 ease-in-out cursor-pointer"
      >
        {historyOpen ? (
          <TbLayoutSidebarLeftCollapse size={18} />
        ) : (
          <TbLayoutSidebarLeftExpand size={18} />
        )}
      </button>

      {/* Mobile: history as a left drawer */}
      <Drawer
        placement="left"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        closable={false}
        destroyOnHidden
        className="md:hidden"
        styles={{
          wrapper: { width: 320 },
          body: { padding: 0, background: "var(--dark-black)" },
          section: { background: "var(--dark-black)" },
          header: { display: "none" },
        }}
      >
        <PanelBody className="px-5 py-6" onNavigate={() => setHistoryOpen(false)} />
      </Drawer>
    </>
  )
}

export default React.memo(HistorySidebar)
