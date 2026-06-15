"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { TbAffiliate } from 'react-icons/tb'
import { getPhaseColor } from '@/features/admin/traffic-signal/overall/data/trafficSignals'
import { useDetailContext } from '../../../context'

/** Phase Timing card — auto-cycles through configured phases at 1s tick.
 *  Adapts to 3- or 4-phase configurations from the API. */
const PhaseTimingTrafficSignal: React.FC = () => {
  const { project } = useDetailContext()
  const phases = project.phaseTiming ?? []

  const cycleTotal = useMemo(
    () => phases.reduce((sum, p) => sum + p.greenSec + p.redSec, 0),
    [phases]
  )
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (cycleTotal === 0) return
    const id = window.setInterval(() => {
      setElapsed((e) => (e + 1) % cycleTotal)
    }, 1000)
    return () => window.clearInterval(id)
  }, [cycleTotal])

  const { activeIdx, inGreen, remaining } = useMemo(() => {
    let acc = 0
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i]
      const greenEnd = acc + p.greenSec
      const redEnd = greenEnd + p.redSec
      if (elapsed < greenEnd) {
        return { activeIdx: i, inGreen: true, remaining: greenEnd - elapsed }
      }
      if (elapsed < redEnd) {
        return { activeIdx: i, inGreen: false, remaining: redEnd - elapsed }
      }
      acc = redEnd
    }
    return { activeIdx: 0, inGreen: true, remaining: phases[0]?.greenSec ?? 0 }
  }, [elapsed, phases])

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
          <h4 className='mb-0' style={{ color: '#66AEFF', fontSize: 16, fontWeight: 600 }}>
            Phase Timing
          </h4>
        </div>
        <div className='relative flex-1 flex items-center justify-center'>
          <p className='text-white/40 text-sm mb-0'>ไม่มีข้อมูล Phase Timing</p>
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

      {/* Center area — flex-1 so the big P fills the middle vertically */}
      <div className='relative flex-1 flex flex-col items-center justify-center text-center'>
        <p
          className='font-bold text-white leading-none mb-2'
          style={{ fontSize: 44 }}
        >
          P{activePhase.phase}
        </p>
        <p className='mb-0' style={{ color: activeColor, fontSize: 13 }}>
          {inGreen ? 'Green Time' : 'Red Time'} : {remaining}s
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
              <span className='font-bold leading-none' style={{ color, fontSize: 18 }}>
                P{p.phase}
              </span>
              <div className='flex items-center gap-1'>
                <span
                  className='inline-block rounded-full'
                  style={{ width: 6, height: 6, background: '#16FC2D' }}
                />
                <span className='text-white' style={{ fontSize: 12 }}>
                  {p.greenSec}s
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span
                  className='inline-block rounded-full'
                  style={{ width: 6, height: 6, background: '#ef4444' }}
                />
                <span className='text-white' style={{ fontSize: 12 }}>
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
