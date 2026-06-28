"use client"
import { useEffect, useState } from 'react'
import type { TrafficLightingProject } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects'

export interface LightingDetailBootstrap {
  type: string
  imei: string
  row: Partial<TrafficLightingProject> | null
  ready: boolean
}

/** Read sessionStorage + URL params on the client after mount (avoids hydration mismatch). */
export function useLightingDetailBootstrap(
  id: string,
  options?: { includeType?: boolean },
): LightingDetailBootstrap {
  const [type, setType] = useState('')
  const [imei, setImei] = useState(id)
  const [row, setRow] = useState<Partial<TrafficLightingProject> | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (options?.includeType !== false) {
      setType(sessionStorage.getItem('lighting_detail_type') ?? params.get('type') ?? '')
    }
    setImei(sessionStorage.getItem('lighting_detail_imei') ?? params.get('imei') ?? id)
    const raw = sessionStorage.getItem('lighting_detail_row')
    if (raw) {
      try {
        setRow(JSON.parse(raw) as Partial<TrafficLightingProject>)
      } catch {
        /* ignore bad JSON */
      }
    }
    setReady(true)
  }, [id, options?.includeType])

  return { type, imei, row, ready }
}
