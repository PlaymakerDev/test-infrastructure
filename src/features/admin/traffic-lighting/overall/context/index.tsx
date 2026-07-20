"use client"
import { createContext, useContext, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  useLightingCentralList,
  useLightingCentralTotals,
  useLightingOverview,
  useLightingRandomOnline,
  isValidLightingDeptId,
} from '@/hooks/queries/lighting'
import type { LightingOverviewTotals } from '@/types/lighting'
import { mapCentralListToProjects } from '../data/trafficLightingProjects'
import { useAppSelector } from '@/stores/hooks'

const SUMMARY_STAT_DEFS = [
  { label: 'ทั้งหมด', color: '#FCD116', variant: 'filled' as const, get: (t: LightingOverviewTotals) => t.solution.total },
  { label: 'ออนไลน์', color: '#66AEFF', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.solution.online },
  { label: 'ออฟไลน์', color: '#E94C4C', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.solution.offline },
  { label: 'ในค้ำ', color: '#05F2DB', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.warranty.active },
  { label: 'หมดค้ำ', color: '#979797', variant: 'outlined' as const, get: (t: LightingOverviewTotals) => t.warranty.expired },
]

const EMPTY_LEFT_PANEL_ITEM = {
  id: '-', route: '-', cabinet: '-', imei: '-', equipmentType: '', coord: null,
} as const

const LEFT_BOTTOM_CARDS = [
  { border: '#6666FF', icon: '/images/Lighting/icel1.png', titleColor: '#6666FF', title: 'สถานะการเชื่อมต่อ', status: '-' },
  { border: '#B066FF', icon: '/images/Lighting/icel2.png', titleColor: '#B066FF', title: 'สถานะวงจร', status: '-' },
] as const

const PHASE_METRICS = [
  { label: 'Volt', value: '-' },
  { label: 'Amp', value: '-' },
  { label: 'Watt', value: '-' },
  { label: 'kWh', value: '-' },
  { label: 'Hz', value: '-' },
] as const

export interface StatCardView {
  title: string
  icon: string
  titleColor: string
  value: number | string
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
  centralListError: boolean
  retryCentralList: () => void
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

  const urlDeptId = searchParams.get('dept_id')
  const sidebarDeptId = sidebar[0]?.sub_department[0]?.department_id
  const deptId = Number(
    isValidLightingDeptId(urlDeptId)
      ? urlDeptId
      : isValidLightingDeptId(sidebarDeptId)
        ? sidebarDeptId
        : 0,
  )

  // Overview API (with GeometryPoint + imei) — used to resolve device coordinates
  const overviewQuery = useLightingOverview(deptId)
  const centralListQuery = useLightingCentralList(deptId)
  const centralTotalsQuery = useLightingCentralTotals(deptId)
  const randomOnlineQuery = useLightingRandomOnline(deptId)

  const centralItems = useMemo(() => centralListQuery.data ?? [], [centralListQuery.data])
  const centralListLoaded = centralListQuery.isSuccess
  const centralListError = centralListQuery.isError
  const centralTotals = centralTotalsQuery.data ?? null
  const totalsLoaded = centralTotalsQuery.isSuccess
  const device = randomOnlineQuery.data ?? null
  const deviceLoaded = !randomOnlineQuery.isLoading

  const leftPanelItems = useMemo(() => {
    if (!deviceLoaded || !device) {
      return [{ ...EMPTY_LEFT_PANEL_ITEM }]
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
      ?? ''
    const coord = overviewMatch?.GeometryPoint ?? null
    return [{
      id: device.imei,
      imei: device.imei,
      route: centralMatch?.road?.code_name ?? overviewMatch?.road?.code_name ?? '-',
      cabinet: centralMatch?.solution?.solution_name ?? overviewMatch?.solution?.solution_name ?? '-',
      equipmentType: equipType,
      coord,
    }]
  }, [device, deviceLoaded, centralItems, overviewQuery.data])

  const phaseNum = !deviceLoaded ? null : (device?.phase ?? null)
  const phaseLabel = phaseNum === null ? '-' : `${phaseNum} Phase`
  const phaseSubLabel = phaseNum === 1
    ? 'Single Phase'
    : phaseNum === 3
      ? 'Three Phase'
      : '-'

  const phaseMetrics = useMemo(() => {
    if (!deviceLoaded) return PHASE_METRICS.map((m) => ({ ...m, value: '-' }))
    const e = device?.electricity?.[0]
    // API values can come back as long floats (e.g. 1209.2671710000002) that
    // overflow the fixed-width metric card — round to 2dp like the static defaults.
    const fmt = (n: number) => n.toFixed(2)
    return PHASE_METRICS.map((m) => {
      switch (m.label) {
        case 'Volt': return { ...m, value: e ? fmt(e.voltage) : '-' }
        case 'Amp': return { ...m, value: e ? fmt(e.amplitude) : '-' }
        case 'Watt': return { ...m, value: e ? fmt(e.watt) : '-' }
        case 'Hz': return { ...m, value: e ? fmt(e.frequency) : '-' }
        default: return m
      }
    })
  }, [device, deviceLoaded])

  const leftBottomCards = useMemo(() => {
    if (!deviceLoaded) return LEFT_BOTTOM_CARDS.map((c) => ({ ...c, status: '-' }))
    if (!device) return LEFT_BOTTOM_CARDS.map((c) => ({ ...c, status: '-' }))
    return LEFT_BOTTOM_CARDS.map((card, index) => ({
      ...card,
      status: index === 0
        ? device.is_online ? 'ออนไลน์' : 'ออฟไลน์'
        : device.has_broken_wire ? 'สายขาด' : 'เชื่อมต่อปกติ',
    }))
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
      return base.map((s) => ({ ...s, value: '-', active: '-' }))
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
    centralListError,
    retryCentralList: () => { void centralListQuery.refetch() },
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
