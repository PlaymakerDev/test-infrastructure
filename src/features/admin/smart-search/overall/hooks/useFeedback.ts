"use client"
import { useCallback, useState } from "react"
import { submitFeedback } from "@/services/routes/ChatService"
import type { FeedbackVote } from "@/types/chat"

// 👍/👎 on a turn. The vote references the turn by message_id; the backend
// resolves the question + SQL itself (no SQL leaves the server).
export function useFeedback() {
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(
    async (
      conversationId: string,
      messageId: string,
      vote: FeedbackVote,
      note?: string,
    ): Promise<boolean> => {
      setSubmitting(true)
      try {
        await submitFeedback({
          conversation_id: conversationId,
          message_id: messageId,
          vote,
          note,
        })
        return true
      } catch {
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [],
  )

  return { submitting, submit }
}
