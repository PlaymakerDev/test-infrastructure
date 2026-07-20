"use client"
import React, { useState, useMemo } from 'react'
import { Table, Input, Button, ConfigProvider, Segmented, Select, Spin, Drawer, FloatButton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbChevronDown } from 'react-icons/tb'
import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter, useSearchParams } from 'next/navigation'
import useIsMobile from '@/utils/hooks/useIsMobile'
import {
  useMaintenanceSummary,
  useMaintenanceDetail,
  useMaintenanceHistory,
} from '@/hooks/queries/maintenance'
import type {
  HistoryRegion,
  HistoryCase,
} from '@/types/maintenance'

// The detail API sorts every nested level (bureaus, departments, roads,
// solution_location, ...) as plain strings — e.g. "สทช.10, สทช.11, ..., สทช.9"
// and "จุดติดตั้งที่ 1, 10, 11, 2, 3, ...". `numeric: true` makes embedded
// numbers compare by value instead of lexicographically, without disturbing
// normal Thai alphabetical order for names that have no digits.
const thCollator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' })
const sortByName = <T,>(items: T[], nameOf: (item: T) => string): T[] =>
  [...items].sort((a, b) => thCollator.compare(nameOf(a), nameOf(b)))

// Bureaus are sorted by their id, NOT by name: a Thai-alphabetical sort would put
// every "สทช.N" before "สบร." (ท before บ), but the id order is the intended
// sequence — สบร. (0, HQ) first, then สทช.1, สทช.2, ..., สทช.18 by index.
const sortById = <T,>(items: T[], idOf: (item: T) => number): T[] =>
  [...items].sort((a, b) => idOf(a) - idOf(b))

// Road rows show "road_code - road_name" when both exist; if road_name is blank,
// fall back to road_code alone (and vice-versa), then a placeholder when both are
// empty. Both fields can carry trailing spaces from the backend, so trim first.
const formatRoadLabel = (roadCode?: string | null, roadName?: string | null): string => {
  const code = (roadCode ?? '').trim()
  const name = (roadName ?? '').trim()
  if (code && name) return `${code} - ${name}`
  return code || name || 'โปรดระบุชื่อสายทาง'
}

const SUB_TAB_OPTIONS = [
  { label: 'สรุป Solution', value: 'SOLUTION' },
  { label: 'งานซ่อมทั้งหมด', value: 'ALL_REPAIRS' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

// Map the selected period to a { date_from, date_to } range the maintenance/history
// API expects (YYYY-MM-DD). 'ALL' returns undefined so no date filter is sent.
// The API filters by reported_at on cases, so the range is inclusive on both ends.
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const getPeriodRange = (period: string): { date_from?: string; date_to?: string } => {
  const now = new Date()
  if (period === 'TODAY') {
    const t = toDateStr(now)
    return { date_from: t, date_to: t }
  }
  if (period === 'LAST_7_DAYS') {
    const start = new Date(now)
    start.setDate(now.getDate() - 6) // include today → last 7 days
    return { date_from: toDateStr(start), date_to: toDateStr(now) }
  }
  if (period === 'THIS_MONTH') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { date_from: toDateStr(start), date_to: toDateStr(end) }
  }
  if (period === 'THIS_YEAR') {
    return { date_from: `${now.getFullYear()}-01-01`, date_to: `${now.getFullYear()}-12-31` }
  }
  if (period === 'LAST_YEAR') {
    const y = now.getFullYear() - 1
    return { date_from: `${y}-01-01`, date_to: `${y}-12-31` }
  }
  return {} // 'ALL' → no date filter
}

// Map solution type name → ID for detail API
const SOLUTION_TYPE_ID_MAP: Record<string, number> = {
  CCTV: 1,
  Counting: 2,
  Analytic: 3,
  Traffic: 4,
  Crosswalk: 5,
  VMS: 6,
  Lighting: 7,
  Tunnel: 8,
  WIM: 9,
}

interface RepairRecord {
  key: string
  region: string
  agency: string
  route: string
  installPoint: string
  caseNo: string
  solutionId?: number
  warranty: 'ในค้ำ' | 'หมดค้ำ'
  type: string
  problemCategory: string
  device: string
  repairDate: string
  offlineDays: number
  repairStatus: 'pending' | 'in_progress' | 'completed'
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'ยังไม่มีการตรวจเช็ค', color: '#E94C4C' },
  in_progress: { label: 'กำลังดำเนินการ', color: '#66AEFF' },
  completed: { label: 'ปิด Case', color: '#FCD116' },
}

interface QueryErrorNoticeProps {
  message: string
  onRetry: () => void
}

