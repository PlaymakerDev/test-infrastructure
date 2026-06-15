"use client"
import React from "react"

interface Props {
  question: string
}

const UserMessage: React.FC<Props> = ({ question }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-(--yellow)/10 border border-(--yellow)/20 px-4 py-2.5">
        <p className="text-white/90 whitespace-pre-wrap break-words leading-relaxed">
          {question}
        </p>
      </div>
    </div>
  )
}

export default React.memo(UserMessage)
