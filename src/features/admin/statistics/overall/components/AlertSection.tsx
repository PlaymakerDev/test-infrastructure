"use client"
import React, { useState, useCallback, useMemo } from 'react'
import { TbArrowBigLeftFilled, TbBolt } from 'react-icons/tb'
import { Segmented } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard, SummaryBadge } from './shared'
import { useLiveAlertRouteItems } from '../../data/useLiveAlertRouteItems'
import type { MapMarkerItem } from '../../data/routeItems'
import { useIotStatus, useIotStatusSummary } from '@/hooks/queries/incident-detection'
import { useLightingDeviceDetails } from '@/hooks/queries/lighting'
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import useIsMobile from '@/utils/hooks/useIsMobile'
import ExportFileModal from '@/components/export/ExportFileModal'

// ── Map marker group popup ──────────────────────────────────────────────────
// Shown (instead of navigating instantly) when a marker point represents one
// or more devices at the exact same physical location — e.g. several
// electrical cabinets ("ตู้") installed at one road point, which Mapbox
// clusters together at every zoom level since they share one coordinate.

interface AlertPopupDevice {
  key: string
  label: string
  isOnline: boolean
  /** Device IMEI — `key` above IS the imei (see useLiveAlertRouteItems), kept
   *  as its own field so the intent at each call site is explicit. */
  imei: string
}

/** ต้องมี Phase separately fetched — the iot-status list endpoint that builds
 *  this popup carries no `phase` field, but `/lighting/imei/{imei}/details`
 *  (same endpoint traffic-lighting/detail's ElectricalSystemCard uses) does.
 *  Renders nothing while loading/unavailable rather than a placeholder pill. */
const DevicePhaseBadge: React.FC<{ imei: string }> = ({ imei }) => {
  const { data } = useLightingDeviceDetails(imei)
  const phase = data?.phase
  if (phase !== 1 && phase !== 3) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', flexShrink: 0,
      height: 26, borderRadius: 88, padding: '0 12px',
      border: '1px solid #FCD116',
      fontSize: 12, fontWeight: 500, color: '#FCD116', whiteSpace: 'nowrap',
    }}>
      {phase} Phase
    </span>
  )
}

