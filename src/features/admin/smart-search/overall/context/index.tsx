"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useAskStream } from "../hooks/useAskStream"
import type { AskMode, ChatTurn } from "@/types/chat"

const DRAFT_KEY = "smart-search:draft"

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
}

export interface PageProviderProps {
  children: React.ReactNode
}

export const SmartSearchContext = createContext<SmartSearchContextProps | null>(
  null,
)

export const SmartSearchProvider = (props: PageProviderProps) => {
  const { children } = props
  const chat = useAskStream()
  const [draft, setDraft] = useState("")

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

  return (
    <SmartSearchContext.Provider value={{ ...chat, draft, setDraft }}>
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
