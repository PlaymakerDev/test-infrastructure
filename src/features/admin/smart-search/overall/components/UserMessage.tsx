"use client"
import React from "react"

interface Props {
  question: string
}

const UserMessage: React.FC<Props> = ({ question }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-(--yellow)/15 border border-(--yellow)/30 px-4 py-2.5">
        <p className="text-white whitespace-pre-wrap break-words">{question}</p>
      </div>
    </div>
  )
}

export default React.memo(UserMessage)