const AlertMapPopup: React.FC<{
  roadCode: string
  departmentName: string
  devices: AlertPopupDevice[]
  onViewDetails: () => void
}> = ({ roadCode, departmentName, devices, onViewDetails }) => (
  <div style={{
    background: '#000000CC', borderRadius: 16, padding: '20px 24px',
    minWidth: 320, width: 'max-content', maxWidth: 520,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.08)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <TbBolt size={22} color="#FCD116" />
      <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>สายทาง : {roadCode}</span>
    </div>
    <p style={{ fontSize: 13, fontWeight: 500, color: '#FCD116', marginTop: 6, marginLeft: 32, whiteSpace: 'nowrap' }}>
      หน่วยงานรับผิดชอบ : {departmentName}
    </p>
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {devices.map((d) => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#FFFFFF', flex: 1, whiteSpace: 'nowrap' }}>{d.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <DevicePhaseBadge imei={d.imei} />
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
              height: 26, borderRadius: 88, padding: '0 12px',
              border: `1px solid ${d.isOnline ? '#66AEFF' : '#E94C4C'}`,
              fontSize: 12, fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap',
            }}>
              <img
                src={d.isOnline ? '/atlas/images/statistics/iconconnect.png' : '/atlas/images/statistics/iconnoconnect.png'}
                alt=""
                width={14}
                height={14}
              />
              {d.isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
            </span>
          </div>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={onViewDetails}
      style={{
        marginTop: 18, width: '100%', height: 40, borderRadius: 88,
        background: '#FCD116', color: '#212121', border: 'none',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}
    >
      ดูรายละเอียดเหตุการณ์
    </button>
  </div>
)

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'OVERVIEW' },
  { label: 'ตารางเปรียบเทียบเหตุการณ์', value: 'COMPARISON' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const isParent = (r: ComparisonRecord) => !r.isChild

const ALERT_COMPARISON_COLUMNS: ColumnsType<ComparisonRecord> = [
  {
    title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 260,
    render: (v: string, r: ComparisonRecord) => (
      <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff', fontWeight: isParent(r) ? 600 : 400, paddingLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {v}
        {r.isDevice && (
          <img
            src={r.online === 1 ? '/atlas/images/statistics/iconconnect.png' : '/atlas/images/statistics/iconnoconnect.png'}
            alt={r.online === 1 ? 'online' : 'offline'}
            width={14}
            height={14}
          />
        )}
      </span>
    ),
  },
  {
    title: 'จุดติดตั้ง', dataIndex: 'installations', key: 'installations', align: 'center', width: 120,
    render: (v: number, r: ComparisonRecord) => <span style={{ color: isParent(r) ? '#FCD116' : '#ffffff' }}>{v}</span>,
  },
  {
    title: 'ออนไลน์', dataIndex: 'online', key: 'online', align: 'center', width: 100,
    render: (v: number, r: ComparisonRecord) => r.isDevice ? null : <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#3A5692' } : {} }),
  },
  {
    title: 'ออฟไลน์', dataIndex: 'offline', key: 'offline', align: 'center', width: 100,
    render: (v: number, r: ComparisonRecord) => r.isDevice ? null : <span style={{ color: '#ffffff' }}>{v}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#853434' } : {} }),
  },
  {
    title: 'Line Check', dataIndex: 'lineCheck', key: 'lineCheck', align: 'center', width: 130,
    render: (v: number, r: ComparisonRecord) => r.isDevice
      ? (v === 0 ? <span style={{ color: '#F29F05', fontWeight: 600 }}>FAIL</span> : null)
      : <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#5C4A0A' } : {} }),
  },
  {
    title: 'Circuit', dataIndex: 'circuit', key: 'circuit', align: 'center', width: 120,
    render: (v: number, r: ComparisonRecord) => r.isDevice
      ? (v === 0 ? <span style={{ color: '#FCD116', fontWeight: 600 }}>FAIL</span> : null)
      : <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#5C4A0A' } : {} }),
  },
  {
    title: 'Volt / Amp', dataIndex: 'voltAmp', key: 'voltAmp', align: 'center', width: 120,
    render: (v: number, r: ComparisonRecord) => r.isDevice
      ? (v === 0 ? <span style={{ color: '#83F205', fontWeight: 600 }}>FAIL</span> : null)
      : <span style={{ color: '#ffffff' }}>{v ?? '-'}</span>,
    onCell: (r: ComparisonRecord) => ({ style: isParent(r) ? { background: '#2E4A1A' } : {} }),
  },
]

const alertStatusValue = (row: ComparisonRecord, key: 'lineCheck' | 'circuit' | 'voltAmp') => {
  const value = row[key]
  if (!row.isDevice) return value ?? '-'
  // Match the visual table's device-cell convention exactly.
  return value === 0 ? 'FAIL' : '-'
}

const ALERT_COMPARISON_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (row: ComparisonRecord) => string | number
}[] = [
  { header: 'หน่วยงาน / รายการ', width: 34, widthPct: 30, value: (r) => r.agency },
  { header: 'จุดติดตั้ง', width: 14, widthPct: 13, align: 'center', value: (r) => r.installations },
  { header: 'ออนไลน์', width: 12, widthPct: 12, align: 'center', value: (r) => r.isDevice ? '-' : r.online },
  { header: 'ออฟไลน์', width: 12, widthPct: 12, align: 'center', value: (r) => r.isDevice ? '-' : r.offline },
  { header: 'Line Check', width: 14, widthPct: 11, align: 'center', value: (r) => alertStatusValue(r, 'lineCheck') },
  { header: 'Circuit', width: 12, widthPct: 10, align: 'center', value: (r) => alertStatusValue(r, 'circuit') },
  { header: 'Volt / Amp', width: 13, widthPct: 12, align: 'center', value: (r) => alertStatusValue(r, 'voltAmp') },
]

/** Export reports are flat, while the comparison table is a bureau → sub-
 * department → road → device tree. Keep every matching branch and indent its
 * display label so the downloaded report retains the table's hierarchy. */
const flattenComparisonRows = (rows: ComparisonRecord[], depth = 0): ComparisonRecord[] => (
  rows.flatMap((row) => [
    { ...row, agency: `${'— '.repeat(depth)}${row.agency}` },
    ...flattenComparisonRows(row.children ?? [], depth + 1),
  ])
)



// Maps a period Segmented value to { start_date, end_date } bounds for the
// iot-status endpoints (which use `start_date`/`end_date`). Mirrors the same
// logic in IncidentSection's periodToDateBounds.
const periodToSinceUntil = (period: string): { start_date?: string; end_date?: string } => {
  const now = new Date()
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (period) {
    case 'TODAY':
      return { start_date: fmt(today), end_date: fmt(today) }
    case 'LAST_7_DAYS': {
      const start = new Date(today)
      start.setDate(start.getDate() - 6)
      return { start_date: fmt(start), end_date: fmt(today) }
    }
    case 'THIS_MONTH': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start_date: fmt(start), end_date: fmt(today) }
    }
    case 'THIS_YEAR': {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start_date: fmt(start), end_date: fmt(today) }
    }
    case 'LAST_YEAR': {
      const start = new Date(now.getFullYear() - 1, 0, 1)
      const end = new Date(now.getFullYear() - 1, 11, 31)
      return { start_date: fmt(start), end_date: fmt(end) }
    }
    case 'ALL':
      return { start_date: '2000-01-01', end_date: fmt(today) }
    default:
      return {}
  }
}

const AlertSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('TODAY')
  const [searchText, setSearchText] = useState('')
  const [comparisonExportOpen, setComparisonExportOpen] = useState(false)
  const [comparisonExportRows, setComparisonExportRows] = useState<ComparisonRecord[]>([])

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  // showReactPopup renders popup content into its OWN detached React root
  // (see popupHelper.ts) — outside the app tree, so it doesn't inherit any
  // context, including QueryClientProvider. DevicePhaseBadge needs useQuery,
  // so the popup content is re-wrapped in the ambient client below.
  const queryClient = useQueryClient()

  // Period → { since, until }. Shared by the stat cards AND the map/search-list
  // so they always agree. Part of the TanStack Query cache key AND the backend's
  // Redis cache key, so changing the period refetches automatically.
  const summaryDateRange = React.useMemo(() => periodToSinceUntil(activePeriod), [activePeriod])

  // ค้นหาสายทาง + map markers — `markerItems` plots each device at its OWN
  // real geometry_point (decoupled from the coarser bureau-level search tree).
  const {
    routeItems: liveRouteItems,
    markerItems,
    isLoading: routesLoading,
    isError: routesError,
  } = useLiveAlertRouteItems(summaryDateRange)

  // MapMarkerItem only carries routeKey/detailKey/lngLat/offline — cross-
  // reference liveRouteItems (which has the road_code/solution_name label +
  // sub-department name) to build the marker-group popup's content. Road
  // code is the part of the label before " - " (see useLiveAlertRouteItems'
  // `${road.road_code} - ${dev.solution_name}` construction).
  const deviceInfoByKey = useMemo(() => {
    const map = new Map<string, { label: string; roadCode: string; isOnline: boolean; subDeptName: string }>()
    for (const bureau of liveRouteItems) {
      for (const sub of bureau.sub3) {
        for (const d of sub.detail) {
          if (typeof d === 'string') continue
          const sepIndex = d.label.indexOf(' - ')
          const roadCode = sepIndex === -1 ? d.label : d.label.slice(0, sepIndex)
          const rest = sepIndex === -1 ? d.label : d.label.slice(sepIndex + 3)
          map.set(String(d.id), {
            label: rest,
            roadCode,
            isOnline: d.is_online ?? d.connected ?? false,
            subDeptName: sub.label,
          })
        }
      }
    }
    return map
  }, [liveRouteItems])

  // Devices that share the exact same coordinate (a "stuck" cluster —
  // StatisticsMapPanel already detected this) show this popup instead of
  // navigating straight to the detail page. The iot-status list endpoint
  // itself carries no "Phase" field, but `marker.detailKey` IS the device's
  // imei (see useLiveAlertRouteItems), so AlertMapPopup's DevicePhaseBadge
  // fetches it per-device from /lighting/imei/{imei}/details instead.
  const handleMarkerGroupClick = useCallback((items: MapMarkerItem[]): React.ReactNode => {
    const rows = items
      .map((it) => ({ marker: it, info: deviceInfoByKey.get(it.detailKey) }))
      .filter((x): x is { marker: MapMarkerItem; info: NonNullable<typeof x.info> } => !!x.info)
    if (rows.length === 0) return null
    const first = rows[0]
    return (
      <QueryClientProvider client={queryClient}>
        <AlertMapPopup
          roadCode={first.info.roadCode}
          departmentName={first.info.subDeptName}
          devices={rows.map(({ marker, info }) => ({ key: marker.detailKey, label: info.label, isOnline: info.isOnline, imei: marker.detailKey }))}
          onViewDetails={() => router.push(`/admin/statistics/detail/alert?route=${encodeURIComponent(first.marker.routeKey)}&detail=${encodeURIComponent(first.marker.detailKey)}`)}
        />
      </QueryClientProvider>
    )
  }, [deviceInfoByKey, router, queryClient])

  // Stat cards data — real API instead of mock.
  const { data: summaryData } = useIotStatusSummary(0, { scope: 'all', ...summaryDateRange })

  // Comparison table data — real API instead of mock. Reuses the same
  // iot-status tree the map/search list uses, but with its OWN period so the
  // comparison table's noti_count can be scoped independently from the
  // overview cards. Real nested tree — bureau.children = sub_department rows,
  // sub_department.children = road rows, road.children = device rows — so
  // antd's own indent mechanism staggers each level consistently (see
  // indentSize on StatisticsComparisonTable). Bureau rows are auto-expanded
  // on load via `defaultExpandTopLevel` so sub_department still shows with
  // no click needed; road and device levels stay collapsed until opened.
  // Device rows are a single install point with only boolean flags (no
  // aggregate counts), normalized to 1/0 to fit the same numeric columns.
  const [comparisonPeriod, setComparisonPeriod] = useState('TODAY')
  const comparisonDateRange = React.useMemo(() => periodToSinceUntil(comparisonPeriod), [comparisonPeriod])
  const { data: comparisonTree, isFetching: comparisonFetching, isError: comparisonError } = useIotStatus(0, { scope: 'all', ...comparisonDateRange })
  const comparisonData: ComparisonRecord[] = React.useMemo(() => {
    const bureaus = comparisonTree ?? []
    return bureaus.map((bureau) => {
      const subRows: ComparisonRecord[] = bureau.sub_department.map((sub) => {
        const roadRows: ComparisonRecord[] = sub.roads.map((road) => {
          const deviceRows: ComparisonRecord[] = road.devices.map((device) => ({
            key: `device-${device.imei}`,
            agency: device.solution_name,
            installations: 1,
            online: device.is_online ? 1 : 0,
            offline: device.is_online ? 0 : 1,
            newCmdWeb: 0,
            newCmdApp: 0,
            lineCheck: device.line_check_fail ? 1 : 0,
            circuit: device.circuit_fail ? 1 : 0,
            voltAmp: device.volt_amp_fail ? 1 : 0,
            isChild: true,
            isDevice: true,
          }))
          return {
            key: `road-${road.road_id}`,
            agency: road.road_code,
            installations: road.install_points,
            online: road.online,
            offline: road.offline,
            newCmdWeb: 0,
            newCmdApp: 0,
            lineCheck: road.line_check_fail,
            circuit: road.circuit_fail,
            voltAmp: road.volt_amp_fail,
            isChild: true,
            isRoad: true,
            children: deviceRows.length > 0 ? deviceRows : undefined,
          }
        })
        return {
          key: `sub-${sub.department_id}`,
          agency: sub.department_short_name,
          installations: sub.install_points,
          online: sub.online,
          offline: sub.offline,
          newCmdWeb: 0,
          newCmdApp: 0,
          lineCheck: sub.line_check_fail,
          circuit: sub.circuit_fail,
          voltAmp: sub.volt_amp_fail,
          isChild: true,
          children: roadRows.length > 0 ? roadRows : undefined,
        }
      })
      return {
        key: `bureau-${bureau.department_id}`,
        agency: bureau.department_short_name,
        installations: bureau.install_points,
        online: bureau.online,
        offline: bureau.offline,
        newCmdWeb: 0,
        newCmdApp: 0,
        lineCheck: bureau.line_check_fail,
        circuit: bureau.circuit_fail,
        voltAmp: bureau.volt_amp_fail,
        children: subRows.length > 0 ? subRows : undefined,
      }
    })
  }, [comparisonTree])
  const comparisonBadges: SummaryBadge[] = React.useMemo(() => {
    // Aggregate totals across all bureaus (the root already sums each, but a
    // bureau tree has no single root object, so sum them here).
    const bureaus = comparisonTree ?? []
    const sum = (sel: (b: typeof bureaus[number]) => number) => bureaus.reduce((acc, b) => acc + sel(b), 0)
    return [
      { label: `${sum(b => b.install_points)} จุดติดตั้ง`, color: '#66AEFF' },
      { label: `${sum(b => b.offline)} ออฟไลน์`, color: '#E94C4C', icon: '/atlas/images/statistics/iconnoconnect.png' },
      { label: `${sum(b => b.line_check_fail)} Line Check`, color: '#F29F05' },
      { label: `${sum(b => b.circuit_fail)} Circuit`, color: '#FCD116' },
      { label: `${sum(b => b.volt_amp_fail)} Volt / Amp`, color: '#83F205' },
    ]
  }, [comparisonTree])
  const alertCards: StatCard[] = React.useMemo(() => {
    const s = summaryData
    const fmt = (v: number | undefined) => s != null ? (v ?? 0) : '-'
    return [
      { borderColor: '#66AEFF', icon: '/atlas/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF', value: String(fmt(s?.installation_points?.total)), unit: 'จุดติดตั้ง', sub: s ? `1 Phase ${s.installation_points.phase_1} / 3 Phase ${s.installation_points.phase_3}` : '-' },
      { borderColor: '#E94C4C', icon: '/atlas/images/statistics/ce2.png', label: 'สถานะสายผิดปกติ', labelColor: '#E94C4C', value: String(fmt(s?.line_broken?.total)), unit: 'เหตุการณ์', sub: s?.line_broken.top_department ? `${s.line_broken.top_department.department_short_name} (${s.line_broken.top_department.percentage.toFixed(1)}%)` : '-' },
      { borderColor: '#E99A4C', icon: '/atlas/images/statistics/ce3.png', label: 'สถานะวงจรผิดปกติ', labelColor: '#E99A4C', value: String(fmt(s?.circuit_abnormal?.total)), unit: 'เหตุการณ์', sub: s?.circuit_abnormal.top_department ? `${s.circuit_abnormal.top_department.department_short_name} (${s.circuit_abnormal.top_department.percentage.toFixed(1)}%)` : '-' },
      { borderColor: '#FCD116', icon: '/atlas/images/statistics/ce4.png', label: 'การทำงานปกติรวม', labelColor: '#FCD116', value: s ? `${s.normal.percentage.toFixed(1)}%` : '-', sub: s ? `แจ้งเตือน ${s.notifications.total} เหตุการณ์` : '-' },
    ]
  }, [summaryData])

  return (
    <div className="flex flex-col">
      <section className="flex items-start gap-3 px-3 sm:px-10">
        <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
        <div>
          <h1 className="text-(--yellow)">ไฟฟ้าแจ้งเตือน</h1>
          <p className="text-(--yellow)">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </div>
      </section>
      <section className="mt-5 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive={activeSubTab}
          setLabelValue={(value) => router.push(`/admin/statistics?alert&subtab=${value.toLowerCase()}`)}
          size={isMobile ? 'middle' : 'large'}
        />
      </section>
      {activeSubTab === 'OVERVIEW' && (
        <section className="mt-4 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Segmented
            value={activePeriod}
            onChange={(value) => setActivePeriod(value as string)}
            options={PERIOD_OPTIONS}
            size={isMobile ? 'middle' : 'large'}
            classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
          />
        </section>
      )}
      {activeSubTab === 'OVERVIEW' && (
        <StatisticsMapPanel
          markerTextColor="#000000"
          markerItemColor="#FCD116"
          markerItemOverflowColor="#E94C4C"
          useModernMarkers
          detailUrl="/admin/statistics/detail/alert"
          markerOverflowThreshold={99}
          badgeColorFn={(item) => (item.notiTotal ?? 0) === 0 ? '#979797' : '#FCD116'}
          badgeValueFn={(item) => item.notiTotal ?? 0}
          subBadgeColorFn={(sub) => (sub.notiTotal ?? 0) === 0 ? '#979797' : '#FCD116'}
          subBadgeValueFn={(sub) => sub.notiTotal ?? 0}
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={alertCards}
          routeItems={liveRouteItems}
          markerItems={markerItems}
          loading={routesLoading}
          error={routesError}
          onMarkerGroupClick={handleMarkerGroupClick}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable
          data={comparisonData}
          summaryBadges={comparisonBadges}
          columns={ALERT_COMPARISON_COLUMNS}
          useArrowExpand
          defaultExpandTopLevel
          activePeriod={comparisonPeriod}
          onPeriodChange={setComparisonPeriod}
          loading={comparisonFetching}
          error={comparisonError}
          onExport={(rows) => {
            setComparisonExportRows(flattenComparisonRows(rows))
            setComparisonExportOpen(true)
          }}
        />
      )}
      <ExportFileModal
        open={comparisonExportOpen}
        onClose={() => setComparisonExportOpen(false)}
        count={comparisonExportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Lighting_Alert_Comparison_Report',
            title: 'รายงานเปรียบเทียบการแจ้งเตือนไฟฟ้าตามหน่วยงาน',
            filterNote: `ช่วงเวลา: ${PERIOD_OPTIONS.find((option) => option.value === comparisonPeriod)?.label ?? comparisonPeriod}`,
            columns: ALERT_COMPARISON_EXPORT_COLUMNS.map(({ header, widthPct, align, value }) => ({ header, widthPct, align, value })),
            rows: comparisonExportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Lighting_Alert_Comparison_Report',
            sheetName: 'Lighting Alert Comparison',
            title: 'รายงานเปรียบเทียบการแจ้งเตือนไฟฟ้าตามหน่วยงาน',
            filterNote: `ช่วงเวลา: ${PERIOD_OPTIONS.find((option) => option.value === comparisonPeriod)?.label ?? comparisonPeriod}`,
            columns: ALERT_COMPARISON_EXPORT_COLUMNS.map(({ header, width, value }) => ({ header, width, value })),
            rows: comparisonExportRows,
          })
        }}
      />
    </div>
  )
}

export default React.memo(AlertSection)
