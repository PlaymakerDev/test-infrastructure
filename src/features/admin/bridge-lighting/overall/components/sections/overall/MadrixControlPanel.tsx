"use client"
import React from 'react'

interface Props {}

/**
 * Mock of the MADRIX Lighting Control software panel shown in the design.
 *
 * Renders a dark grid of placeholder cells + sliders to imitate the cue/scene
 * grid + faders of MADRIX. Replace with a real screenshot/embed when available
 * by swapping the content of this component.
 */
const MadrixControlPanel: React.FC<Props> = () => {
  return (
    <div
      className='p-4 overflow-hidden flex flex-col w-full h-full'
      style={{
        borderRadius: 20,
        background: '#191919CC',
        backdropFilter: 'blur(5px)',
      }}
    >
      <p className='text-(--yellow) text-sm font-semibold mb-3'>หน้าจอโปรแกรมควบคุมไฟประดับ</p>

      <div className='rounded-lg overflow-hidden flex-1 flex flex-col' style={{ background: '#0d1015' }}>
        {/* MADRIX header bar */}
        <div
          className='flex items-center justify-between px-3 py-2 border-b'
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className='flex items-center gap-1.5'>
            <span
              className='text-[11px] font-bold tracking-wider'
              style={{
                color: '#7dd34a',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.1em',
              }}
            >
              MADRIX
            </span>
            <span className='text-[9px] text-white/40'>LIGHTING CONTROL</span>
          </div>
          <div className='flex gap-0.5'>
            <span className='w-2 h-2 rounded-full bg-red-500/70' />
            <span className='w-2 h-2 rounded-full bg-yellow-500/70' />
            <span className='w-2 h-2 rounded-full bg-green-500/70' />
          </div>
        </div>

        {/* Cue/scene grid — 4 columns × 7 rows of cells (scaled up for larger panel) */}
        <div className='grid grid-cols-4 gap-2 p-3 flex-1'>
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className='flex flex-col gap-1.5'>
              {Array.from({ length: 7 }).map((_, row) => (
                <div
                  key={row}
                  className='flex-1 rounded'
                  style={{
                    minHeight: 14,
                    background:
                      (row + col) % 4 === 0
                        ? '#3b82f6'
                        : (row + col) % 4 === 1
                          ? '#06b6d4'
                          : (row + col) % 4 === 2
                            ? '#7c3aed'
                            : 'rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Bottom slider rows */}
        <div className='px-3 pb-3 space-y-1.5'>
          {[60, 35, 80, 45].map((width, i) => (
            <div
              key={i}
              className='h-2.5 rounded-full overflow-hidden'
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className='h-full rounded-full'
                style={{
                  width: `${width}%`,
                  background:
                    i === 0
                      ? '#FCD116'
                      : i === 1
                        ? '#06b6d4'
                        : i === 2
                          ? '#a3e635'
                          : '#e94c4c',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo<Props>(MadrixControlPanel)
