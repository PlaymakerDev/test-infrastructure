"use client"
import React, { createElement, useEffect, useMemo, useState } from 'react'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { SYSTEMS, type SystemType } from '@/features/admin/dashboard/data/systems'
import { BUREAU_BY_STCH } from '@/features/admin/dashboard/data/bureaus'
import { SYSTEM_ICONS } from '../hooks/useDeviceIcon'
import { useDashboardPosition } from '@/hooks/queries/dashboard'
import { useLPRPoints } from '@/hooks/queries/lpr'
import { useDepartments } from '@/hooks/queries/manage'
import { useDeptId } from '@/hooks/useDeptId'
import { useBureauFeatures } from '../hooks/useBureauFeatures'
import { useMap } from '../hooks/useMap'
import HTMLMarker from '../primitives/HTMLMarker'

// Same aggregation ladder cutoffs as the dashboard (ReactMap): สทช. bubbles
// below 6.5 → ขทช. bubbles 6.5–9 → the menu's own device pins above 9 (the
// pin layer gets `minZoom={REGION_DEVICE_MIN_ZOOM}` so the tiers swap cleanly).
const STCH_HIDE_ZOOM = 6.5
const DEPT_HIDE_ZOOM = 9
export const REGION_DEVICE_MIN_ZOOM = DEPT_HIDE_ZOOM

// solution_type_id in /manage/solution/{dept}/position — keyed by the FE
// SystemType (matches SOLUTION_TYPE in types/manage/solution-api.ts). LPR is
// absent from /position; its points come from GET /lpr/points instead.
const SOLUTION_TYPE_ID: Partial<Record<SystemType, number>> = {
  CCTV: 1,
  Counting: 2,
  Analytic: 3,
  Traffic: 4,
  CrossWalk: 5,
  Lighting: 6,
  VMS: 7,
  Tunnel: 8,
  WIM: 9,
  BridgeLighting: 10,
}

const stchShortLabel = (stch: number): string => {
  const b = BUREAU_BY_STCH[stch]
  if (b) return b.name
  if (stch === 0) return 'ทช.ส่วนกลาง'
  return `สทช.${stch}`
}

interface Acc {
  count: number
  sumLng: number
  sumLat: number
  tCount: number
  tSumLng: number
  tSumLat: number
}

const addTo = (m: Record<number, Acc>, key: number, lng: number, lat: number, trusted: boolean) => {
  const a = m[key] ?? (m[key] = { count: 0, sumLng: 0, sumLat: 0, tCount: 0, tSumLng: 0, tSumLat: 0 })
  a.count++
  a.sumLng += lng
  a.sumLat += lat
  if (trusted) {
    a.tCount++
    a.tSumLng += lng
    a.tSumLat += lat
  }
}

// Trusted mean first (device sits inside its own สทช.'s polygon); plain mean
// only when the whole bucket is untrusted. Same rule as the dashboard — keeps
// placeholder coords (e.g. the [1,1] batch found 2026-08-03) from dragging a
// bubble out of its region.
const centroidOf = (a: Acc): [number, number] =>
  a.tCount > 0 ? [a.tSumLng / a.tCount, a.tSumLat / a.tCount] : [a.sumLng / a.count, a.sumLat / a.count]

interface Props {
  /** Menu system — picks data slice, bubble color, and glyph. */
  type: SystemType
}

/**
 * Two-tier org-aggregation bubbles for the menu overall maps: one bubble per
 * สทช. at country zoom, one per ขทช. at region zoom, then the menu's own pin
 * layer takes over (give it `minZoom={REGION_DEVICE_MIN_ZOOM}`). Bubbles wear
 * the menu's own color + glyph (NOT the dashboard's yellow) with the org name
 * pinned underneath — per 2026-08-05 request. Counts come from the same
 * /position endpoint the dashboard aggregates (LPR: /lpr/points), so the
 * grouping matches the dashboard's and scope=all vs own is handled by the
 * shared hooks. Must render inside a `BaseMap`.
 */
