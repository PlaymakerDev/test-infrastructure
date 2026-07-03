"use client"
import { useEffect, useState } from "react"
import { fetchScope } from "@/services/routes/ChatService"
import type { ScopeResponse } from "@/types/chat"

// The user's map scope (§5.1) is constant per session, so fetch it once and
// cache module-wide. A failed/absent endpoint resolves to null → callers treat
// it as unscoped (whole country).
let cache: ScopeResponse | null = null
let settled = false
let inFlight: Promise<ScopeResponse | null> | null = null

function load(): Promise<ScopeResponse | null> {
  if (settled) return Promise.resolve(cache)
  if (!inFlight) {
    inFlight = fetchScope()
      .then((s) => s)
      .catch(() => null)
      .then((s) => {
        cache = s
        settled = true
        inFlight = null
        return s
      })
  }
  return inFlight
}

export function useScope(): { scope: ScopeResponse | null; loaded: boolean } {
  const [scope, setScope] = useState<ScopeResponse | null>(cache)
  const [loaded, setLoaded] = useState(settled)

  useEffect(() => {
    if (loaded) return
    let alive = true
    load().then((s) => {
      if (!alive) return
      setScope(s)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [loaded])

  return { scope, loaded }
}
