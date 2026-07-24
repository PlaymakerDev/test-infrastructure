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

  const phaseNum = !deviceLoaded ? null : (device ? device.phase : null)
  const phaseLabel = phaseNum === null ? '-' : `${phaseNum} Phase`
  const phaseSubLabel = phaseNum === null
    ? '-'
    : phaseNum === 1 ? 'Single Phase' : 'Three Phase'
  // Single-phase cabinets use the turquoise electrical accent; three-phase
  // cabinets retain the established blue accent throughout their readings.
  const phaseAccentColor = phaseNum === 1 ? '#05F2DB' : '#66AEFF'

  const metrics = useMemo(() => {
    if (!deviceLoaded) return PHASE_METRICS.map((m) => ({ ...m, value: '-' }))
    const e = device?.electricity?.[0]
    return PHASE_METRICS.map((m) => {
      if (!e) return { ...m, value: '-' }
      // Not provided directly by the API — derived from watt assuming the
      // reading held for the full hour: kWh = (watt * 3600) / 3,600,000
      // (reduces to watt / 1000). Same formula as the Summary Report table.
      if (m.key === 'kwh') {
        const wattNum = e.watt == null ? NaN : Number(e.watt)
        if (!isFinite(wattNum)) return { ...m, value: '-' }
        return { ...m, value: ((wattNum * 3600) / 3600000).toFixed(3) }
      }
      const raw = e[m.key as keyof typeof e]
      if (raw == null) return { ...m, value: '-' }
      const num = Number(raw)
      // Volt → 2 decimals; Amp → 4 decimals (small values like 0.0002); Hz / Pf → 2 decimals; Watt → 3 decimals
      const decimals = m.key === 'voltage' || m.key === 'frequency' || m.key === 'power_factor'
        ? 2
        : m.key === 'amplitude' ? 4 : 3
      return { ...m, value: isFinite(num) ? num.toFixed(decimals) : String(raw) }
    })
  }, [device, deviceLoaded])

  return (
    <div
      className='relative w-full h-[350px] rounded-2xl p-4 flex flex-col border-2 border-white/70 overflow-hidden'
      style={{ background: '#191919CC' }}
    >
      <div
        className='pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] rounded-full blur-2xl'
        style={{
          background: phaseNum === 1 ? '#05F2DB80' : '#66AEFF80',
        }}
      />

      <div className='relative z-10 flex flex-row items-center gap-2 -mt-1'>
        <img src='/atlas/images/Lighting/icelt1.png' alt='' width={32} height={32} className='shrink-0' />
        <p className='text-[14px] font-bold m-0 text-white leading-tight'>ระบบไฟฟ้า</p>
      </div>

      <div className='relative z-10 flex flex-col items-center justify-center text-center flex-1 py-2'>
        <p
          className='m-0 text-white leading-none'
          style={{ fontSize: 32, fontWeight: 700 }}
        >
          {phaseLabel}
        </p>
        <p
          className='m-0 mt-1'
          style={{ color: phaseAccentColor, fontSize: 14, fontWeight: 400 }}
        >
          {phaseSubLabel}
        </p>
      </div>

      <div className='relative z-10 grid grid-cols-3 gap-1.5 w-full shrink-0'>
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className='flex flex-col items-center justify-center rounded-[10px] min-h-[52px] px-1 py-1.5'
            style={{ background: '#191919', border: `1px solid ${phaseAccentColor}` }}
          >
            <span className='text-[10px] font-bold m-0 leading-none' style={{ color: phaseAccentColor }}>{metric.label}</span>
            <span className='text-[10px] font-normal m-0 mt-1 text-white tabular-nums leading-tight text-center w-full'>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(ElectricalSystemCard)
