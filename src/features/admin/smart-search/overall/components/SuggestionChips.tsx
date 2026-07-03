"use client"
import React from "react"
import { useSmartSearchContext } from "../context"

interface Props {
  questions: string[]
}

// Follow-up question chips — clicking sends the chip text as the next question.
const SuggestionChips: React.FC<Props> = ({ questions }) => {
  const { send, isStreaming } = useSmartSearchContext()

  // The backend can repeat a suggestion — drop duplicates (also keeps keys unique).
  const unique = Array.from(new Set(questions))
  if (!unique.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {unique.map((q) => (
        <button
          key={q}
          type="button"
          disabled={isStreaming}
          onClick={() => send(q)}
          className="fs-12 px-3 py-1.5 rounded-full border border-(--yellow)/40 text-white/80 hover:border-(--yellow) hover:text-(--yellow) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {q}
        </button>
      ))}
    </div>
  )
}

export default React.memo(SuggestionChips)
