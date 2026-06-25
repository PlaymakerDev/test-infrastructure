"use client"
import { App, Button, Tooltip } from "antd"
import React, { useState } from "react"
import {
  TbCopy,
  TbDownload,
  TbHeart,
  TbHeartFilled,
  TbReload,
  TbThumbDown,
  TbThumbDownFilled,
  TbThumbUp,
  TbThumbUpFilled,
} from "react-icons/tb"
import type { ChatTurn, FeedbackVote } from "@/types/chat"
import { useSmartSearchContext } from "../context"
import { useExport } from "../hooks/useExport"
import { useFeedback } from "../hooks/useFeedback"

interface Props {
  turn: ChatTurn
}

const MessageActions: React.FC<Props> = ({ turn }) => {
  const {
    conversationId,
    send,
    isStreaming,
    pinQuestion,
    unpinQuestion,
    isQuestionPinned,
    dashboardPins,
  } = useSmartSearchContext()
  const { exporting, exportFile } = useExport()
  const { submitting, submit } = useFeedback()
  const { message } = App.useApp()

  const [vote, setVote] = useState<FeedbackVote | null>(null)

  const canExport = (turn.result && turn.result.row_count > 0) || !!turn.exportHint
  const canFeedback = !!conversationId && !!turn.messageId
  const pinned = isQuestionPinned(turn.question)

  const handlePin = () => {
    if (pinned) {
      const pin = dashboardPins.find((p) => p.question === turn.question)
      if (pin) unpinQuestion(pin.id)
      message.success("เอาออกจากแดชบอร์ดแล้ว")
    } else {
      pinQuestion(turn.question, turn.mode)
      message.success("ปักหมุดขึ้นแดชบอร์ดแล้ว")
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(turn.answer)
      message.success("คัดลอกคำตอบแล้ว")
    } catch {
      message.error("คัดลอกไม่สำเร็จ")
    }
  }

  const handleExport = async () => {
    const ok = await exportFile(turn.question, turn.exportHint?.format ?? "xlsx")
    if (!ok) message.error("ดาวน์โหลดไม่สำเร็จ")
  }

  const handleVote = async (next: FeedbackVote) => {
    if (!canFeedback) return
    const applied = vote === next ? null : next
    setVote(applied)
    if (applied) {
      const ok = await submit(conversationId!, turn.messageId!, applied)
      if (ok) message.success("ขอบคุณสำหรับความคิดเห็น")
      else {
        setVote(null)
        message.error("ส่งความคิดเห็นไม่สำเร็จ")
      }
    }
  }

  return (
    <div className="flex items-center gap-1 mt-3 text-white/60">
      <Tooltip title="คัดลอก">
        <Button type="text" size="small" icon={<TbCopy />} onClick={handleCopy} />
      </Tooltip>

      {canExport && (
        <Tooltip title="ดาวน์โหลดข้อมูลทั้งหมด (Excel)">
          <Button
            type="text"
            size="small"
            loading={exporting}
            icon={<TbDownload />}
            onClick={handleExport}
          />
        </Tooltip>
      )}

      {canFeedback && (
        <>
          <Tooltip title="คำตอบนี้มีประโยชน์">
            <Button
              type="text"
              size="small"
              disabled={submitting}
              icon={vote === "like" ? <TbThumbUpFilled className="text-(--yellow)" /> : <TbThumbUp />}
              onClick={() => handleVote("like")}
            />
          </Tooltip>
          <Tooltip title="คำตอบนี้ไม่ตรง">
            <Button
              type="text"
              size="small"
              disabled={submitting}
              icon={vote === "dislike" ? <TbThumbDownFilled className="text-orange-400" /> : <TbThumbDown />}
              onClick={() => handleVote("dislike")}
            />
          </Tooltip>
        </>
      )}

      <Tooltip title="ถามใหม่อีกครั้ง">
        <Button
          type="text"
          size="small"
          disabled={isStreaming}
          icon={<TbReload />}
          onClick={() => send(turn.question, { mode: turn.mode })}
        />
      </Tooltip>

      <Tooltip title={pinned ? "เอาออกจากแดชบอร์ด" : "บันทึกขึ้นแดชบอร์ด"}>
        <Button
          type="text"
          size="small"
          icon={
            pinned ? <TbHeartFilled className="text-(--yellow)" /> : <TbHeart />
          }
          onClick={handlePin}
        />
      </Tooltip>
    </div>
  )
}

export default React.memo(MessageActions)
