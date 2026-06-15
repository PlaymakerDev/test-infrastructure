"use client"
import { useCallback, useRef, useState } from "react"
import { streamAsk } from "@/services/chatStream"
import type { AskMode, ChatTurn } from "@/types/chat"

const newId = () => crypto.randomUUID()

/**
 * Owns the streaming chat session for one conversation room: the turn list,
 * the streaming flag, the active conversation id (created lazily, client-side)
 * and the accurate/fast mode. Streaming tokens are batched with
 * requestAnimationFrame so the message list re-renders at most once per frame.
 */
export function useAskStream() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<AskMode>("fast")

  const abortRef = useRef<AbortController | null>(null)

  // ── Token batching (rAF) ──
  const tokenBufferRef = useRef("")
  const rafRef = useRef<number | null>(null)
  const activeTurnIdRef = useRef<string | null>(null)

  const patchTurn = useCallback((id: string, patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const flushTokens = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    const buffered = tokenBufferRef.current
    const turnId = activeTurnIdRef.current
    if (!buffered || !turnId) return
    tokenBufferRef.current = ""
    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId ? { ...t, answer: t.answer + buffered } : t,
      ),
    )
  }, [])

  const scheduleFlush = useCallback(() => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(flushTokens)
  }, [flushTokens])

  const send = useCallback(
    async (rawText: string, opts?: { mode?: AskMode }) => {
      const text = rawText.trim()
      if (!text || isStreaming) return

      // Lazy conversation: client generates the uuid on the first turn.
      let convId = conversationId
      if (!convId) {
        convId = newId()
        setConversationId(convId)
      }

      const turnId = newId()
      const useMode = opts?.mode ?? mode
      activeTurnIdRef.current = turnId
      tokenBufferRef.current = ""

      setTurns((prev) => [
        ...prev,
        { id: turnId, question: text, answer: "", status: "streaming", mode: useMode },
      ])
      setIsStreaming(true)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        await streamAsk(
          { message: text, conversation_id: convId, stream: true, mode: useMode },
          {
            onResult: (p) => patchTurn(turnId, { result: p }),
            onChart: (c) => patchTurn(turnId, { chart: c }),
            onToken: (t) => {
              tokenBufferRef.current += t
              scheduleFlush()
            },
            onSuggestions: (q) => patchTurn(turnId, { suggestions: q }),
            onExport: (p) => patchTurn(turnId, { exportHint: p }),
            onError: (msg) => {
              flushTokens()
              patchTurn(turnId, { status: "error", errorMessage: msg })
            },
            onDone: (d) => {
              flushTokens()
              patchTurn(turnId, {
                status: "done",
                confidence: d.confidence,
                messageId: d.message_id,
              })
            },
          },
          controller.signal,
        )
      } catch (err) {
        flushTokens()
        if ((err as Error)?.name === "AbortError") {
          patchTurn(turnId, { status: "done" }) // user stopped
        } else {
          patchTurn(turnId, {
            status: "error",
            errorMessage: "การเชื่อมต่อขัดข้อง กรุณาลองใหม่อีกครั้ง",
          })
        }
      } finally {
        flushTokens()
        setIsStreaming(false)
        abortRef.current = null
        activeTurnIdRef.current = null
      }
    },
    [conversationId, isStreaming, mode, patchTurn, scheduleFlush, flushTokens],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    setConversationId(null)
    setTurns([])
    setIsStreaming(false)
  }, [])

  return { conversationId, turns, isStreaming, mode, setMode, send, stop, newChat }
}
