"use client"
import { App, Dropdown, Input, type InputRef, type MenuProps } from "antd"
import React, { useCallback, useRef, useState } from "react"
import { TbDotsVertical, TbPencil, TbPin, TbPinFilled, TbTrash } from "react-icons/tb"
import type { ConversationSummary } from "@/types/chat"
import { useSmartSearchContext } from "../context"

interface Props {
  conversation: ConversationSummary
  active: boolean
  // Called after the conversation is opened — lets the mobile drawer close.
  onAfterOpen?: () => void
}

const ConversationItem: React.FC<Props> = ({ conversation, active, onAfterOpen }) => {
  const {
    openConversation,
    prefetchConversation,
    renameConversation,
    deleteConversation,
    pinnedIds,
    togglePin,
  } = useSmartSearchContext()
  const { modal, message } = App.useApp()
  const pinned = pinnedIds.has(conversation.id)

  const open = useCallback(() => {
    openConversation(conversation.id)
    onAfterOpen?.()
  }, [openConversation, conversation.id, onAfterOpen])

  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(conversation.title)
  const inputRef = useRef<InputRef>(null)

  const startEditing = useCallback(() => {
    setDraftTitle(conversation.title)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.focus({ cursor: "all" }))
  }, [conversation.title])

  const commitRename = useCallback(async () => {
    const title = draftTitle.trim()
    setEditing(false)
    if (!title || title === conversation.title) return
    try {
      await renameConversation(conversation.id, title)
    } catch {
      message.error("เปลี่ยนชื่อไม่สำเร็จ")
    }
  }, [draftTitle, conversation.id, conversation.title, renameConversation, message])

  const confirmDelete = useCallback(() => {
    modal.confirm({
      title: "ลบประวัติการค้นหา",
      content: `ต้องการลบ "${conversation.title}" หรือไม่`,
      okText: "ลบ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConversation(conversation.id)
        } catch {
          message.error("ลบไม่สำเร็จ")
        }
      },
    })
  }, [modal, conversation.id, conversation.title, deleteConversation, message])

  const menuItems: MenuProps["items"] = [
    {
      key: "pin",
      label: pinned ? "เลิกปักหมุด" : "ปักหมุด",
      icon: pinned ? <TbPinFilled /> : <TbPin />,
    },
    { key: "rename", label: "เปลี่ยนชื่อ", icon: <TbPencil /> },
    { key: "delete", label: "ลบ", icon: <TbTrash />, danger: true },
  ]

  const onMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation()
    if (key === "pin") togglePin(conversation.id)
    else if (key === "rename") startEditing()
    else if (key === "delete") confirmDelete()
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        onPressEnter={commitRename}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false)
        }}
        className="fs-14"
      />
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter") open()
      }}
      onMouseEnter={() => prefetchConversation(conversation.id)}
      className={`group flex items-center gap-1 h-8 rounded-md px-[11px] cursor-pointer transition-colors ${active ? "bg-(--yellow)/15 text-(--yellow)" : "text-white/70 hover:bg-white/5"
        }`}
    >
      {pinned && (
        <TbPinFilled className="shrink-0 text-(--yellow)/70" size={12} />
      )}
      <span
        className="flex-1 min-w-0 truncate fs-14 select-none"
        title="ดับเบิลคลิกเพื่อเปลี่ยนชื่อ"
        onDoubleClick={(e) => {
          e.stopPropagation()
          startEditing()
        }}
      >
        {conversation.title}
      </span>
      <Dropdown
        menu={{ items: menuItems, onClick: onMenuClick }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <button
          type="button"
          aria-label="ตัวเลือก"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 -mr-2 h-7 w-7 inline-flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <TbDotsVertical />
        </button>
      </Dropdown>
    </div>
  )
}

export default React.memo(ConversationItem)
