"use client"
import React from "react"
import { useSmartSearchContext } from "../context"
import EmptyState from "./EmptyState"
import MessageList from "./MessageList"

const ChatWindow: React.FC = () => {
  const { turns } = useSmartSearchContext()

  return (
    <div className="flex-1 min-h-0">
      {turns.length === 0 ? <EmptyState /> : <MessageList turns={turns} />}
    </div>
  )
}

export default React.memo(ChatWindow)
