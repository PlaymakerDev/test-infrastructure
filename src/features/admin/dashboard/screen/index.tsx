"use client"
import React, { useEffect, useState } from 'react'
import ReactMap from '@/components/map/ReactMap'
import { useAppDispatch } from '@/stores/hooks'
import { getExampleData } from '@/stores/reducers/example/exampleSlice'
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

  useEffect(() => {
    dispatch(getExampleData())
  }, [dispatch])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050d1a]">
      {/* MAP */}
      <ReactMap />

      {isDesktop === true && (
        <>
          {/* DESKTOP: left absolute panels */}
          <aside
            className="absolute left-4 z-10 flex flex-col gap-3"
            style={{ top: 60, bottom: 180, width: 620 }}
          >
            <div className="flex-1" />
            <div className="flex" style={{ width: 372 }}>
              <StatusChart />
            </div>
            <AccidentChart />
          </aside>

          {/* DESKTOP: donut row */}
          <div
            className="absolute left-4 z-10 flex"
            style={{ bottom: 16, width: 880 }}
          >
            <RatioChart size={110} />
          </div>

          {/* DESKTOP: right absolute panel */}
          <aside
            className="absolute right-4 z-10 flex flex-col gap-2"
            style={{ top: 60, bottom: 16, width: 408 }}
          >
            <Notification />
            <VehicleRatioChart />
            <TrafficStat />
          </aside>
        </>
      )}

      {isDesktop === false && (
        <>
          {/* MOBILE: notification floating */}
          <div className="absolute z-20 right-3" style={{ top: 56 }}>
            <Notification />
          </div>

          {/* MOBILE: scrollable column */}
          <div
            className="absolute left-0 right-0 overflow-y-auto z-10"
            style={{ top: "42vh", bottom: 0 }}
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
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo<Props>(DashboardScreen)
