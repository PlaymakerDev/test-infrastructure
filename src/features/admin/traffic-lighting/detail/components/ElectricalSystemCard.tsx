"use client"
import React, { useMemo } from 'react'
import { useDetailContext } from '../context'
import type { DetailsElectricityItem } from '@/types/lighting'

// Phase 1/2/3 box color when the card is expanded — matches the palette
// already established for per-phase rows elsewhere (SummaryReportSection's
// table). Index 0 = Phase 1, 1 = Phase 2, 2 = Phase 3.
const PHASE_COLORS = ['#05F2DB', '#B0FF03', '#FCD116']

const PHASE_METRICS = [
  { label: 'Volt', key: 'voltage' as const },
  { label: 'Amp', key: 'amplitude' as const },
  { label: 'Watt', key: 'watt' as const },
  { label: 'Pf', key: 'power_factor' as const },
  { label: 'Hz', key: 'frequency' as const },
  { label: 'kWh', key: 'kwh' as const },
]

const buildMetrics = (e: DetailsElectricityItem | undefined) =>
  PHASE_METRICS.map((m) => {
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

const buildAverageMetrics = (items: DetailsElectricityItem[]) => {
  if (items.length === 0) return buildMetrics(undefined)
  const avg = (sel: (e: DetailsElectricityItem) => number) => items.reduce((sum, e) => sum + sel(e), 0) / items.length
  const avgWatt = avg((e) => e.watt)
  return PHASE_METRICS.map((m) => {
    let value = '-'
    switch (m.key) {
      case 'voltage': value = avg((e) => e.voltage).toFixed(2); break
      case 'amplitude': value = avg((e) => e.amplitude).toFixed(4); break
      case 'watt': value = avgWatt.toFixed(3); break
      case 'power_factor': value = avg((e) => e.power_factor).toFixed(2); break
      case 'frequency': value = avg((e) => e.frequency).toFixed(2); break
      // Same derivation as buildMetrics — averaging watt first then deriving
      // kWh is equivalent to averaging each entry's own kWh (linear formula).
      case 'kwh': value = ((avgWatt * 3600) / 3600000).toFixed(3); break
    }
    return { ...m, value }
  })
}

const MetricsGrid: React.FC<{ metrics: ReturnType<typeof buildMetrics>; accentColor: string }> = ({ metrics, accentColor }) => (
  <div className='grid grid-cols-3 gap-1.5 w-full shrink-0'>
    {metrics.map((metric) => (
      <div
        key={metric.label}
        className='flex flex-col items-center justify-center rounded-[10px] min-h-[64px] px-1 py-1.5'
        style={{ background: '#191919', border: `1px solid ${accentColor}` }}
      >
        <span className='text-[14px] font-bold m-0 leading-tight' style={{ color: accentColor }}>{metric.label}</span>
        <span className='text-[14px] font-normal m-0 mt-1 text-white tabular-nums leading-tight text-center w-full'>
          {metric.value}
        </span>
      </div>
    ))}
  </div>
)

interface Props {
  /** Controlled by the parent (OverviewSection) so it can grow the
   *  surrounding layout instead of this card overlapping the content below
   *  when it expands. */
  expanded: boolean
  onToggleExpanded: () => void
}

/** Electrical system card — reads device details from DetailContext. */
const ElectricalSystemCard: React.FC<Props> = ({ expanded, onToggleExpanded }) => {
  const { device, deviceLoaded } = useDetailContext()

  // A 3-phase cabinet reports one electricity[] entry per line (P1/P2/P3) —
  // the arrow expands the card to show every line's readings instead of
  // only ever showing electricity[0]. Single-phase devices have exactly one
  // entry, so the arrow stays hidden (nothing extra to reveal).
  const electricityCount = device?.electricity?.length ?? 0

  const phaseNum = !deviceLoaded ? null : (device ? device.phase : null)
  const phaseLabel = phaseNum === null ? '-' : `${phaseNum} Phase`
  const phaseSubLabel = phaseNum === null
    ? '-'
    : phaseNum === 1 ? 'Single Phase' : 'Three Phase'
  // Single-phase cabinets use the turquoise electrical accent; three-phase
  // cabinets retain the established blue accent throughout their readings.
  const phaseAccentColor = phaseNum === 1 ? '#05F2DB' : '#66AEFF'

  const primaryMetrics = useMemo(
    () => (deviceLoaded ? buildMetrics(device?.electricity?.[0]) : buildMetrics(undefined)),
    [device, deviceLoaded],
  )
  const extraPhases = useMemo(
    () => (device?.electricity ?? []).slice(1).map((e) => ({ phase: e.phase, metrics: buildMetrics(e) })),
    [device],
  )
  const averageMetrics = useMemo(
    () => buildAverageMetrics(device?.electricity ?? []),
    [device],
  )

  return (
    <div
      className='relative w-full min-h-[350px] rounded-[20px] p-4 flex flex-col border-2 border-white overflow-hidden'
      style={{ background: '#191919CC' }}
    >
      <div
        className='pointer-events-none absolute left-1/2 top-[116px] -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] rounded-full blur-2xl'
        style={{
          background: phaseNum === 1 ? '#05F2DB80' : '#66AEFF80',
        }}
      />

      <div className='relative z-10 flex flex-row items-center gap-2 -mt-1'>
        <img src='/atlas/images/Lighting/icelt1.png' alt='' width={32} height={32} className='shrink-0' />
        <p className='text-[14px] font-bold m-0 text-white leading-tight'>ระบบไฟฟ้า</p>
        {electricityCount > 1 && (
          <img
            src='/atlas/images/Lighting/arrowdown.png'
            alt='แสดงข้อมูลทุกเฟส'
            width={30}
            height={30}
            className='shrink-0 ml-auto cursor-pointer transition-transform'
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            onClick={onToggleExpanded}
          />
        )}
      </div>

      {/* Keep the phase summary at a fixed size/position.  Extra phase rows
          are appended below when expanded, rather than consuming this block
          and shifting the blue glow / 3 Phase label. */}
      <div className='relative z-10 flex h-[132px] shrink-0 flex-col items-center justify-center text-center py-2'>
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

      <div className='relative z-10 flex flex-col gap-3 w-full'>
        {expanded && electricityCount > 1 ? (
          <div className='flex flex-col gap-1.5'>
            <span className='text-[14px] font-normal text-left m-0' style={{ color: '#979797' }}>Phase 1</span>
            <MetricsGrid metrics={primaryMetrics} accentColor={PHASE_COLORS[0]} />
          </div>
        ) : (
          <MetricsGrid metrics={primaryMetrics} accentColor={phaseAccentColor} />
        )}
        {expanded && extraPhases.map(({ phase, metrics }, index) => (
          <div key={phase} className='flex flex-col gap-1.5'>
            <span className='text-[14px] font-normal text-left m-0' style={{ color: '#979797' }}>Phase {phase}</span>
            <MetricsGrid metrics={metrics} accentColor={PHASE_COLORS[index + 1] ?? phaseAccentColor} />
          </div>
        ))}
        {expanded && electricityCount > 1 && (
          <div className='flex flex-col gap-1.5'>
            <span className='text-[14px] font-normal text-left m-0' style={{ color: '#979797' }}>Average</span>
            <MetricsGrid metrics={averageMetrics} accentColor='#66AEFF' />
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(ElectricalSystemCard)
