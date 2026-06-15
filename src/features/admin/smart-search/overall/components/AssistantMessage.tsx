"use client"
import React from "react"
import { TbBrandGithubCopilot } from "react-icons/tb"
import type { ChatTurn } from "@/types/chat"
import AnswerText from "./AnswerText"

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

// Composite assistant turn. Step 1 renders the streamed answer (and an error
// fallback). Table / chart / confidence / suggestions / actions are layered in
// by later steps.
const AssistantMessage: React.FC<Props> = ({ turn }) => {
  const { answer, status, errorMessage } = turn
  const isStreaming = status === "streaming"
  const waitingForFirstToken = isStreaming && !answer

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
        ) : waitingForFirstToken ? (
          <TypingDots />
        ) : (
          <AnswerText text={answer} streaming={isStreaming} />
        )}
      </div>
    </div>
  )
}

export default React.memo(AssistantMessage)
