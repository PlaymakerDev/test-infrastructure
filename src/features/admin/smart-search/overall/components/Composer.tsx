"use client"
import { Button, ConfigProvider, Input } from "antd"
import React, { useCallback } from "react"
import { TbPlayerStopFilled, TbArrowUp, TbTargetArrow } from "react-icons/tb"
import { useSmartSearchContext } from "../context"

const MAX_RUNES = 500

const runeLength = (text: string) => [...text].length

const Composer: React.FC = () => {
  const { draft, setDraft, send, stop, isStreaming, mode, setMode } =
    useSmartSearchContext()

  const length = runeLength(draft)
  const overLimit = length > MAX_RUNES
  const showCounter = length > MAX_RUNES * 0.8
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
    <div className="shrink-0">
      <div className="mx-auto w-full max-w-5xl px-4 pb-6">
        <div className="rounded-2xl bg-black border border-white/10 focus-within:border-(--yellow)/50 transition-colors px-4 py-2 shadow-lg shadow-black/30">
          <ConfigProvider
            theme={{ components: { Input: { colorTextPlaceholder: "#979797" } } }}
          >
            <Input.TextArea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="กรุณาป้อนคำสั่งหรือถามในสิ่งที่ต้องการทราบ เราจะประมวลผลอย่างถูกต้องและรวดเร็วที่สุด..."
              autoSize={{ minRows: 1, maxRows: 8 }}
              variant="borderless"
              className="!px-0 !bg-transparent"
            />
          </ConfigProvider>

          <div className="flex items-center justify-between mt-1">
            <button
              type="button"
              title="แม่นยำขึ้นสำหรับคำถามซับซ้อน (ช้าลงเล็กน้อย)"
              onClick={() => setMode(mode === "accurate" ? "fast" : "accurate")}
              className={`flex items-center gap-1.5 fs-12 px-3 py-1 rounded-full border transition-colors cursor-pointer ${mode === "accurate"
                ? "border-(--yellow) text-(--yellow) bg-(--yellow)/10"
                : "border-white/15 text-white/50 hover:text-white/80 hover:border-white/30"
                }`}
            >
              <TbTargetArrow /> แม่นยำ
            </button>

            <div className="flex items-center gap-3">
              {showCounter && (
                <span className={`fs-12 ${overLimit ? "text-red-400" : "text-white/40"}`}>
                  {length}/{MAX_RUNES}
                </span>
              )}
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
                <button
                  type="button"
                  aria-label="ส่ง"
                  disabled={!canSend}
                  onClick={handleSend}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${canSend
                    ? "bg-(--yellow) text-(--dark-black) hover:bg-(--yellow)/90 cursor-pointer"
                    : "bg-[#3A3A3A] text-white/50 cursor-not-allowed"
                    }`}
                >
                  <TbArrowUp size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Composer)
