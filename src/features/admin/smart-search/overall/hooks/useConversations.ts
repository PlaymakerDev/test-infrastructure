"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  deleteConversation as apiDelete,
  fetchConversation,
  fetchConversations,
  renameConversation as apiRename,
} from "@/services/routes/ChatService"
import type { ConversationDetail, ConversationSummary } from "@/types/chat"

// Pinned/starred conversations (Future #6) — client-only, persisted locally.
const PIN_KEY = "smart-search:pinned-chats"

/**
 * Server-state for the conversation sidebar: the list plus an in-memory detail
 * cache so switching rooms (and hover-prefetch) is instant without a refetch.
 */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [pinnedIds, setPinnedIds] = useState<ReadonlySet<string>>(new Set())
  const detailCache = useRef<Map<string, ConversationDetail>>(new Map())

  // Restore pins after mount (deferred to keep the first render SSR-stable).
  useEffect(() => {
    const saved = window.localStorage.getItem(PIN_KEY)
    if (!saved) return
    const id = requestAnimationFrame(() => {
      try {
        setPinnedIds(new Set(JSON.parse(saved) as string[]))
      } catch {
        // ignore malformed storage
      }
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      window.localStorage.setItem(PIN_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    setLoadingList(true)
    try {
      setConversations(await fetchConversations())
    } catch {
      // keep the previous list on failure
    } finally {
      setLoadingList(false)
    }
  }, [])

  const getDetail = useCallback(
    async (id: string): Promise<ConversationDetail | null> => {
      const cached = detailCache.current.get(id)
      if (cached) return cached
      try {
        const detail = await fetchConversation(id)
        detailCache.current.set(id, detail)
        return detail
      } catch {
        return null
      }
    },
    [],
  )

  const prefetch = useCallback((id: string) => {
    if (detailCache.current.has(id)) return
    fetchConversation(id)
      .then((detail) => detailCache.current.set(id, detail))
      .catch(() => {})
  }, [])

  const rename = useCallback(async (id: string, title: string) => {
    await apiRename(id, title)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    )
    const cached = detailCache.current.get(id)
    if (cached) detailCache.current.set(id, { ...cached, title })
  }, [])

  const remove = useCallback(async (id: string) => {
    await apiDelete(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
    detailCache.current.delete(id)
  }, [])

  // Drop a cached detail so the next open refetches (e.g. after a new turn was
  // persisted server-side).
  const invalidate = useCallback((id: string) => {
    detailCache.current.delete(id)
  }, [])

  // Best-effort content match for the sidebar search: title always; plus any
  // already-cached conversation detail (questions/answers) so opened chats are
  // searchable by content too. (Full content search needs a backend endpoint.)
  const contentMatches = useCallback((id: string, query: string): boolean => {
    const detail = detailCache.current.get(id)
    if (!detail) return false
    return detail.messages.some(
      (m) =>
        m.question.toLowerCase().includes(query) ||
        m.answer.toLowerCase().includes(query),
    )
  }, [])

  const removePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      window.localStorage.setItem(PIN_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  return {
    conversations,
    loadingList,
    pinnedIds,
    togglePin,
    removePin,
    contentMatches,
    refresh,
    getDetail,
    prefetch,
    rename,
    remove,
    invalidate,
  }
}
