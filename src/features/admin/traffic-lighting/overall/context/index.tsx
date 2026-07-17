"use client"
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getLightingCentralListAPI,
  getLightingCentralTotalsAPI,
  getLightingRandomOnlineAPI,
} from '@/services/routes/LightingService'
import { useLightingOverview } from '@/hooks/queries/lighting'
import type { DetailsResponse, LightingOverviewTotals, OverviewCentralItem } from '@/types/lighting'
import { mapCentralListToProjects } from '../data/trafficLightingProjects'
import { useAppSelector } from '@/stores/hooks'

const SUMMARY_STAT_DEFS = [
  { label: 'ทั้งหมด', color: '#FCD116', variant: 'filled' as const, get: (t: LightingOverviewTotals) => t.solution.total },
  { label: 'ออนไลน์', color: '#66AEFF', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.solution.online },
  { label: 'ออฟไลน์', color: '#E94C4C', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.solution.offline },
  { label: 'ในค้ำ', color: '#05F2DB', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.warranty.active },
  { label: 'หมดค้ำ', color: '#979797', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.warranty.expired },
]

const LEFT_PANEL_ITEMS = [
  { id: '1', route: 'อน.3023', cabinet: 'ตู้ที่ 2 กม.6+400', imei: '860946061754746' },
] as const

const LEFT_BOTTOM_CARDS = [
  { border: '#6666FF', icon: '/images/Lighting/icel1.png', titleColor: '#6666FF', title: 'สถานะการเชื่อมต่อ', status: 'เชื่อมต่อปกติ' },
  { border: '#B066FF', icon: '/images/Lighting/icel2.png', titleColor: '#B066FF', title: 'สถานะการเชื่อมต่อ', status: 'เชื่อมต่อปกติ' },
] as const

const PHASE_METRICS = [
  { label: 'Volt', value: '240.2' },
  { label: 'Amp', value: '35.2' },
  { label: 'Watt', value: '50.27' },
  { label: 'kWh', value: '3.02' },
  { label: 'Hz', value: '50.03' },
] as const

export interface StatCardView {
  title: string
  icon: string
  titleColor: string
  value: number
  active: string
}

export interface SummaryStatView {
  label: string
  color: string
  variant: 'filled' | 'outlined'
  value: number | string
}

export interface LeftPanelItem {
  id: string
  route: string
  cabinet: string
  imei: string
  equipmentType: string
  coord: [number, number] | null
}

export interface LeftBottomCard {
  border: string
  icon: string
  titleColor: string
  title: string
  status: string
}

export interface PhaseMetric {
  label: string
  value: string
}

export interface OverallContextProps {
  deptId: number
  searchQuery: string
  setSearchQuery: (value: string) => void
  centralListLoaded: boolean
  statCards: StatCardView[]
  summaryStats: SummaryStatView[]
  filteredProjects: ReturnType<typeof mapCentralListToProjects>
  leftPanelItems: LeftPanelItem[]
  phaseLabel: string
  phaseSubLabel: string
  phaseMetrics: PhaseMetric[]
  leftBottomCards: LeftBottomCard[]
  diagramImei: string
}

export interface OverallProviderProps {
  children: React.ReactNode
}

export const OverallContext = createContext<OverallContextProps | null>(null)

