"use client"
import { Button, Input, Tooltip } from "antd"
import React, { useCallback } from "react"
import {
  TbPhotoPlus,
  TbPlayerStopFilled,
  TbScan,
  TbSend,
  TbTargetArrow,
} from "react-icons/tb"
import { useSmartSearchContext } from "../context"

const MAX_RUNES = 500

const runeLength = (text: string) => [...text].length

const Composer: React.FC = () => {
  const { draft, setDraft, send, stop, isStreaming, mode, setMode } =
    useSmartSearchContext()

  const length = runeLength(draft)
  const overLimit = length > MAX_RUNES
  const canSend = draft.trim().length > 0 && !overLimit && !isStreaming

  const handleSend = useCallback(() => {
    if (!canSend) return
    send(draft)
    setDraft("")
  }, [canSend, draft, send, setDraft])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      } else if (e.key === "Escape" && isStreaming) {
        e.preventDefault()
        stop()
      }
    },
    [handleSend, isStreaming, stop],
  )

  return (
    <div className="shrink-0 pt-3">
      <div className="rounded-2xl bg-(--dark-black) border border-white/10 px-3 py-2.5">
        {/* Disabled image/scan inputs — backend is text-only (text-to-SQL). */}
        <div className="flex items-center gap-1 mb-1">
          <Tooltip title="แนบรูปภาพ (เร็วๆ นี้)">
            <Button
              type="text"
              size="small"
              disabled
              aria-label="แนบรูปภาพ (เร็วๆ นี้)"
              icon={<TbPhotoPlus className="text-white/40" />}
            />
          </Tooltip>
          <Tooltip title="สแกน (เร็วๆ นี้)">
            <Button
              type="text"
              size="small"
              disabled
              aria-label="สแกน (เร็วๆ นี้)"
              icon={<TbScan className="text-white/40" />}
            />
          </Tooltip>
        </div>

        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="กรุณาป้อนคำสั่งหรือถามในสิ่งที่ต้องการทราบ เราจะประมวลผลอย่างถูกต้องและรวดเร็วที่สุด..."
          autoSize={{ minRows: 1, maxRows: 6 }}
          variant="borderless"
          className="!px-0"
        />

        <div className="flex items-center justify-between mt-1">
          <Tooltip title="แม่นยำขึ้นสำหรับคำถามซับซ้อน (ช้าลงเล็กน้อย)">
            <button
              type="button"
              onClick={() => setMode(mode === "accurate" ? "fast" : "accurate")}
              className={`flex items-center gap-1.5 fs-12 px-3 py-1 rounded-full border transition-colors ${
                mode === "accurate"
                  ? "border-(--yellow) text-(--yellow) bg-(--yellow)/10"
                  : "border-white/20 text-white/60 hover:text-white"
              }`}
            >
              <TbTargetArrow /> แม่นยำ
            </button>
          </Tooltip>

          <div className="flex items-center gap-3">
            <span
              className={`fs-12 ${overLimit ? "text-red-400" : "text-white/40"}`}
            >
              {length}/{MAX_RUNES}
            </span>
            {isStreaming ? (
              <Button
                type="primary"
                shape="circle"
                danger
                aria-label="หยุด"
                icon={<TbPlayerStopFilled />}
                onClick={stop}
              />
            ) : (
              <Button
                type="primary"
                shape="circle"
                aria-label="ส่ง"
                icon={<TbSend />}
                disabled={!canSend}
                onClick={handleSend}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Composer)
