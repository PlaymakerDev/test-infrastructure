"use client"
import React, { useEffect, useMemo, useState } from 'react'
import {
  TbAffiliate,
  TbArrowsUpDown,
  TbArrowsLeftRight,
  TbArrowUp,
} from 'react-icons/tb'
import {
  getPhaseColor,
  type PhaseTimingConfig,
} from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useDetailContext } from '../../../context'

// Direction icon per phase — main road = up/down (N-S through), side road =
// left/right (E-W through). Approximation until BE ships per-phase movement
// direction; today we only have `is_main_road` on the phase feed. See
// Dr. Nick's request in the 15 ก.ค. 2569 ticket.
const PhaseDirectionArrow: React.FC<{ isMainRoad?: boolean; size?: number; color: string }> = ({
  isMainRoad,
  size = 14,
  color,
}) => {
  if (isMainRoad === undefined) return null
  const Icon = isMainRoad ? TbArrowsUpDown : TbArrowsLeftRight
  return <Icon size={size} color={color} aria-hidden />
}

/** Where the active phase sits on its cycle clock, per the phase_details feed.
 *
 *  Feed semantics, verified against production 2026-10-26 (64 junctions, 192
 *  samples): `timestamp` is the CYCLE's start — every phase row of a junction
 *  carries the same value — and `waiting_time` (`redSec`) is this phase's
 *  green START offset inside that cycle (0 for the first phase). So the active
 *  phase is green during [redSec, redSec + greenSec) after `timestamp`. The
 *  earlier reading (timestamp = this phase's own start, redSec = red time
 *  after its green) put every non-first phase into "Red Time" mid-green — a
 *  quarter of all live samples.
 *
 *  Outside that window there is no trustworthy countdown (most junctions hold
 *  a cycle record minutes old between updates), so the card shows the
 *  configured green time instead. A short grace past the window parks the
 *  countdown at 0 through the intergreen until the next 5s poll moves the
 *  active phase on, instead of jumping back to the full green time. */
const INTERGREEN_GRACE_SEC = 10

const computeApiState = (phases: PhaseTimingConfig[]) => {
  const apiActiveIdx = phases.findIndex((p) => p.isActive)
  const activeIdx = apiActiveIdx >= 0 ? apiActiveIdx : 0
  const active = phases[activeIdx]
  const noCountdown = { activeIdx, elapsedInPhase: 0, hasValidTimestamp: false }
  if (!active?.timestamp) return noCountdown
  const cycleStartMs = new Date(active.timestamp).getTime()
  if (isNaN(cycleStartMs)) return noCountdown
  const elapsedInPhase =
    Math.floor((Date.now() - cycleStartMs) / 1000) - active.redSec
  if (elapsedInPhase < 0 || elapsedInPhase > active.greenSec + INTERGREEN_GRACE_SEC) {
    return noCountdown
  }
  return { activeIdx, elapsedInPhase, hasValidTimestamp: true }
}

/** Phase Timing card — shows the currently-active phase and live countdown,
 *  driven by `is_active` + `timestamp` from the phase_details API. */
