"use client"
import { App, ConfigProvider, Dropdown, Input, type MenuProps } from "antd"
import React, { useMemo, useState } from "react"
import { TbChevronDown, TbPencil, TbTrash } from "react-icons/tb"
import { useSmartSearchContext } from "../context"

// Shows the active conversation's title (right of the header) with a menu —
// rename / delete (the actions the backend supports).
const ActiveChatHeader: React.FC = () => {
  const { conversations, conversationId, renameConversation, deleteConversation } =
    useSmartSearchContext()
  const { modal, message } = App.useApp()

  const [renaming, setRenaming] = useState(false)
  const [draftTitle, setDraftTitle] = useState("")

  const active = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId],
  )

  if (!active) return null

  const openRename = () => {
    setDraftTitle(active.title)
    setRenaming(true)
  }

  const commitRename = async () => {
    const title = draftTitle.trim()
    setRenaming(false)
    if (!title || title === active.title) return
    try {
      await renameConversation(active.id, title)
    } catch {
      message.error("เปลี่ยนชื่อไม่สำเร็จ")
    }
  }

  const confirmDelete = () => {
    modal.confirm({
      title: "ลบประวัติการค้นหา",
      content: `ต้องการลบ "${active.title}" หรือไม่`,
      okText: "ลบ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConversation(active.id)
        } catch {
          message.error("ลบไม่สำเร็จ")
        }
      },
    })
  }

  const items: MenuProps["items"] = [
    { key: "rename", label: "เปลี่ยนชื่อ", icon: <TbPencil /> },
    { key: "delete", label: "ลบ", icon: <TbTrash />, danger: true },
  ]
  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "rename") openRename()
    else if (key === "delete") confirmDelete()
  }

  // Inline rename — replaces the title with an editable field (no popup).
  if (renaming) {
    return (
      <Input
        autoFocus
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        onPressEnter={commitRename}
        onBlur={commitRename}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Escape") setRenaming(false)
        }}
        style={{ width: 280, maxWidth: "100%" }}
      />
    )
  }

  return (
    <div className="inline-flex items-center gap-0.5 max-w-full min-w-0">
      <button
        type="button"
        onClick={openRename}
        title="คลิกเพื่อเปลี่ยนชื่อ"
        className="truncate fs-14 min-w-0 text-left h-8 leading-8 text-white/90 hover:text-white hover:bg-white/[0.06] rounded-lg px-2 transition-colors cursor-pointer"
      >
        {active.title}
      </button>
      <Dropdown
        menu={{ items, onClick: onMenuClick, style: { width: 170 } }}
        trigger={["click"]}
        placement="bottomRight"
      >
        <button
          type="button"
          aria-label="ตัวเลือกแชต"
          className="shrink-0 h-8 w-8 inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
        >
          <TbChevronDown />
        </button>
      </Dropdown>
    </div>
  )
}

export default React.memo(ActiveChatHeader)
