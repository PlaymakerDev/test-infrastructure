"use client"
import { useCallback, useRef, useState } from "react"
import {
  deleteConversation as apiDelete,
  fetchConversation,
  fetchConversations,
  renameConversation as apiRename,
} from "@/services/routes/ChatService"
import type { ConversationDetail, ConversationSummary } from "@/types/chat"

/**
 * Server-state for the conversation sidebar: the list plus an in-memory detail
 * cache so switching rooms (and hover-prefetch) is instant without a refetch.
 */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const detailCache = useRef<Map<string, ConversationDetail>>(new Map())

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

  return {
    conversations,
    loadingList,
    refresh,
    getDetail,
    prefetch,
    rename,
    remove,
    invalidate,
  }
}
