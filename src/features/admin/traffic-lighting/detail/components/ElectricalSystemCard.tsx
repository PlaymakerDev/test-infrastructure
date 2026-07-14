"use client"
import React, { useMemo } from 'react'
import { useDetailContext } from '../context'

const PHASE_METRICS = [
  { label: 'Volt', key: 'voltage' as const },
  { label: 'Amp', key: 'amplitude' as const },
  { label: 'Watt', key: 'watt' as const },
  { label: 'Pf', key: 'power_factor' as const },
  { label: 'Hz', key: 'frequency' as const },
  { label: 'kWh', key: 'kwh' as const },
]

/** Electrical system card — reads device details from DetailContext. */
const ElectricalSystemCard: React.FC = () => {
  const { device, deviceLoaded } = useDetailContext()

  const phaseNum = !deviceLoaded ? null : (device ? device.phase : 3)
  const phaseLabel = phaseNum === null ? '-' : `${phaseNum} Phase`
  const phaseSubLabel = phaseNum === 1 ? 'Single Phase' : 'Three Phase'

  const metrics = useMemo(() => {
    if (!deviceLoaded) return PHASE_METRICS.map((m) => ({ ...m, value: '-' }))
    const e = device?.electricity?.[0]
    return PHASE_METRICS.map((m) => {
      if (m.key === 'kwh') return { ...m, value: '-' }
      return { ...m, value: e ? String(e[m.key as keyof typeof e]) : '-' }
    })
  }, [device, deviceLoaded])

  return (
    <div
      className='relative w-full h-[350px] rounded-2xl p-4 flex flex-col border-2 border-white/70 overflow-hidden'
      style={{ background: '#191919CC' }}
    >
      <div
        className='pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[160px]'
        style={{
          background: 'radial-gradient(ellipse at center, rgba(102, 174, 255, 0.28) 0%, transparent 68%)',
        }}
      />

      <button
        type='button'
        aria-label='ดูรายละเอียดระบบไฟฟ้า'
        className='absolute top-3 right-3 z-10 border-0 cursor-pointer hover:brightness-110 transition-all p-0 bg-transparent'
      >
        <img src='/images/Lighting/arrowdown.png' alt='' width={32} height={32} className='shrink-0' />
      </button>

      <div className='relative z-10 flex flex-row items-start gap-2 pr-10'>
        <img src='/images/Lighting/icelt1.png' alt='' width={32} height={32} className='shrink-0' />
        <p className='text-[14px] font-bold m-0 text-white leading-tight'>ระบบไฟฟ้า</p>
      </div>

      <div className='relative z-10 flex flex-col items-center justify-center text-center flex-1 py-2'>
        <p className='text-[28px] font-bold m-0 text-white leading-none'>{phaseLabel}</p>
        <p className='text-[12px] font-normal m-0 mt-1' style={{ color: '#66AEFF' }}>{phaseSubLabel}</p>
      </div>

      <div className='relative z-10 grid grid-cols-3 gap-2 w-full shrink-0'>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className='flex flex-col items-center justify-center rounded-[10px] h-[54px]'
            style={{ background: '#191919', border: '1px solid #66AEFF' }}
          >
            <span className='text-[11px] font-normal m-0' style={{ color: '#66AEFF' }}>{metric.label}</span>
            <span className='text-[13px] font-bold m-0 mt-0.5 text-white'>{metric.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(ElectricalSystemCard)