const RegionSummaryLayer: React.FC<Props> = ({ type }) => {
  const { map, isLoaded } = useMap()
  const deptId = useDeptId()
  const isLpr = type === 'LPR'
  // Both hooks are cache-shared with the dashboard; the unused one is disabled.
  const { data: position } = useDashboardPosition(isLpr ? null : deptId)
  const { data: lprPoints } = useLPRPoints()
  const { data: departments } = useDepartments()
  const bureauFeatures = useBureauFeatures()

  const deptLabels = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of departments ?? []) m.set(d.id, d.department_short_name)
    return m
  }, [departments])

  const { stchSummaries, deptSummaries } = useMemo(() => {
    const typeId = SOLUTION_TYPE_ID[type]
    const points: { lng: number; lat: number; stch: number; deptId: number }[] = isLpr
      ? (lprPoints ?? [])
          .filter((p) => Number.isFinite(p.lng) && Number.isFinite(p.lat) && !(p.lng === 0 && p.lat === 0))
          .map((p) => ({ lng: p.lng, lat: p.lat, stch: 0, deptId: p.department_id ?? 0 }))
      : (position?.locations ?? [])
          .filter((l) => l.solution.solution_type_id === typeId)
          .filter((l) => Array.isArray(l.geometry_point) && l.geometry_point.length === 2)
          .map((l) => ({
            lng: l.geometry_point![0],
            lat: l.geometry_point![1],
            stch: l.road.stch ?? 0,
            deptId: l.road.department_id ?? 0,
          }))

    const inBureau = (lng: number, lat: number, stch: number): boolean | null => {
      if (!bureauFeatures) return null
      const bf = bureauFeatures.find((b) => b.stch === stch)
      if (!bf) return null
      const [minX, minY, maxX, maxY] = bf.bbox
      if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false
      return booleanPointInPolygon([lng, lat], bf.feature)
    }

    const stchAcc: Record<number, Acc> = {}
    const deptAcc: Record<number, Acc> = {}
    for (const p of points) {
      // Reclassify orphan stch (0/20/21 — บทช., กรมทางหลวง, ด่านชั่ง) by
      // spatial containment, mirroring the dashboard's bucketing. A point
      // whose claimed stch has a polygon is trusted only when it sits inside.
      let bucket = p.stch
      let trusted = true
      const inOwn = inBureau(p.lng, p.lat, p.stch)
      if (inOwn === false) trusted = false
      if (!BUREAU_BY_STCH[bucket] && bureauFeatures) {
        const hit = bureauFeatures.find((b) => {
          const [minX, minY, maxX, maxY] = b.bbox
          if (p.lng < minX || p.lng > maxX || p.lat < minY || p.lat > maxY) return false
          return booleanPointInPolygon([p.lng, p.lat], b.feature)
        })
        bucket = hit ? hit.stch : 0
        // Bucket chosen FROM the coordinate — by construction trustworthy.
        trusted = hit ? true : trusted
      }
      addTo(stchAcc, bucket, p.lng, p.lat, trusted)
      addTo(deptAcc, p.deptId, p.lng, p.lat, trusted)
    }

    const stch: Record<number, { count: number; centroid: [number, number] }> = {}
    for (const [k, a] of Object.entries(stchAcc)) stch[Number(k)] = { count: a.count, centroid: centroidOf(a) }
    const dept: Record<number, { count: number; centroid: [number, number] }> = {}
    for (const [k, a] of Object.entries(deptAcc)) dept[Number(k)] = { count: a.count, centroid: centroidOf(a) }
    return { stchSummaries: stch, deptSummaries: dept }
  }, [type, isLpr, position, lprPoints, bureauFeatures])

  // Which tier shows — tracks zoom exactly like the dashboard's summary tiers.
  const [tier, setTier] = useState<'stch' | 'dept' | 'none'>('stch')
  useEffect(() => {
    if (!map || !isLoaded) return
    const update = () => {
      const z = map.getZoom()
      setTier(z < STCH_HIDE_ZOOM ? 'stch' : z < DEPT_HIDE_ZOOM ? 'dept' : 'none')
    }
    update()
    map.on('zoom', update)
    return () => {
      map.off('zoom', update)
    }
  }, [map, isLoaded])

  const color = SYSTEMS[type].color
  const Icon = SYSTEM_ICONS[type]

  const bubble = (count: number, label: string, size: number) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {/* Same visual language as the menu's cluster circles (menu color fill,
          white ring, glyph over count) — just aggregated per org tier. */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          border: '2px solid #fff',
          boxShadow: '0 0 10px rgba(0,0,0,0.55)',
          fontWeight: 700,
          fontSize: 'var(--fs-12)',
          lineHeight: 1,
        }}
      >
        {createElement(Icon, { size: 15 })}
        <span>{count}</span>
      </div>
      <div
        style={{
          padding: '2px 8px',
          borderRadius: 999,
          background: 'rgba(5,13,26,0.88)',
          border: '1px solid rgba(255,255,255,0.28)',
          color: '#fff',
          fontSize: 'var(--fs-12)',
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </div>
    </div>
  )

  return (
    <>
      {Object.entries(stchSummaries).map(([k, info]) => {
        const stch = Number(k)
        if (!info || info.count === 0) return null
        return (
          <HTMLMarker
            key={`stch-${stch}`}
            lngLat={info.centroid}
            visible={tier === 'stch'}
            onClick={() => map?.flyTo({ center: info.centroid, zoom: 7.5, duration: 1200 })}
          >
            {bubble(info.count, stchShortLabel(stch), 48)}
          </HTMLMarker>
        )
      })}
      {Object.entries(deptSummaries).map(([k, info]) => {
        const id = Number(k)
        if (!info || info.count === 0) return null
        const label = deptLabels.get(id) ?? (id === 0 ? 'ส่วนกลาง' : `ขทช. #${id}`)
        return (
          <HTMLMarker
            key={`dept-${id}`}
            lngLat={info.centroid}
            visible={tier === 'dept'}
            onClick={() => map?.flyTo({ center: info.centroid, zoom: 10, duration: 1200 })}
          >
            {bubble(info.count, label, 40)}
          </HTMLMarker>
        )
      })}
    </>
  )
}

export default React.memo(RegionSummaryLayer)
