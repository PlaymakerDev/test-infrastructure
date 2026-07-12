"use client"
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMap from '@/components/map/ReactMap'
import { useAppDispatch } from '@/stores/hooks'
import { getExampleData } from '@/stores/reducers/example/exampleSlice'
import MapOverlayPanel from '@/components/section/MapOverlayPanel'
import { DeptIdOverrideContext } from '@/hooks/useDeptId'
import {
  AccidentChart,
  Notification,
  RatioChart,
  StatusChart,
  TrafficStat,
  VehicleRatioChart,
} from '../components'

interface Props {}

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

const DashboardScreen: React.FC<Props> = () => {
  const dispatch = useAppDispatch()
  const isDesktop = useIsDesktop()
  const searchParams = useSearchParams()

  // Snapshot the URL's dept_id on first mount:
  //   • `originalDeptId` never changes — the "← ทั่วประเทศ" reset button
  //     reverts to it (drr-10 → 10, drr-cmi → 50, super-admin → 0).
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

  useEffect(() => {
    dispatch(getExampleData())
  }, [dispatch])

  return (
    <DeptIdOverrideContext.Provider value={currentDeptId}>
    <div className="relative w-screen h-screen overflow-hidden bg-[#050d1a]">
      {/* MAP */}
      <ReactMap originalDeptId={originalDeptId} onDeptIdChange={setCurrentDeptId} />

      {isDesktop === true && (
        <>
          {/* DESKTOP: left absolute panels — top:52 = navbar (48) + 4px breathing */}
          <MapOverlayPanel
            position="left"
            className="absolute left-4 z-10 flex flex-col gap-3"
            style={{ top: 52, bottom: 180, width: 620 }}
          >
            <div className="flex-1" />
            <div className="flex" style={{ width: 530 }}>
              <StatusChart />
            </div>
            <AccidentChart />
          </MapOverlayPanel>

          {/* DESKTOP: donut row */}
          <MapOverlayPanel
            position="bottom"
            className="absolute left-4 z-10 flex"
            style={{ bottom: 16, width: 880 }}
          >
            <RatioChart size={110} />
          </MapOverlayPanel>

          {/* DESKTOP: right absolute panel — top:48 sits right under the 48px navbar.
            * VehicleRatioChart `flex-1 min-h-0` so it absorbs whatever space
            * Notification + TrafficStat don't use → no empty gap at the bottom. */}
          <MapOverlayPanel
            position="right"
            className="absolute right-4 z-10 flex flex-col gap-2"
            style={{ top: 64, bottom: 16, width: 380 }}
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

export default React.memo<Props>(DashboardScreen)
