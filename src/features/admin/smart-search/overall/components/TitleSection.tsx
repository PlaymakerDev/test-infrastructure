"use client"
import { useRouter } from "next/navigation"
import React from "react"
import {
  TbArrowBigLeftFilled,
  TbColumns2,
  TbLayoutDashboard,
  TbMessage,
} from "react-icons/tb"
import { type ViewMode, useSmartSearchContext } from "../context"
import ActiveChatHeader from "./ActiveChatHeader"

const MODES: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: "chat", label: "แชต", icon: <TbMessage size={15} /> },
  { key: "dashboard", label: "แดชบอร์ด", icon: <TbLayoutDashboard size={15} /> },
  { key: "compare", label: "เทียบ", icon: <TbColumns2 size={15} /> },
]

const TitleSection: React.FC = () => {
  const router = useRouter()
  const { viewMode, setViewMode, turns } = useSmartSearchContext()

  // Keep the header clean once a chat is underway — show the mode tabs only on
  // the landing (empty chat) and in the dashboard/compare views (so you can
  // switch back). Hidden during an active conversation.
  const showTabs = viewMode !== "chat" || turns.length === 0

  return (
    <div className="px-4 md:px-8 flex items-start gap-3 flex-wrap">
      <section className="flex items-start gap-3 shrink-0">
        <TbArrowBigLeftFilled
          className="fs-24 text-(--yellow) cursor-pointer mt-2"
          onClick={() => router.back()}
        />
        <div>
          <h1 className="text-(--yellow)">Smart Search</h1>
          <p className="text-(--yellow)">ตัวช่วยค้นหาข้อมูลที่รวดเร็ว</p>
        </div>
      </section>

      <div className="flex-1 min-w-0 flex items-center justify-end gap-3 pt-2 flex-wrap">
        {showTabs && (
          <div className="inline-flex items-center gap-1 rounded-lg bg-white/5 p-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setViewMode(m.key)}
                className={`inline-flex items-center gap-1.5 fs-12 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === m.key
                    ? "bg-(--yellow) text-(--dark-black) font-medium"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {m.icon}
                <span className="max-sm:hidden">{m.label}</span>
              </button>
            ))}
          </div>
        )}
        {viewMode === "chat" && <ActiveChatHeader />}
      </div>
    </div>
  )
}

export default React.memo(TitleSection)
