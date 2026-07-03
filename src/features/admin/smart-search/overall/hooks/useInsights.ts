"use client"
import { useCallback, useEffect, useState } from "react"
import { fetchInsights } from "@/services/routes/ChatService"
import type { Insight } from "@/types/chat"

// Proactive insights for the empty state (device-offline alerts + traffic movers).
export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchInsights()
      setInsights(data.insights ?? [])
    } catch {
      setInsights([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { insights, loading }
}
