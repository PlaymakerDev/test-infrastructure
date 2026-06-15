"use client"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAskStream } from "../hooks/useAskStream"
import { useConversations } from "../hooks/useConversations"
import type {
  AskMode,
  ChatTurn,
  ConversationMessage,
  ConversationSummary,
} from "@/types/chat"

const DRAFT_KEY = "smart-search:draft"

// Re-hydrate a persisted message into a UI turn (full fidelity, already done).
const messageToTurn = (message: ConversationMessage): ChatTurn => ({
  id: message.id,
  question: message.question,
  answer: message.answer,
  result: message.result,
  chart: message.chart,
  suggestions: message.suggestions,
  confidence: message.confidence,
  messageId: message.id,
  status: "done",
  mode: "fast",
})

export interface SmartSearchContextProps {
  conversationId: string | null
  turns: ChatTurn[]
  isStreaming: boolean
  mode: AskMode
  setMode: (mode: AskMode) => void
  draft: string
  setDraft: (value: string) => void
  send: (text: string, opts?: { mode?: AskMode }) => void
  stop: () => void
  newChat: () => void
  // Conversation history
  conversations: ConversationSummary[]
  loadingList: boolean
  openConversation: (id: string) => void
  prefetchConversation: (id: string) => void
  renameConversation: (id: string, title: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const SmartSearchContext = createContext<SmartSearchContextProps | null>(
  null,
)

export const SmartSearchProvider = (props: PageProviderProps) => {
  const { children } = props
  const conversations = useConversations()
  const { refresh: refreshConversations } = conversations

  // After a turn is persisted, drop its stale cached detail and refresh the
  // sidebar so a brand-new room appears with its generated title.
  const handlePersisted = useCallback(
    (conversationId: string) => {
      conversations.invalidate(conversationId)
      void conversations.refresh()
    },
    [conversations],
  )

  const chat = useAskStream(handlePersisted)
  const [draft, setDraft] = useState("")

  // Initial sidebar load.
  useEffect(() => {
    void refreshConversations()
  }, [refreshConversations])

  // Restore a draft the user left behind, persist it as they type. The set is
  // deferred out of the effect body (rAF) to keep the first render in sync with
  // SSR and avoid a cascading synchronous render.
  useEffect(() => {
    const saved = window.localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    const id = requestAnimationFrame(() => setDraft(saved))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (draft) window.localStorage.setItem(DRAFT_KEY, draft)
    else window.localStorage.removeItem(DRAFT_KEY)
  }, [draft])

  const openConversation = useCallback(
    async (id: string) => {
      const detail = await conversations.getDetail(id)
      if (!detail) return
      chat.loadConversation(id, detail.messages.map(messageToTurn))
    },
    [conversations, chat],
  )

  const deleteConversation = useCallback(
    async (id: string) => {
      await conversations.remove(id)
      if (chat.conversationId === id) chat.newChat()
    },
    [conversations, chat],
  )

  return (
    <SmartSearchContext.Provider
      value={{
        conversationId: chat.conversationId,
        turns: chat.turns,
        isStreaming: chat.isStreaming,
        mode: chat.mode,
        setMode: chat.setMode,
        send: chat.send,
        stop: chat.stop,
        newChat: chat.newChat,
        draft,
        setDraft,
        conversations: conversations.conversations,
        loadingList: conversations.loadingList,
        openConversation,
        prefetchConversation: conversations.prefetch,
        renameConversation: conversations.rename,
        deleteConversation,
      }}
    >
      {children}
    </SmartSearchContext.Provider>
  )
}

export const useSmartSearchContext = () => {
  const context = useContext(SmartSearchContext)
  if (!context) {
    throw new Error(
      "useSmartSearchContext must be used within a SmartSearchProvider",
    )
  }
  return context
}