const QueryErrorNotice: React.FC<QueryErrorNoticeProps> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E94C4C] bg-[#E94C4C]/10 px-4 py-3"
  >
    <span className="text-[13px] text-[#E94C4C]">{message}</span>
    <Button size="small" danger onClick={onRetry}>
      ลองอีกครั้ง
    </Button>
  </div>
)

// Map API status (open|in_progress|closed) → UI repairStatus (pending|in_progress|completed)
const mapStatusToRepairStatus = (status: HistoryCase['status']): RepairRecord['repairStatus'] => {
  if (status === 'open') return 'pending'
  if (status === 'in_progress') return 'in_progress'
  return 'completed' // 'closed'
}

// Flatten HistoryRegion[] → RepairRecord[] to match the existing table shape
const mapHistoryToRecords = (regions: HistoryRegion[]): RepairRecord[] => {
  const records: RepairRecord[] = []
  regions.forEach((region) => {
    region.cases.forEach((c) => {
      records.push({
        key: c.case_no,
        region: region.region_name ?? '',
        agency: c.department_name ?? '',
        route: c.road_name ?? '',
        installPoint: c.location_name ?? '',
        caseNo: c.case_no ?? '',
        solutionId: typeof c.solution_id === 'number' && c.solution_id > 0
          ? c.solution_id
          : undefined,
        warranty: c.warranty_status ? 'ในค้ำ' : 'หมดค้ำ',
        type: c.solution_type ?? '',
        problemCategory: c.category?.trim() || '-',
        device: c.device_name ?? '',
        repairDate: c.reported_at ?? '',
        offlineDays: c.offline_days ?? 0,
        repairStatus: mapStatusToRepairStatus(c.status),
      })
    })
  })
  return records
}

const STATUS_TABS = [
  { label: 'ทั้งหมด', count: 8, value: 'ALL', statusFilter: null },
  { label: 'ยังไม่มีการตรวจเช็ค', count: 3, value: 'UNCHECKED', statusFilter: 'pending' },
  { label: 'กำลังดำเนินการ', count: 3, value: 'IN_PROGRESS', statusFilter: 'in_progress' },
  { label: 'ปิด Case', count: 2, value: 'CLOSED', statusFilter: 'completed' },
]

const RepairRecordsSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [searchOpen, setSearchOpen] = useState(true)
  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const activeSubTab = searchParams.has('all_repairs') ? 'ALL_REPAIRS' : 'SOLUTION'

  // Solution tab state
  const [selectedType, setSelectedType] = useState<string>('')
  const [expandedDept, setExpandedDept] = useState<number | null>(null)
  const [expandedRoad, setExpandedRoad] = useState<number | null>(null)
  const [expandedProject, setExpandedProject] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // All Repairs tab state
  const [selectedPeriod, setSelectedPeriod] = useState('ALL')

  // Client-side filter state for the All Repairs table — each Select holds the
  // raw string value shown in its column (warranty uses 'ในค้ำ'/'หมดค้ำ').
  const [filterRegion, setFilterRegion] = useState<string | undefined>(undefined)
  const [filterAgency, setFilterAgency] = useState<string | undefined>(undefined)
  const [filterRoute, setFilterRoute] = useState<string | undefined>(undefined)
  const [filterWarranty, setFilterWarranty] = useState<string | undefined>(undefined)
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined)
  const [searchText, setSearchText] = useState('')

  const summaryQuery = useMaintenanceSummary()
  const summaryData = useMemo(() => summaryQuery.data ?? [], [summaryQuery.data])

  // Seed the initial type tab from the first summary row — adjusted during
  // render (not an effect); the `!selectedType` guard keeps a later
  // background refetch from clobbering the user's pick.
  if (!selectedType && summaryData.length > 0) {
    setSelectedType(summaryData[0].type)
  }

  const detailQuery = useMaintenanceDetail(SOLUTION_TYPE_ID_MAP[selectedType])
  const detailData = useMemo(() => detailQuery.data ?? [], [detailQuery.data])
  const detailLoading = detailQuery.isLoading

  // Collapse the drill-down when switching type tabs — adjusted during render
  // (React's adjust-state-on-prop-change pattern), so it applies before the
  // new type's tree paints.
  const [prevType, setPrevType] = useState(selectedType)
  if (prevType !== selectedType) {
    setPrevType(selectedType)
    setExpandedDept(null)
    setExpandedRoad(null)
    setExpandedProject(null)
  }

  // History for the All Repairs tab. date_from/date_to derive from the selected
  // period so the API filters server-side; the status tab is still filtered
  // client-side on top of whatever 'all' returns. Disabled until the tab opens.
  const historyQuery = useMaintenanceHistory(
    { status: 'all', ...getPeriodRange(selectedPeriod) },
    activeSubTab === 'ALL_REPAIRS',
  )
  const historyData = useMemo(
    () => mapHistoryToRecords(historyQuery.data ?? []),
    [historyQuery.data],
  )
  const historyLoading = historyQuery.isLoading

  // Aggregate stats from detail data
  const detailStats = useMemo(() => {
    let departments = 0
    let roads = 0
    let projects = 0
    let locations = 0
    let online = 0
    let offline = 0
    detailData.forEach(bureau => {
      departments += bureau.departments.length
      bureau.departments.forEach(dept => {
        roads += dept.roads.length
        dept.roads.forEach(road => {
          projects += road.projects.length
          road.projects.forEach(proj => {
            locations += proj.solution_location.length
          })
        })
      })
      online += bureau.online_count
      offline += bureau.offline_count
    })
    return { departments, roads, projects, locations, online, offline }
  }, [detailData])

  // Unique options for each client-side filter, derived from the loaded history
  // data so only values that actually appear in the current (date-filtered) result
  // set are offered. Sorted with the Thai numeric collator to match the rest of the UI.
  const unique = (vals: string[]) => sortByName(
    Array.from(new Set(vals.filter(Boolean))),
    (s) => s,
  ).map((v) => ({ label: v, value: v }))

  const filterOptions = useMemo(() => ({
    region: unique(historyData.map((r) => r.region)),
    agency: unique(historyData.map((r) => r.agency)),
    route: unique(historyData.map((r) => r.route)),
    warranty: [
      { label: 'ในค้ำ', value: 'ในค้ำ' },
      { label: 'หมดค้ำ', value: 'หมดค้ำ' },
    ],
    category: unique(historyData.map((r) => r.problemCategory).filter((c) => c && c !== '-')),
  }), [historyData])

  const filteredData = historyData.filter(item => {
    if (activeStatusTab !== 'ALL' && item.repairStatus !== STATUS_TABS.find(t => t.value === activeStatusTab)?.statusFilter) return false
    if (filterRegion && item.region !== filterRegion) return false
    if (filterAgency && item.agency !== filterAgency) return false
    if (filterRoute && item.route !== filterRoute) return false
    if (filterWarranty && item.warranty !== filterWarranty) return false
    if (filterCategory && item.problemCategory !== filterCategory) return false
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      const haystack = `${item.caseNo} ${item.device}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  // Dynamic status tab counts from real history data (replaces hardcoded counts)
  const statusTabs = useMemo(
    () => STATUS_TABS.map((t) => ({
      ...t,
      count: t.statusFilter
        ? historyData.filter((r) => r.repairStatus === t.statusFilter).length
        : historyData.length,
    })),
    [historyData],
  )

  // RowSpan info for the region column: merge cells when the same region spans
  // contiguous rows, keeping the divider only between different regions. The
  // table now renders the full result set (no pagination), so indices map
  // directly to filteredData.
  const regionRows = useMemo(() => {
    const rowSpan: number[] = []
    for (let i = 0; i < filteredData.length; i++) {
      const region = filteredData[i]?.region
      const prevRegion = i > 0 ? filteredData[i - 1]?.region : undefined
      if (i > 0 && prevRegion === region) {
        rowSpan[i] = 0
      } else {
        let span = 1
        for (let j = i + 1; j < filteredData.length; j++) {
          if (filteredData[j]?.region === region) span++
          else break
        }
        rowSpan[i] = span
      }
    }
    return { rowSpan }
  }, [filteredData])

  const handleSubTabChange = (value: string) => {
    if (value === 'ALL_REPAIRS') {
      router.push('/admin/maintenance?repair&all_repairs')
    } else {
      router.push('/admin/maintenance?repair')
    }
  }

  const columns: ColumnsType<RepairRecord> = [
    {
      title: 'ภูมิภาค', dataIndex: 'region', key: 'region', width: 120,
      onCell: (_, index) => ({
        rowSpan: index !== undefined && index >= 0 ? (regionRows.rowSpan[index] ?? 1) : 1,
      }),
    },
    { title: 'หน่วยงาน', dataIndex: 'agency', key: 'agency', width: 160 },
    { title: 'สายทาง', dataIndex: 'route', key: 'route', width: 180 },
    { title: 'จุดติดตั้ง', dataIndex: 'installPoint', key: 'installPoint', width: 130 },
    {
      title: 'Case No.', dataIndex: 'caseNo', key: 'caseNo', width: 160,
      // Same destination as the "เปิด Case" confirm flow on the device
      // detail page (detail/screen/index.tsx) — otherwise this list shows
      // every case's number but has no way to open one back up.
      render: (caseNo: string, record) => (
        <span
          style={{ color: '#FCD116', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={(e) => {
            e.stopPropagation()
            const params = new URLSearchParams({
              source: 'all_repairs',
              solution_type: record.type,
            })
            // Prefer the exact solution id when the history endpoint provides
            // it. Older responses only expose solution_type; the case screen
            // then resolves that named relationship and never guesses the
            // first of several camera relationships.
            if (record.solutionId) params.set('solution_id', String(record.solutionId))
            router.push(`/admin/maintenance/case/${caseNo}?${params.toString()}`)
          }}
        >
          {caseNo}
        </span>
      ),
    },
    {
      title: 'การค้ำประกัน', dataIndex: 'warranty', key: 'warranty', width: 140, align: 'center',
      render: (warranty: string) => (
        <span style={{
          color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797',
          border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#979797'}`,
          borderRadius: 9999,
          padding: '2px 12px',
          fontSize: 14,
          fontWeight: 400,
        }}>
          {warranty}
        </span>
      ),
    },
    { title: 'ประเภท', dataIndex: 'type', key: 'type', width: 140 },
    { title: 'หมวดหมู่ปัญหา', dataIndex: 'problemCategory', key: 'problemCategory', width: 160 },
    { title: 'อุปกรณ์', dataIndex: 'device', key: 'device', width: 180 },
    { title: 'วันที่แจ้งซ่อม', dataIndex: 'repairDate', key: 'repairDate', width: 130 },
    {
      title: 'จำนวนวันออฟไลน์', dataIndex: 'offlineDays', key: 'offlineDays', width: 150, align: 'center',
      render: (days: number) => <span style={{ color: days > 10 ? '#E94C4C' : '#FFFFFF' }}>{days} วัน</span>,
    },
    {
      title: 'สถานะการซ่อม', dataIndex: 'repairStatus', key: 'repairStatus', width: 180, align: 'center',
      render: (status: string) => {
        const s = STATUS_MAP[status]
        return s ? (
          <span style={{
            color: s.color,
            border: `1px solid ${s.color}`,
            borderRadius: 9999,
            padding: '2px 12px',
            fontSize: 14,
            fontWeight: 400,
          }}>
            {s.label}
          </span>
        ) : null
      },
    },
  ]

  const renderBadge = (count: number, color: string) => (
    <span
      className="inline-flex items-center gap-1.5 text-[12px] font-normal whitespace-nowrap"
      style={{ padding: '2px 12px', borderRadius: 9999, border: `1px solid ${color}`, color, minWidth: 70, textAlign: 'center' }}
    >
      <img src={`/atlas/images/Maintenance/${color === '#66AEFF' ? 'icblue' : 'icred'}.png`} alt="" width={15} height={15} />
      <span style={{ marginTop: 2 }}>{count}</span>
    </span>
  )

  // Compact online/offline count pill for each tree row — smaller than the header's
  // renderBadge, and kept visible on every breakpoint (unlike the projects/locations/
  // devices metadata, which hides below sm) since it's the status the user tracks.
  const renderCountBadge = (count: number, color: string) => (
    <span
      className="inline-flex items-center gap-1 text-[12px] font-normal whitespace-nowrap shrink-0 mt-0.5"
      style={{ padding: '1px 8px', borderRadius: 9999, border: `1px solid ${color}`, color }}
    >
      <img src={`/atlas/images/Maintenance/${color === '#66AEFF' ? 'icblue' : 'icred'}.png`} alt="" width={12} height={12} />
      <span style={{ marginTop: 1 }}>{count}</span>
    </span>
  )

  const selectedSummary = summaryData.find(s => s.type === selectedType)

  return (
    <div className="flex flex-col h-full">
      <section className="mt-5 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SwapButton
          options={SUB_TAB_OPTIONS}
          defaultActive={activeSubTab}
          setLabelValue={handleSubTabChange}
          size={isMobile ? 'middle' : 'large'}
          key={activeSubTab}
        />
      </section>
      {activeSubTab === 'SOLUTION' && (
        <div className="mt-6 flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
          {/* Left Sidebar: Solution Types from API — desktop only */}
          <div className="relative shrink-0 max-xl:hidden h-full">
            <div className={[
              'overflow-hidden transition-[width] duration-300 ease-in-out bg-(--dark-black) rounded-2xl h-full',
              searchOpen ? 'w-md' : 'w-0',
            ].join(' ')}>
              <div className="w-md h-full overflow-y-auto p-5">
                <p className="text-[16px] font-normal" style={{ color: '#66AEFF' }}>Solution Types</p>
                <p className="text-[12px] font-normal mt-1" style={{ color: '#979797' }}>เลือก Solution ที่ต้องการติดตามสถานะการทำงาน</p>
                <div className="mt-4 flex flex-col gap-2">
                  {summaryData.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between px-3 py-2 rounded-[10px] cursor-pointer"
                      style={{
                        background: selectedType === item.type ? '#2A2A2A' : '#363636',
                        border: selectedType === item.type ? '1px solid #66AEFF' : '1px solid transparent',
                      }}
                      onClick={() => setSelectedType(item.type)}
                    >
                      <span className="text-[12px] font-normal shrink-0" style={{ color: '#66AEFF' }}>{item.type}</span>
                      <span className="text-[12px] font-normal whitespace-nowrap" style={{ color: '#979797' }}>
                        {item.location_count} จุดติดตั้ง {item.device_count.toLocaleString()} อุปกรณ์
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              type="primary"
              shape="circle"
              title={searchOpen ? 'ซ่อนรายการสายทาง' : 'แสดงรายการสายทาง'}
              icon={searchOpen
                ? <TbLayoutSidebarLeftCollapse className="fs-18" />
                : <TbLayoutSidebarLeftExpand className="fs-18" />
              }
              onClick={() => setSearchOpen((prev) => !prev)}
              className="absolute! top-10 -right-5 z-20 w-10! h-10! shadow-lg"
            />
          </div>

          {/* Mobile Solution Type Selector — FloatButton + Drawer */}
          <FloatButton
            type='primary'
            icon={<TbSearch className='fs-18' />}
            onClick={() => setDrawerOpen(true)}
            className='xl:hidden!'
            style={{ bottom: 24, insetInlineEnd: 'auto', insetInlineStart: 24 }}
          />
          <Drawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            placement='bottom'
            styles={{
              wrapper: { width: '100%' },
              body: { padding: 0, background: 'var(--dark-black)' },
              header: {
                background: 'var(--dark-black)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              },
              close: { color: 'white' },
            }}
            title='เลือก Solution Types'
          >
            <div style={{ height: '50vh', overflow: 'auto' }}>
              <div className="p-4">
                <p className="text-[12px] font-normal mt-1" style={{ color: '#979797' }}>เลือก Solution ที่ต้องการติดตามสถานะการทำงาน</p>
                <div className="mt-3 flex flex-col gap-2">
                  {summaryData.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between px-3 py-2 rounded-[10px] cursor-pointer"
                      style={{
                        background: selectedType === item.type ? '#2A2A2A' : '#363636',
                        border: selectedType === item.type ? '1px solid #66AEFF' : '1px solid transparent',
                      }}
                      onClick={() => {
                        setSelectedType(item.type)
                        setDrawerOpen(false)
                      }}
                    >
                      <span className="text-[12px] font-normal shrink-0" style={{ color: '#66AEFF' }}>{item.type}</span>
                      <span className="text-[12px] font-normal whitespace-nowrap" style={{ color: '#979797' }}>
                        {item.location_count} จุดติดตั้ง {item.device_count.toLocaleString()} อุปกรณ์
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Drawer>

          {/* Right Content: Tree from detail API */}
          <div className="flex-1 min-w-0 h-full px-3 sm:px-4 xl:pl-4 xl:pr-4">
            {summaryQuery.isError && (
              <QueryErrorNotice
                message="ไม่สามารถโหลดรายการประเภท Solution ได้"
                onRetry={() => { void summaryQuery.refetch() }}
              />
            )}
            {detailQuery.isError && (
              <div className={summaryQuery.isError ? 'mt-3' : ''}>
                <QueryErrorNotice
                  message={`ไม่สามารถโหลดรายละเอียด ${selectedType || 'Solution'} ได้`}
                  onRetry={() => { void detailQuery.refetch() }}
                />
              </div>
            )}
            {(summaryQuery.isLoading && summaryData.length === 0) || (detailLoading && detailData.length === 0) ? (
              <div className="flex items-center justify-center h-40">
                <Spin size="large" />
              </div>
            ) : (summaryQuery.isError && summaryData.length === 0) || (detailQuery.isError && detailData.length === 0) ? null : (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-[18px] sm:text-[24px] font-bold" style={{ color: '#FCD116' }}>{selectedType}</span>
                  {renderBadge(detailStats.online, '#66AEFF')}
                  {renderBadge(detailStats.offline, '#E94C4C')}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3">
                  <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>{detailStats.departments} หน่วยงาน</span>
                  <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>{detailStats.projects} โครงการ</span>
                  <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>{selectedSummary?.location_count.toLocaleString() ?? 0} จุดติดตั้ง</span>
                  <span className="text-[12px] font-normal" style={{ color: '#E9D682' }}>{selectedSummary?.device_count.toLocaleString() ?? 0} อุปกรณ์</span>
                </div>

                {/* Tree Structure from API — bureau (plain label) > department > road > project >
                    solution_location/solution (leaf). Each level from department down is its own
                    collapsible, so every solution stays grouped under the project that actually owns it
                    — a road can hold several projects, and a project can own many installation points. */}
                {sortById(detailData, (b) => b.bureau_id).map((bureau) => (
                  <React.Fragment key={bureau.bureau_id}>
                    {/* Bureau Level — plain section label, always expanded (no card, no chevron).
                        A blank bureau_name (see DetailBureau sample data) is HQ's implicit bucket. */}
                    <div className="mt-4 flex items-center gap-4 flex-wrap px-1">
                      <span className="text-[14px] sm:text-[16px] font-medium" style={{ color: '#FFFFFF' }}>{bureau.bureau_name || 'ส่วนกลาง'}</span>
                      <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{bureau.projects_count} โครงการ</span>
                      <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{bureau.location_count} จุดติดตั้ง</span>
                      <span className="text-[12px] font-normal" style={{ color: '#B4B4B4' }}>{bureau.device_count} อุปกรณ์</span>
                      {renderCountBadge(bureau.online_count, '#66AEFF')}
                      {renderCountBadge(bureau.offline_count, '#E94C4C')}
                    </div>

                    {sortByName(bureau.departments, (d) => d.department_name).map((dept) => (
                      <React.Fragment key={dept.department_id}>
                        {/* Department Level */}
                        <div
                          className="mt-3 px-3 py-2 rounded-[10px] cursor-pointer"
                          style={{ background: '#292828' }}
                          onClick={() => setExpandedDept(prev => prev === dept.department_id ? null : dept.department_id)}
                        >
                          <div className="flex items-start gap-4">
                            <TbChevronDown
                              className="text-[16px] shrink-0 transition-transform duration-200 mt-1"
                              style={{ color: '#FCD116', transform: expandedDept === dept.department_id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            />
                            <span className="text-[14px] sm:text-[16px] font-normal min-w-0 flex-1 break-words" style={{ color: '#FCD116' }} title={dept.department_name}>{dept.department_name}</span>
                            <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{dept.projects_count} โครงการ</span>
                            <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{dept.location_count} จุดติดตั้ง</span>
                            <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{dept.device_count} อุปกรณ์</span>
                            {renderCountBadge(dept.online_count, '#66AEFF')}
                            {renderCountBadge(dept.offline_count, '#E94C4C')}
                          </div>
                        </div>

                        {/* Road Level */}
                        {expandedDept === dept.department_id && sortByName(dept.roads, (r) => r.road_name).map((road) => (
                          <React.Fragment key={road.road_id}>
                            <div
                              className="mt-1 rounded-[10px] cursor-pointer"
                              style={{
                                background: '#151515',
                                paddingLeft: 36,
                                paddingRight: 12,
                                paddingTop: 8,
                                paddingBottom: 8,
                                border: expandedRoad === road.road_id ? '1px solid #FCD116' : '1px solid transparent',
                              }}
                              onClick={() => setExpandedRoad(prev => prev === road.road_id ? null : road.road_id)}
                            >
                              <div className="flex items-start gap-4">
                                <TbChevronDown
                                  className="text-[16px] shrink-0 transition-transform duration-200 mt-1"
                                  style={{ color: '#FCD116', transform: expandedRoad === road.road_id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                />
                                <span className="text-[14px] font-normal min-w-0 flex-1 break-words" style={{ color: '#FCD116' }} title={formatRoadLabel(road.road_code, road.road_name)}>{formatRoadLabel(road.road_code, road.road_name)}</span>
                                <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{road.projects_count} โครงการ</span>
                                <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{road.location_count} จุดติดตั้ง</span>
                                <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{road.device_count} อุปกรณ์</span>
                                {renderCountBadge(road.online_count, '#66AEFF')}
                                {renderCountBadge(road.offline_count, '#E94C4C')}
                              </div>
                            </div>

                            {/* Project Level — a road can own several projects, and a single project can
                                own many installation points (e.g. 11 จุดติดตั้ง on ถนนราชพฤกษ์). Giving
                                project its own collapsible keeps each project's devices grouped together
                                instead of flattened into one anonymous list under the road. */}
                            {expandedRoad === road.road_id && sortByName(road.projects, (p) => p.project_name).map((proj) => (
                              <React.Fragment key={proj.project_id}>
                                <div
                                  className="mt-1 rounded-[10px] cursor-pointer"
                                  style={{
                                    background: '#151515',
                                    paddingLeft: 48,
                                    paddingRight: 12,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                    border: expandedProject === proj.project_id ? '1px solid #FCD116' : '1px solid transparent',
                                  }}
                                  onClick={() => setExpandedProject(prev => prev === proj.project_id ? null : proj.project_id)}
                                >
                                  <div className="flex items-start gap-4">
                                    <TbChevronDown
                                      className="text-[16px] shrink-0 transition-transform duration-200 mt-1"
                                      style={{ color: '#FCD116', transform: expandedProject === proj.project_id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                    />
                                    <span className="text-[14px] font-normal min-w-0 flex-1 break-words" style={{ color: '#FCD116' }} title={proj.project_name}>{proj.project_name || 'โปรดระบุชื่อโครงการ'}</span>
                                    <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{proj.location_count} จุดติดตั้ง</span>
                                    <span className="text-[12px] font-normal hidden sm:inline shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{proj.device_count} อุปกรณ์</span>
                                    {renderCountBadge(proj.online_count, '#66AEFF')}
                                    {renderCountBadge(proj.offline_count, '#E94C4C')}
                                  </div>
                                </div>

                                {/* Solution leaf — one row per (solution_location, solution) under this
                                    project. A solution_location can legitimately hold more than one
                                    solution (e.g. two VMS signs sharing one installation point), so
                                    flatten all the way into loc.solution so every device gets its own
                                    clickable row instead of only the first being reachable. */}
                                {expandedProject === proj.project_id && sortByName(proj.solution_location ?? [], (l) => l.solution_location_name).flatMap((loc) =>
                                  sortByName(loc.solution ?? [], (s) => s.solution_name).map((sol) => (
                                    <div
                                      key={sol.solution_id}
                                      className="mt-1 rounded-[10px] cursor-pointer flex items-start gap-4"
                                      style={{ background: '#151515', paddingLeft: 72, paddingRight: 12, paddingTop: 8, paddingBottom: 8 }}
                                      onClick={() => {
                                        // A road+project can own several installation points (see the
                                        // flatMap above) — append the solution's own name so the detail
                                        // page's subtitle actually distinguishes which point this is,
                                        // instead of showing the same road+project text for all of them.
                                        const solutionLabel = sol.solution_name || loc.solution_location_name
                                        // Keep route context in the URL so a direct/deep navigation can
                                        // never inherit another solution's stale browser state.
                                        // `prefix` + `dept_id` resolve the map endpoint; project detail is
                                        // resolved independently from the route's solution id.
                                        const params = new URLSearchParams({
                                          context_id: String(sol.solution_id),
                                          prefix: selectedType.toLowerCase(),
                                          dept_id: String(dept.department_id),
                                          road_id: String(road.road_id),
                                          title: road.road_name || sol.solution_name || String(sol.solution_id),
                                          subtitle: `${proj.project_name} — ${solutionLabel}`,
                                        })
                                        router.push(`/admin/maintenance/detail/${sol.solution_id}?${params.toString()}`)
                                      }}
                                    >
                                      <span className="text-[14px] font-normal min-w-0 flex-1 break-words" style={{ color: '#FCD116' }} title={sol.solution_name || loc.solution_location_name}>{sol.solution_name || loc.solution_location_name}</span>
                                      <span className="text-[12px] font-normal shrink-0 mt-1" style={{ color: '#B4B4B4' }}>{loc.solution_location_name}</span>
                                      {renderCountBadge(sol.online_count, '#66AEFF')}
                                      {renderCountBadge(sol.offline_count, '#E94C4C')}
                                    </div>
                                  ))
                                )}
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>
      )}
      {activeSubTab === 'ALL_REPAIRS' && (
        <div className="repair-all-table mt-6 px-3 sm:px-10">
          <style>{`
            .repair-all-table .ant-table-tbody > tr > td {
              border-bottom: 1px solid #FCD116 !important;
            }
          `}</style>
          {/* Tabs + Search/Period/Button — single row on wide desktops (≥1280px),
              two stacked rows everywhere else (incl. iPad) so nothing overflows.
                row 1: status tabs (full width)
                row 2: search + period + export button */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-5">
            {/* Tabs: 2x2 grid on mobile, horizontal underline on ≥640px */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-6 xl:shrink-0">
              {statusTabs.map((tab) => {
                const isActive = activeStatusTab === tab.value
                return (
                  <div key={tab.value} className="cursor-pointer" onClick={() => setActiveStatusTab(tab.value)}>
                    {/* Mobile: pill */}
                    <div
                      className="sm:hidden flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200"
                      style={{ background: isActive ? '#FCD116' : 'rgba(255,255,255,0.06)', border: `1px solid ${isActive ? '#FCD116' : '#3c3e4e'}` }}
                    >
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? '#212121' : '#c2c2d3' }}>{tab.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#212121' : '#979797', border: `1px solid ${isActive ? '#21212140' : '#979797'}`, borderRadius: 9999, padding: '1px 8px', minWidth: 28, textAlign: 'center' }}>{tab.count}</span>
                    </div>
                    {/* Desktop: underline */}
                    <div
                      className="hidden sm:flex items-center gap-2 shrink-0"
                      style={{ padding: '8px 0', borderBottom: isActive ? '2px solid #FCD116' : '2px solid transparent' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? '#FCD116' : '#979797' }}>{tab.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#FCD116' : '#979797', border: `1px solid ${isActive ? '#FCD116' : '#979797'}`, borderRadius: 9999, padding: '2px 10px', minWidth: 36, textAlign: 'center' }}>{tab.count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Search + Period + Button
                On wide desktops (≥1280px): single row, search has fixed width 360.
                Below that (incl. iPad): search + period sit on one line and wrap their
                intrinsic widths; the export button drops to its own line so the period
                border can size to its content instead of being squeezed. */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:flex-1 xl:flex-initial xl:flex-nowrap">
              <Input
                allowClear
                placeholder="ค้นหา Case No. หรือชื่ออุปกรณ์..."
                suffix={<TbSearch size={18} color='#FCD116' />}
                size="middle"
                style={{ width: isMobile ? '100%' : 360, height: 40, borderRadius: 10 }}
                className="shrink-0"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Segmented
                options={PERIOD_OPTIONS}
                value={selectedPeriod}
                onChange={(v) => setSelectedPeriod(v as string)}
                size={isMobile ? 'middle' : 'large'}
                classNames={{ root: 'border! border-(--yellow)!' }}
                className="shrink-0"
              />
            </div>
          </div>
          {/* Filter Selects */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            {[
              { label: 'ภูมิภาค', placeholder: 'ภูมิภาคทั้งหมด...', width: 160, value: filterRegion, onChange: setFilterRegion, options: filterOptions.region },
              { label: 'หน่วยงานรับผิดชอบ', placeholder: 'หน่วยงานทั้งหมด...', width: 200, value: filterAgency, onChange: setFilterAgency, options: filterOptions.agency },
              { label: 'สายทาง', placeholder: 'สายทางทั้งหมด...', width: 160, value: filterRoute, onChange: setFilterRoute, options: filterOptions.route },
              { label: 'การค้ำประกัน', placeholder: 'สถานะการค้ำประกันทั้งหมด...', width: 240, value: filterWarranty, onChange: setFilterWarranty, options: filterOptions.warranty },
              { label: 'หมวดหมู่ปัญหา', placeholder: 'หมวดหมู่ปัญหาทั้งหมด...', width: 200, value: filterCategory, onChange: setFilterCategory, options: filterOptions.category },
            ].map((filter) => (
              <div key={filter.label} className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-fit sm:flex-initial">
                <span style={{ fontSize: 16, fontWeight: 400, color: '#FCD116' }}>{filter.label}</span>
                <Select
                  allowClear
                  showSearch
                  placeholder={filter.placeholder}
                  style={{ width: isMobile ? '100%' : filter.width, height: 40, borderRadius: 10, border: '1px solid #FCD116' }}
                  suffixIcon={<TbChevronDown size={16} color='#FCD116' />}
                  value={filter.value}
                  onChange={filter.onChange}
                  options={filter.options}
                />
              </div>
            ))}
          </div>
          <ConfigProvider
            theme={{
              token: { colorBgContainer: '#2a2a2a', colorText: '#c2c2d3' },
              components: {
                Select: {
                  optionActiveBg: '#FCD11620',
                  optionSelectedBg: '#FCD11640',
                  colorBgElevated: '#2a2a2a',
                },
              },
            }}
          >
            {historyQuery.isError && (
              <div className="mb-4">
                <QueryErrorNotice
                  message="ไม่สามารถโหลดรายการงานซ่อมทั้งหมดได้"
                  onRetry={() => { void historyQuery.refetch() }}
                />
              </div>
            )}
            <Table
              columns={columns}
              dataSource={filteredData}
              loading={historyLoading}
              pagination={false}
              size="middle"
              rowKey="key"
              scroll={{ x: 'max-content' }}
            />
          </ConfigProvider>
        </div>
      )}
    </div>
  )
}

export default React.memo(RepairRecordsSection)
