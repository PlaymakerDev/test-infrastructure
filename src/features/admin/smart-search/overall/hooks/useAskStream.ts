"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { streamAsk } from "@/services/chatStream"
import type { AskMode, ChatTurn } from "@/types/chat"

const newId = () => crypto.randomUUID()

/**
 * Owns the streaming chat session for one conversation room: the turn list,
 * the streaming flag, the active conversation id (created lazily, client-side)
 * and the accurate/fast mode. Streaming tokens are batched with
 * requestAnimationFrame so the message list re-renders at most once per frame.
 *
 * `onPersisted(conversationId)` fires after a turn finishes successfully — the
 * server has now persisted the conversation, so the caller can refetch the
 * sidebar (the new room appears with its LLM-generated title).
 */
export function useAskStream(onPersisted?: (conversationId: string) => void) {
  const onPersistedRef = useRef(onPersisted)
  onPersistedRef.current = onPersisted

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [mode, setMode] = useState<AskMode>("fast")

  const abortRef = useRef<AbortController | null>(null)
  // Synchronous in-flight guard — `isStreaming` is async state, so a rapid
  // second send() (before re-render) would otherwise start a parallel stream.
  const inFlightRef = useRef(false)

  // ── Token batching (rAF) ──
  const tokenBufferRef = useRef("")
  const rafRef = useRef<number | null>(null)
  const activeTurnIdRef = useRef<string | null>(null)

  // Abort the stream + cancel any pending flush when the component unmounts
  // (e.g. navigating away mid-answer) — no leaked fetch or setState-after-unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

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
      if (!text || inFlightRef.current) return
      inFlightRef.current = true

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
            onProvenance: (p) => patchTurn(turnId, { provenance: p }),
            onExport: (p) => patchTurn(turnId, { exportHint: p }),
            onError: (msg, kind) => {
              flushTokens()
              patchTurn(turnId, { status: "error", errorMessage: msg, errorKind: kind })
            },
            onDone: (d) => {
              flushTokens()
              patchTurn(turnId, {
                status: "done",
                confidence: d.confidence,
                messageId: d.message_id,
              })
              // Turn persisted server-side → let the caller refresh the sidebar.
              onPersistedRef.current?.(convId)
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
            errorKind: "generic",
          })
        }
      } finally {
        flushTokens()
        setIsStreaming(false)
        inFlightRef.current = false
        abortRef.current = null
        activeTurnIdRef.current = null
      }
    },
    [conversationId, mode, patchTurn, scheduleFlush, flushTokens],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    inFlightRef.current = false
    setConversationId(null)
    setTurns([])
    setIsStreaming(false)
  }, [])

  // Open an existing conversation: replace the session with its persisted turns.
  const loadConversation = useCallback(
    (id: string, loadedTurns: ChatTurn[]) => {
      abortRef.current?.abort()
      inFlightRef.current = false
      setConversationId(id)
      setTurns(loadedTurns)
      setIsStreaming(false)
    },
    [],
  )

  return {
    conversationId,
    turns,
    isStreaming,
    mode,
    setMode,
    send,
    stop,
    newChat,
    loadConversation,
  }
}
