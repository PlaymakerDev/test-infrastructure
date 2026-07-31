"use client"
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMap from '@/components/map/ReactMap'
import { useAppDispatch } from '@/stores/hooks'
import { getExampleData } from '@/stores/reducers/example/exampleSlice'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import useMapFocusMode from '@/utils/hooks/useMapFocusMode'
import { DeptIdOverrideContext } from '@/hooks/useDeptId'
import {
  AccidentChart,
  Notification,
  RatioChart,
  StatusChart,
  TrafficStat,
  VehicleRatioChart,
} from '../components'
import { DashboardProvider } from '../context'

interface Props { }

// Avoid mounting both layouts at once — keeps ECharts from initializing
// inside hidden (display:none) DOM where clientWidth/Height is 0.
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)")
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [])
  return isDesktop
}

const DashboardContent: React.FC<Props> = () => {
  const dispatch = useAppDispatch()
  const isDesktop = useIsDesktop()
  const searchParams = useSearchParams()

  // Snapshot the URL's dept_id on first mount:
  //   • `originalDeptId` never changes — the "← ทั่วประเทศ" reset button
  //     reverts to it (drr-10 → 49 = สทช.10, drr-cmi → 50, super-admin → 0;
  //     NOTE dept row id ≠ เลขสทช. — id 10 is ขทช.ชัยนาท, verified 2026-07-14).
  //   • `currentDeptId` is the LIVE dept scope. Every card that reads
  //     `useDeptId()` sees this value via `DeptIdOverrideContext` below,
  //     and refetches when it changes. Updated in place by map clicks /
  //     pans / marker interactions — NEVER by touching the URL, because
  //     `router.replace()` remounts BaseMap and flickers the map.
  const [originalDeptId] = useState<string>(
    () => searchParams.get('dept_id') ?? '0'
  )
  const [currentDeptId, setCurrentDeptId] = useState<string>(
    () => searchParams.get('dept_id') ?? '0'
  )
  // Snapshot scope on first mount (mirrors originalDeptId). scope=all + dept 0
  // is the nationwide overview; anything else is a dept-scoped landing.
  const [originalScopeAll] = useState<boolean>(
    () => searchParams.get('scope') === 'all'
  )
  // The map-only landing intro applies ONLY to the country overview. A
  // dept-scoped URL (?dept_id=50) auto-zooms into its own markers (handled in
  // ReactMap) and shows every card immediately — no intro.
  const isCountryLanding = originalDeptId === '0' && originalScopeAll
  // Landing behaviour: the dashboard opens map-only — every overlay card is
  // hidden (Map Focus Mode 'both') so the user sees just the map first. The
  // moment they click a device marker the hidden cards slide back in.
  const { setMode } = useMapFocusMode()

  useEffect(() => {
    // Country overview → hide all overlays on entry (map-only), reveal on the
    // first marker click. Dept-scoped landing → show everything right away.
    // Always restore on leave so focus mode never leaks to another page.
    if (!isCountryLanding) {
      setMode('off')
      return
    }
    setMode('both')
    return () => setMode('off')
  }, [setMode, isCountryLanding])

  // Reveal the hidden overlays once a marker is clicked.
  const handleMarkerClick = useCallback(() => {
    setMode('off')
  }, [setMode])

  // Reveal them on province/สำนัก drill-in too — ReactMap fires this when the
  // province context activates (polygon click → flyTo, or zooming past the
  // province threshold). Was reduced to a no-op in 5e53337, which left the
  // cards permanently hidden when the user drilled in via polygons instead of
  // markers (reported 2026-07-23). Marker clicks + province drill-ins now
  // both end the map-only intro.
  const handleProvinceActivate = useCallback(() => {
    setMode('off')
  }, [setMode])

  useEffect(() => {
    dispatch(getExampleData())
  }, [dispatch])

  return (
    <DeptIdOverrideContext.Provider value={currentDeptId}>
      <div className="relative w-screen h-screen overflow-hidden bg-[#050d1a]">
        {/* MAP */}
        <ReactMap
          originalDeptId={originalDeptId}
          originalScopeAll={originalScopeAll}
          onDeptIdChange={setCurrentDeptId}
          onProvinceActivate={handleProvinceActivate}
          onMarkerClick={handleMarkerClick}
        />

        {isDesktop === true && (
          <>
            {/* DESKTOP: left absolute panels — top:52 = navbar (48) + 4px breathing */}
            {/* bottom: 160 — the stack is bottom-anchored (flex-1 spacer above), so
            * this pins AccidentChart's lower edge ~12px above the KPI tile strip
            * (strip top ≈ 16 + ~132px bar) — same 12px rhythm as the panel's own
            * gap-3 between StatusChart and AccidentChart (2026-07-20). */}
            <MapOverlayPanel
              position="left"
              className="absolute left-4 z-10 flex flex-col gap-3"
              style={{ top: 52, bottom: 160, width: 620 }}
            >
              <div className="flex-1" />
              {/* Full rail width (620) — was 530; enlarged per design 2026-07-13. */}
              <div className="flex">
                <StatusChart />
              </div>
              <AccidentChart />
            </MapOverlayPanel>

            {/* DESKTOP: KPI tile row — width follows content (140px per visible
            * tile inside RatioChart). position="left" so the hide toggle slides
            * it off the LEFT edge (not down) — it's a left-rail card, so it also
            * hides together with the left panels under 'left' focus mode
            * (2026-07-24 request). */}
            <MapOverlayPanel
              position="left"
              className="absolute left-4 z-10 flex"
              style={{ bottom: 16, maxWidth: 'calc(100vw - 32px)' }}
            >
              <RatioChart size={110} />
            </MapOverlayPanel>

            {/* DESKTOP: right absolute panel — top:48 sits right under the 48px navbar.
            * VehicleRatioChart `flex-1 min-h-0` so it absorbs whatever space
            * Notification + TrafficStat don't use → no empty gap at the bottom. */}
            <MapOverlayPanel
              position="right"
              className="absolute right-4 z-10 flex flex-col gap-2"
              style={{ top: 64, bottom: 16, width: 340 }}
            >
              <Notification />
              <VehicleRatioChart className="flex-1 min-h-0" />
              <TrafficStat />
            </MapOverlayPanel>
          </>
        )}

        {isDesktop === false && (
          <>
            {/* MOBILE: notification — compact pill below the navbar (48px) so it
            * sits beside the centered filter pills + breadcrumb without covering them. */}
            <MapOverlayPanel
              position="top"
              className="absolute z-20 right-3"
              style={{ top: 60 }}
            >
              <Notification compact />
            </MapOverlayPanel>

            {/* MOBILE: scrollable column — map takes top 60vh, cards bottom 40vh */}
            <MapOverlayPanel
              position="bottom"
              className="absolute left-0 right-0 overflow-y-auto z-10"
              style={{ top: "60vh", bottom: 0 }}
            >
              <div className="flex flex-col gap-3 p-3 pb-8">
                <div className="flex">
                  <StatusChart />
                </div>
                <AccidentChart />
                <VehicleRatioChart />
                <RatioChart cols={4} size={90} />
                <TrafficStat />
              </div>
            </MapOverlayPanel>
          </>
        )}
      </div>
    </DeptIdOverrideContext.Provider>
  )
}

const DashboardScreen: React.FC<Props> = (props) => {
  const { } = props

  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}

export default React.memo<Props>(DashboardScreen)