const PhaseTimingTrafficSignal: React.FC = () => {
  const { project } = useDetailContext()
  // Memoized: `?? []` would mint a NEW array every render when phaseTiming is
  // absent, destabilizing every [phases] dependency below (the countdown
  // interval was being torn down and recreated on each render).
  const phases = useMemo(() => project.phaseTiming ?? [], [project.phaseTiming])

  // Seed from API on every refetch (phases reference changes when TanStack
  // Query returns new data). `tick` advances the countdown smoothly between
  // refetches; reset to 0 when phases change so the new API state takes over.
  const apiSeed = useMemo(() => computeApiState(phases), [phases])
  const [tick, setTick] = useState(0)

  // Reset during render (sanctioned "adjusting state when props change"
  // pattern) instead of synchronously inside the effect, which the
  // set-state-in-effect lint forbids.
  const [prevPhases, setPrevPhases] = useState(phases)
  if (prevPhases !== phases) {
    setPrevPhases(phases)
    setTick(0)
  }

  useEffect(() => {
    if (phases.length === 0) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [phases])

  const { activeIdx, remaining } = useMemo(() => {
    if (phases.length === 0) {
      return { activeIdx: 0, remaining: 0 }
    }
    const active = phases[apiSeed.activeIdx]
    const elapsed = apiSeed.elapsedInPhase + tick
    // No trustworthy position on the cycle clock (or the feed stalled past
    // the grace) — show the configured green time without a countdown.
    if (!apiSeed.hasValidTimestamp || elapsed > active.greenSec + INTERGREEN_GRACE_SEC) {
      return { activeIdx: apiSeed.activeIdx, remaining: active.greenSec }
    }
    // The active phase IS the green one — count down what's left of it.
    return {
      activeIdx: apiSeed.activeIdx,
      remaining: Math.max(0, active.greenSec - elapsed),
    }
  }, [phases, apiSeed, tick])

  // Empty state — render the card shell with a placeholder so the page
  // layout stays consistent. Hits when the API returns no phase data yet.
  if (phases.length === 0) {
    return (
      <div
        className='relative rounded-2xl p-4 w-full h-full overflow-hidden flex flex-col'
        style={{ background: '#191919CC', border: '1px solid #1f2d3d' }}
      >
        <div className='relative flex items-center gap-2 mb-2'>
          <TbAffiliate size={22} color='#66AEFF' />
          <h4 className='mb-0 text-(--default-blue) fs-14 font-normal!'>
            Phase Timing
          </h4>
        </div>
        <div className='relative flex-1 flex items-center justify-center'>
          <p className='text-white/40 fs-12 mb-0'>ไม่มีข้อมูล Phase Timing</p>
        </div>
      </div>
    )
  }

  const activePhase = phases[activeIdx]
  const activeColor = getPhaseColor(activePhase.phase)

  return (
    <div
      className='relative rounded-2xl p-4 w-full h-full overflow-hidden flex flex-col'
      style={{
        background: '#191919CC',
        border: '1px solid #1f2d3d',
      }}
    >
      {/* Active phase glow — soft radial in the active phase color */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${activeColor}30 0%, transparent 60%)`,
        }}
      />

      <div className='relative flex items-center gap-2 mb-2'>
        <TbAffiliate size={22} color='#66AEFF' />
        <h4 className='mb-0' style={{ color: '#66AEFF', fontSize: 16, fontWeight: 600 }}>
          Phase Timing
        </h4>
      </div>

      {/* Center area — flex-1 so the big P fills the middle vertically.
        * Arrow next to the phase label shows the current flow direction
        * (main road = ↕, side road = ↔) — Dr. Nick request from the
        * 15 ก.ค. 2569 ticket. */}
      <div className='relative flex-1 flex flex-col items-center justify-center text-center'>
        <div className='flex items-center gap-3 mb-2'>
          <p className='font-bold text-white leading-none' style={{ fontSize: 44 }}>
            P{activePhase.phase}
          </p>
          {activePhase.isMainRoad !== undefined && (
            <span
              className='flex items-center gap-1'
              style={{ color: activeColor, fontSize: "var(--fs-12)" }}
              title={activePhase.isMainRoad ? 'ปล่อยรถถนนหลัก' : 'ปล่อยรถถนนรอง'}
            >
              <PhaseDirectionArrow isMainRoad={activePhase.isMainRoad} size={28} color={activeColor} />
            </span>
          )}
        </div>
        <p className='mb-0 fs-12' style={{ color: activeColor }}>
          Green Time : {remaining}s
        </p>
      </div>

      {/* Phase mini-cards — N columns dynamically based on phaseTiming length */}
      <div
        className='relative grid gap-2 mt-3'
        style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))` }}
      >
        {phases.map((p, i) => {
          const isActive = i === activeIdx
          const color = getPhaseColor(p.phase)
          return (
            <div
              key={p.phase}
              className='flex flex-col items-center gap-1.5 rounded-lg px-2 py-2'
              style={{
                background: isActive ? `${color}10` : 'transparent',
                border: `1.5px solid ${isActive ? color : '#1f2d3d'}`,
                boxShadow: isActive ? `0 0 12px ${color}40` : 'none',
              }}
            >
              <div className='flex items-center gap-1'>
                <span className='font-bold leading-none' style={{ color, fontSize: 18 }}>
                  P{p.phase}
                </span>
                <PhaseDirectionArrow isMainRoad={p.isMainRoad} size={12} color={color} />
              </div>
              {p.phase === activePhase.phase && (
                <TbArrowUp
                  size={10}
                  color={color}
                  className='animate-pulse'
                  aria-hidden
                />
              )}
              <div className='flex items-center gap-1'>
                <span
                  className='inline-block rounded-full'
                  style={{ width: 6, height: 6, background: '#16FC2D' }}
                />
                <span className='text-white fs-12'>
                  {p.greenSec}s
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span
                  className='inline-block rounded-full'
                  style={{ width: 6, height: 6, background: '#ef4444' }}
                />
                <span className='text-white fs-12'>
                  {p.redSec}s
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(PhaseTimingTrafficSignal)
