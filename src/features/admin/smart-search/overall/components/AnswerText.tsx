"use client"
import React from "react"

interface Props {
  text: string
  streaming?: boolean
}

// Renders the streamed natural-language answer. Plain text with preserved
// whitespace for now; safe streaming-markdown is a later rendering-quality
// enhancement. Wrapped in aria-live so screen readers announce updates.
const AnswerText: React.FC<Props> = ({ text, streaming }) => {
  return (
    <p
      aria-live="polite"
      className="text-white whitespace-pre-wrap break-words leading-relaxed"
    >
      {text}
      {streaming && (
        <span className="ml-0.5 inline-block w-2 h-4 align-middle bg-(--yellow) animate-pulse" />
      )}
    </p>
  )
}

export default React.memo(AnswerText)
