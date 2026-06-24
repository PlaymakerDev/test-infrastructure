"use client"
import { useCallback, useEffect, useState } from "react"
import type { AskMode } from "@/types/chat"

// Pinned questions shown as live cards on the dashboard (Future #1). Client-only,
// persisted locally; each card re-runs its question to stay fresh.
export interface DashboardPin {
  id: string
  question: string
  mode: AskMode
}

const KEY = "smart-search:dashboard-pins"

export function useDashboardPins() {
  const [pins, setPins] = useState<DashboardPin[]>([])

  // Restore after mount (deferred to keep the first render SSR-stable).
  useEffect(() => {
    const saved = window.localStorage.getItem(KEY)
    if (!saved) return
    const id = requestAnimationFrame(() => {
      try {
        setPins(JSON.parse(saved) as DashboardPin[])
      } catch {
        // ignore malformed storage
      }
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const persist = (next: DashboardPin[]) => {
    window.localStorage.setItem(KEY, JSON.stringify(next))
    return next
  }

  const addPin = useCallback((question: string, mode: AskMode) => {
    setPins((prev) =>
      prev.some((p) => p.question === question)
        ? prev
        : persist([
            ...prev,
            { id: globalThis.crypto.randomUUID(), question, mode },
          ]),
    )
  }, [])

  const removePin = useCallback((id: string) => {
    setPins((prev) => persist(prev.filter((p) => p.id !== id)))
  }, [])

  const isPinned = useCallback(
    (question: string) => pins.some((p) => p.question === question),
    [pins],
  )

  return { pins, addPin, removePin, isPinned }
}
