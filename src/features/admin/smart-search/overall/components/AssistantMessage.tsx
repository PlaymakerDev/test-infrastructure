"use client"
import React from "react"
import { TbBrandGithubCopilot, TbDatabaseOff } from "react-icons/tb"
import type { ChatTurn } from "@/types/chat"
import AnswerText from "./AnswerText"
import ConfidenceBadge from "./ConfidenceBadge"
import ResultTable from "./ResultTable"

interface Props {
  turn: ChatTurn
}

const TypingDots: React.FC = () => (
  <span className="inline-flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-(--yellow) animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
)

const NoDataCard: React.FC = () => (
  <div className="my-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
    <TbDatabaseOff className="text-white/50 shrink-0" size={22} />
    <p className="text-white/70 fs-14">
      ไม่พบข้อมูลที่ตรงกับคำถาม ลองปรับคำถามให้เจาะจงขึ้น
    </p>
  </div>
)

// Composite assistant turn. Render order follows the result spec:
// table (chart in a later step) → streamed answer → confidence.
const AssistantMessage: React.FC<Props> = ({ turn }) => {
  const { answer, status, errorMessage, result, confidence } = turn
  const isStreaming = status === "streaming"
  const isDone = status === "done"
  const waitingForFirstToken = isStreaming && !answer

  const hasTable = !!result && result.row_count > 0
  const isEmptyResult = !!result && result.row_count === 0

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-(--yellow)/15 flex items-center justify-center">
        <TbBrandGithubCopilot className="text-(--yellow)" size={18} />
      </div>
      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-(--dark-black) border border-white/5 px-4 py-3">
        {status === "error" ? (
          <p className="text-red-400">
            {errorMessage ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"}
          </p>
        ) : (
          <>
            {hasTable && <ResultTable result={result} />}
            {isEmptyResult && <NoDataCard />}

            {waitingForFirstToken ? (
              <TypingDots />
            ) : (
              answer && <AnswerText text={answer} streaming={isStreaming} />
            )}

            {isDone && confidence && (
              <div className="mt-2">
                <ConfidenceBadge confidence={confidence} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(AssistantMessage)