export const OverallProvider = ({ children }: OverallProviderProps) => {
  const searchParams = useSearchParams()
  const { sidebar } = useAppSelector((state) => state.layout)
  const [searchQuery, setSearchQuery] = useState('')
  const [centralItems, setCentralItems] = useState<OverviewCentralItem[]>([])
  const [centralListLoaded, setCentralListLoaded] = useState(false)
  const [centralTotals, setCentralTotals] = useState<LightingOverviewTotals | null>(null)
  const [totalsLoaded, setTotalsLoaded] = useState(false)
  const [device, setDevice] = useState<DetailsResponse | null>(null)
  const [deviceLoaded, setDeviceLoaded] = useState(false)

  const deptId = Number(
    searchParams.get('dept_id')
    || sidebar[0]?.sub_department[0]?.department_id
    || '0',
  )

  // Overview API (with GeometryPoint + imei) — used to resolve device coordinates
  const overviewQuery = useLightingOverview(deptId)

  useEffect(() => {
    let active = true
    getLightingCentralListAPI(deptId)
      .then((res) => { if (active) setCentralItems(res.data ?? []) })
      .catch((err) => console.error('central/list failed:', err))
      .finally(() => { if (active) setCentralListLoaded(true) })
    return () => { active = false }
  }, [deptId])

  useEffect(() => {
    let active = true
    getLightingCentralTotalsAPI(deptId)
      .then((res) => { if (active) setCentralTotals(res.data ?? null) })
      .catch((err) => console.error('central/totals failed:', err))
      .finally(() => { if (active) setTotalsLoaded(true) })
    return () => { active = false }
  }, [deptId])

  useEffect(() => {
    let active = true
    getLightingRandomOnlineAPI(deptId)
      .then((res) => { if (active && res.data) setDevice(res.data) })
      .catch((err) => console.error('random-online failed:', err))
      .finally(() => { if (active) setDeviceLoaded(true) })
    return () => { active = false }
  }, [deptId])

  const leftPanelItems = useMemo(() => {
    const defaultItem = LEFT_PANEL_ITEMS[0]
    if (!deviceLoaded || !device) {
      return [{ ...defaultItem, imei: '-', route: '-', cabinet: '-', equipmentType: '', coord: null }]
    }
    const centralMatch = centralItems
      .flatMap((b) => b.sub_department)
      .flatMap((d) => d.solutions)
      .find((s) => s.imei === device.imei)
    // overview/ has GeometryPoint but no imei; resolve via solution.id from central/list match
    const solId = centralMatch?.solution?.id
    const overviewMatch = solId != null
      ? overviewQuery.data?.locations?.find((l) => l.solution?.id === solId)
      : undefined
    const equipType = centralMatch?.lighting?.equipment?.type
      ?? overviewMatch?.lighting?.equipment?.type
      ?? 'phase'
    const coord = overviewMatch?.GeometryPoint ?? null
    return [{
      ...defaultItem,
      id: device.imei,
      imei: device.imei,
      route: centralMatch?.road?.code_name ?? overviewMatch?.road?.code_name ?? defaultItem.route,
      cabinet: centralMatch?.solution?.solution_name ?? overviewMatch?.solution?.solution_name ?? defaultItem.cabinet,
      equipmentType: equipType,
      coord,
    }]
  }, [device, deviceLoaded, centralItems, overviewQuery.data])

  const phaseNum = !deviceLoaded ? null : (device ? device.phase : 3)
  const phaseLabel = phaseNum === null ? '-' : `${phaseNum} Phase`
  const phaseSubLabel = phaseNum === 1 ? 'Single Phase' : 'Three Phase'

  const phaseMetrics = useMemo(() => {
    if (!deviceLoaded) return PHASE_METRICS.map((m) => ({ ...m, value: '-' }))
    const e = device?.electricity?.[0]
    // API values can come back as long floats (e.g. 1209.2671710000002) that
    // overflow the fixed-width metric card — round to 2dp like the static defaults.
    const fmt = (n: number) => n.toFixed(2)
    return PHASE_METRICS.map((m) => {
      switch (m.label) {
        case 'Volt': return { ...m, value: e ? fmt(e.voltage) : m.value }
        case 'Amp': return { ...m, value: e ? fmt(e.amplitude) : m.value }
        case 'Watt': return { ...m, value: e ? fmt(e.watt) : m.value }
        case 'Hz': return { ...m, value: e ? fmt(e.frequency) : m.value }
        default: return m
      }
    })
  }, [device, deviceLoaded])

  const leftBottomCards = useMemo(() => {
    if (!deviceLoaded) return LEFT_BOTTOM_CARDS.map((c) => ({ ...c, status: '-' }))
    if (!device) return LEFT_BOTTOM_CARDS.map((c) => ({ ...c }))
    const status = device.has_broken_wire ? 'สายขาด' : 'เชื่อมต่อปกติ'
    return LEFT_BOTTOM_CARDS.map((c) => ({ ...c, status }))
  }, [device, deviceLoaded])

  const diagramImei = useMemo(() => {
    if (!deviceLoaded) return ''
    return device?.imei ?? ''
  }, [device, deviceLoaded])

  const statCards = useMemo(() => {
    const base = [
      { title: 'ตู้โจรกรรมในระบบทั้งหมด', icon: '/images/Lighting/icc1.png', titleColor: '#FCD116' },
      { title: 'โคมไฟในระบบทั้งหมด', icon: '/images/Lighting/icc2.png', titleColor: '#FCD116' },
      { title: 'ในค้ำ', icon: '/images/Lighting/icc3.png', titleColor: '#05F2DB' },
      { title: 'หมดค้ำ', icon: '/images/Lighting/icc4.png', titleColor: '#979797' },
    ]
    if (!centralListLoaded) {
      return base.map((s) => ({ ...s, value: 0, active: '-' }))
    }
    const sols = centralItems.flatMap((b) => b.sub_department).flatMap((s) => s.solutions)
    const of = (type: string) => sols.filter((s) => s.lighting?.equipment?.type === type)
    const phase = of('phase')
    const lamp = of('lamp')
    const wActive = sols.filter((s) => s.is_warranty)
    const wExpired = sols.filter((s) => !s.is_warranty)
    const online = (arr: typeof sols) => arr.filter((s) => s.lighting?.is_online).length
    const fmt = (on: number, total: number) => total > 0 ? `${on} (${((on / total) * 100).toFixed(1)}%)` : '0 (0%)'
    const values = [
      { value: phase.length, active: fmt(online(phase), phase.length) },
      { value: lamp.length, active: fmt(online(lamp), lamp.length) },
      { value: wActive.length, active: fmt(online(wActive), wActive.length) },
      { value: wExpired.length, active: fmt(online(wExpired), wExpired.length) },
    ]
    return base.map((s, i) => ({ ...s, ...values[i] }))
  }, [centralItems, centralListLoaded])

  const summaryStats = useMemo(
    () => SUMMARY_STAT_DEFS.map((d) => ({
      label: d.label,
      color: d.color,
      variant: d.variant,
      value: !totalsLoaded ? '-' : (centralTotals ? d.get(centralTotals) : 0),
    })),
    [centralTotals, totalsLoaded],
  )

  const projects = useMemo(() => mapCentralListToProjects(centralItems), [centralItems])
  const filteredProjects = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) return projects
    return projects.filter((p) => {
      const haystack = `${p.roadCode} ${p.projectName} ${p.installPoint} ${p.contractNo} ${p.bureau}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [projects, searchQuery])

  const value: OverallContextProps = {
    deptId,
    searchQuery,
    setSearchQuery,
    centralListLoaded,
    statCards,
    summaryStats,
    filteredProjects,
    leftPanelItems,
    phaseLabel,
    phaseSubLabel,
    phaseMetrics,
    leftBottomCards,
    diagramImei,
  }

  return (
    <OverallContext.Provider value={value}>
      {children}
    </OverallContext.Provider>
  )
}

export const useOverallContext = () => {
  const context = useContext(OverallContext)
  if (!context) throw new Error('useOverallContext must be used within an OverallProvider')
  return context
}
