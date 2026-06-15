"use client"
import { Button } from "antd"
import React from "react"
import { TbBrandGithubCopilot, TbDatabaseOff, TbLogin2 } from "react-icons/tb"
import { reloginChat } from "@/services/chatAuth"
import type { ChatTurn } from "@/types/chat"
import AnswerText from "./AnswerText"
import ChartView from "./ChartView"
import ConfidenceBadge from "./ConfidenceBadge"
import MessageActions from "./MessageActions"
import ResultTable from "./ResultTable"
import SuggestionChips from "./SuggestionChips"

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
  const { answer, status, errorMessage, errorKind, result, chart, suggestions, confidence } = turn
  const isStreaming = status === "streaming"
  const isDone = status === "done"
  const waitingForFirstToken = isStreaming && !answer

  const hasTable = !!result && result.row_count > 0
  const isEmptyResult = !!result && result.row_count === 0
  const hasChart = hasTable && !!chart && chart.type !== "table"

  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-(--yellow)/15 flex items-center justify-center mt-0.5">
        <TbBrandGithubCopilot className="text-(--yellow)" size={18} />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        {status === "error" ? (
          <div className="flex flex-col items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-red-400">
              {errorMessage ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"}
            </p>
            {errorKind === "auth" && (
              <Button
                type="primary"
                size="small"
                icon={<TbLogin2 />}
                onClick={() => reloginChat()}
              >
                เข้าสู่ระบบใหม่
              </Button>
            )}
          </div>
        ) : (
          <>
            {hasChart && <ChartView result={result} chart={chart} />}
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

            {isDone && suggestions && <SuggestionChips questions={suggestions} />}

            {isDone && <MessageActions turn={turn} />}
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(AssistantMessage)
