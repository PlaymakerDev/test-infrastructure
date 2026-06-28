"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { TbBolt } from 'react-icons/tb'
import LineChart from '@/components/chart/LineChart'
import type { LineChartDataPoint } from '@/components/chart/LineChart'
import { getLightingVoltGraphAPI, getLightingAmpGraphAPI } from '@/services/routes/LightingService'
import type { Logs4gVoltPoint, Logs4gAmpPoint } from '@/types/lighting'

// Title color is always the project yellow; the chart line itself keeps its
// semantic color (cyan for Volt, orange for Amp) for readability.
const COLOR_TITLE = '#FCD116'
const COLOR_VOLTAGE_CYAN = '#66AEFF'
const COLOR_AMP_ORANGE = '#FF9F43'

const SHARED_CHART_PROPS = {
  iconCircle: false,
  showGlow: false,
  cardBackground: '#00000080',
  cardBorderColor: '#1f2d3d',
  height: 220,
} as const

/** Two line charts (Volt / Amp) for the OVERVIEW tab. Replaces the old
 *  ExampleCardsRow image pair. Each chart pulls 24h hourly data from the
 *  logs4g graph endpoints for the given IMEI. */
const VoltageAmpChartsRow: React.FC<{ imei: string }> = ({ imei }) => {
  const [volt, setVolt] = useState<Logs4gVoltPoint[]>([])
  const [amp, setAmp] = useState<Logs4gAmpPoint[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    if (!imei) {
      setLoaded(true)
      return
    }
    Promise.all([
      getLightingVoltGraphAPI(imei).then((r) => r.data ?? []).catch((e) => { console.error('volt graph failed:', e); return [] }),
      getLightingAmpGraphAPI(imei).then((r) => r.data ?? []).catch((e) => { console.error('amp graph failed:', e); return [] }),
    ]).then(([v, a]) => {
      if (!active) return
      setVolt(v)
      setAmp(a)
    }).finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [imei])

  // Map the API points to the LineChart data shape (label = hour, value key).
  const voltData: LineChartDataPoint[] = useMemo(
    () => volt.map((p) => ({ label: p.Period_Name, volt: p.volt ?? 0 })),
    [volt],
  )
  const ampData: LineChartDataPoint[] = useMemo(
    () => amp.map((p) => ({ label: p.Period_Name, amp: p.amp ?? 0 })),
    [amp],
  )

  return (
    <div className='flex flex-col md:flex-row w-full gap-3 mt-4'>
      <div className='flex-1 min-w-0'>
        {loaded ? (
          <LineChart
            {...SHARED_CHART_PROPS}
            title='แรงดันไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Volt)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_TITLE}
            data={voltData}
            lines={[{ dataKey: 'volt', color: COLOR_VOLTAGE_CYAN, label: 'Voltage', unit: 'V' }]}
            tooltipUnit='V'
            yAxisDomain={['auto', 'auto']}
          />
        ) : null}
      </div>
      <div className='flex-1 min-w-0'>
        {loaded ? (
          <LineChart
            {...SHARED_CHART_PROPS}
            title='กระแสไฟฟ้าภายในตู้ควบคุม 24 ชั่วโมง (Amp)'
            icon={<TbBolt size={18} />}
            accentColor={COLOR_TITLE}
            data={ampData}
            lines={[{ dataKey: 'amp', color: COLOR_AMP_ORANGE, label: 'Current', unit: 'A' }]}
            tooltipUnit='A'
            yAxisDomain={['auto', 'auto']}
          />
        ) : null}
      </div>
    </div>
  )
}

export default React.memo(VoltageAmpChartsRow)
