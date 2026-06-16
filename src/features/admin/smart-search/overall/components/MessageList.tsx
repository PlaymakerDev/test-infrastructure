"use client"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { TbArrowDown } from "react-icons/tb"
import type { ChatTurn } from "@/types/chat"
import AssistantMessage from "./AssistantMessage"
import UserMessage from "./UserMessage"

interface Props {
  turns: ChatTurn[]
}

const NEAR_BOTTOM_PX = 120

// Smart auto-scroll: follow new content only while the user is at the bottom.
// If they scroll up to read, stop following and surface a "jump to latest" button.
const MessageList: React.FC<Props> = ({ turns }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(distance <= NEAR_BOTTOM_PX)
  }, [])

  // Follow streaming content when pinned to the bottom.
  useEffect(() => {
    if (atBottom) scrollToBottom("auto")
  }, [turns, atBottom, scrollToBottom])

  return (
    <div className="relative h-full">
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 flex flex-col gap-8">
          {turns.map((turn) => (
            <div key={turn.id} className="flex flex-col gap-4">
              <UserMessage question={turn.question} />
              <AssistantMessage turn={turn} />
            </div>
          ))}
        </div>
      </div>

      {!atBottom && (
        <button
          type="button"
          aria-label="เลื่อนไปข้อความล่าสุด"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 fs-12 px-3 py-1.5 rounded-full bg-(--dark-black) border border-(--yellow)/40 text-(--yellow) shadow-lg shadow-black/40 hover:bg-(--yellow)/10 transition-colors cursor-pointer"
        >
          <TbArrowDown /> ล่าสุด
        </button>
      )}
    </div>
  )
}

export default React.memo(MessageList)
