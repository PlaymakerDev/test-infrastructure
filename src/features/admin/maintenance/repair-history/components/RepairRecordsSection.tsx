"use client"
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Table, Input, Button, ConfigProvider, Tag, Segmented, Select, Spin, Drawer, FloatButton } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbPrinter, TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbChevronDown } from 'react-icons/tb'
import SwapButton from '@/components/swap-button/SwapButton'
import { useRouter, useSearchParams } from 'next/navigation'
import useIsMobile from '@/utils/hooks/useIsMobile'
import {
  getMaintenanceSummaryAPI,
  getMaintenanceDetailAPI,
  getMaintenanceHistoryAPI,
} from '@/services/routes/MaintenanceService'
import type {
  SummaryItem,
  DetailBureau,
  DetailDepartment,
  DetailRoad,
  DetailProject,
  HistoryRegion,
  HistoryCase,
} from '@/types/maintenance'

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

  // API state for Solution tab
  const [summaryData, setSummaryData] = useState<SummaryItem[]>([])
  const [selectedType, setSelectedType] = useState<string>('')
  const [detailData, setDetailData] = useState<DetailBureau[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedDept, setExpandedDept] = useState<number | null>(null)
  const [expandedRoad, setExpandedRoad] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // API state for All Repairs tab
  const [historyData, setHistoryData] = useState<RepairRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPageSize, setHistoryPageSize] = useState(10)

  // Fetch summary on mount
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await getMaintenanceSummaryAPI()
        setSummaryData(res.data)
        if (res.data.length > 0) {
          setSelectedType(res.data[0].type)
        }
      } catch (err) {
        console.error('Error fetching summary:', err)
      }
    }
    fetchSummary()
  }, [])

  // Fetch detail when selected type changes
  const fetchDetail = useCallback(async (typeName: string) => {
    const typeId = SOLUTION_TYPE_ID_MAP[typeName]
    if (!typeId) return
    setDetailLoading(true)
    try {
      const res = await getMaintenanceDetailAPI(typeId)
      setDetailData(res.data)
    } catch (err) {
      console.error('Error fetching detail:', err)
      setDetailData([])
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedType) {
      fetchDetail(selectedType)
      setExpandedDept(null)
      setExpandedRoad(null)
    }
  }, [selectedType, fetchDetail])

  // Fetch maintenance history for All Repairs tab (status='all'; filter client-side by status tab)
  useEffect(() => {
    if (activeSubTab !== 'ALL_REPAIRS') return
    let cancelled = false
    const fetchHistory = async () => {
      setHistoryLoading(true)
      try {
        const res = await getMaintenanceHistoryAPI({ status: 'all' })
        if (!cancelled) setHistoryData(mapHistoryToRecords(res.data ?? []))
      } catch (err) {
        console.error('Error fetching maintenance history:', err)
        if (!cancelled) setHistoryData([])
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    fetchHistory()
    return () => { cancelled = true }
  }, [activeSubTab])

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

  const filteredData = activeStatusTab === 'ALL'
    ? historyData
    : historyData.filter(item => item.repairStatus === STATUS_TABS.find(t => t.value === activeStatusTab)?.statusFilter)

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

  // RowSpan + group-last info for the region column: merge cells when the same
  // region spans contiguous rows, and flag the last row of each group so we can
  // keep the divider only between different regions. Computed against the
  // current page (onCell/onRow indices are page-local, not global).
  const regionRows = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize
    const page = filteredData.slice(start, start + historyPageSize)
    const rowSpan: number[] = []
    for (let i = 0; i < page.length; i++) {
      const region = page[i]?.region
      const prevRegion = i > 0 ? page[i - 1]?.region : undefined
      if (i > 0 && prevRegion === region) {
        rowSpan[i] = 0
      } else {
        let span = 1
        for (let j = i + 1; j < page.length; j++) {
          if (page[j]?.region === region) span++
          else break
        }
        rowSpan[i] = span
      }
    }
    return { rowSpan }
  }, [filteredData, historyPage, historyPageSize])

  // Reset to page 1 when the status filter changes (result set may shrink)
  useEffect(() => {
    setHistoryPage(1)
  }, [activeStatusTab])

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
    { title: 'Case No.', dataIndex: 'caseNo', key: 'caseNo', width: 160 },
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
            {detailLoading ? (
              <div className="flex items-center justify-center h-40">
                <Spin size="large" />
              </div>
            ) : (
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

                {/* Tree Structure from API */}
                {detailData.map((bureau) => (
                  bureau.departments.map((dept) => (
                    <React.Fragment key={dept.department_id}>
                      {/* Department Level */}
                      <div
                        className="mt-3 px-3 py-2 rounded-[10px] cursor-pointer"
                        style={{ background: '#292828' }}
                        onClick={() => setExpandedDept(prev => prev === dept.department_id ? null : dept.department_id)}
                      >
                        <div className="flex items-center gap-4">
                          <TbChevronDown
                            className="text-[16px] shrink-0 transition-transform duration-200"
                            style={{ color: '#FCD116', transform: expandedDept === dept.department_id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          />
                          <span className="text-[14px] sm:text-[16px] font-normal" style={{ color: '#FCD116' }}>{dept.department_name}</span>
                          <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{dept.projects_count} โครงการ</span>
                          <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{dept.location_count} จุดติดตั้ง</span>
                          <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{dept.device_count} อุปกรณ์</span>
                          <div className="hidden sm:flex items-center gap-2 ml-auto">
                            {renderBadge(dept.online_count, '#66AEFF')}
                            {renderBadge(dept.offline_count, '#E94C4C')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 sm:hidden pl-7">
                          {renderBadge(dept.online_count, '#66AEFF')}
                          {renderBadge(dept.offline_count, '#E94C4C')}
                        </div>
                      </div>

                      {/* Road Level */}
                      {expandedDept === dept.department_id && dept.roads.map((road) => (
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
                            <div className="flex items-center gap-4">
                              <TbChevronDown
                                className="text-[16px] shrink-0 transition-transform duration-200"
                                style={{ color: '#FCD116', transform: expandedRoad === road.road_id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                              />
                              <span className="text-[14px] font-normal" style={{ color: '#FCD116' }}>{road.road_name}</span>
                              <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{road.projects_count} โครงการ</span>
                              <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{road.location_count} จุดติดตั้ง</span>
                              <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{road.device_count} อุปกรณ์</span>
                              <div className="hidden sm:flex items-center gap-2 ml-auto">
                                {renderBadge(road.online_count, '#66AEFF')}
                                {renderBadge(road.offline_count, '#E94C4C')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 sm:hidden pl-7">
                              {renderBadge(road.online_count, '#66AEFF')}
                              {renderBadge(road.offline_count, '#E94C4C')}
                            </div>
                          </div>

                          {/* Project Level — clickable to detail page */}
                          {expandedRoad === road.road_id && road.projects.map((proj) => {
                            const firstSolutionId = proj.solution_location?.[0]?.solution?.[0]?.solution_id
                            return (
                              <div
                                key={proj.project_id}
                                className="mt-1 rounded-[10px] cursor-pointer"
                                style={{ background: '#151515', paddingLeft: 60, paddingRight: 12, paddingTop: 8, paddingBottom: 8 }}
                                onClick={() => {
                                  if (firstSolutionId) {
                                    sessionStorage.setItem('maintenance_detail_title', road.road_name)
                                    sessionStorage.setItem('maintenance_detail_subtitle', proj.project_name)
                                    router.push(`/admin/maintenance/detail/${firstSolutionId}`)
                                  }
                                }}
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-[14px] font-normal" style={{ color: '#FCD116' }}>{proj.project_name}</span>
                                  <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{proj.location_count} จุดติดตั้ง</span>
                                  <span className="text-[12px] font-normal hidden sm:inline" style={{ color: '#B4B4B4' }}>{proj.device_count} อุปกรณ์</span>
                                  <div className="hidden sm:flex items-center gap-2 ml-auto">
                                    {renderBadge(proj.online_count, '#66AEFF')}
                                    {renderBadge(proj.offline_count, '#E94C4C')}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1 sm:hidden">
                                  {renderBadge(proj.online_count, '#66AEFF')}
                                  {renderBadge(proj.offline_count, '#E94C4C')}
                                </div>
                              </div>
                            )
                          })}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))
                ))}
              </>
            )}
          </div>
        </div>
      )}
      {activeSubTab === 'ALL_REPAIRS' && (
        <div className="repair-all-pagination mt-6 px-3 sm:px-10">
          <style>{`
            .repair-all-pagination .ant-pagination-item {
              background: rgba(255,255,255,0.06) !important;
              border: 1px solid #3c3e4e !important;
              border-radius: 20px !important;
              min-width: 32px !important;
              height: 32px !important;
              line-height: 30px !important;
              transition: all 0.2s ease !important;
            }
            .repair-all-pagination .ant-pagination-item a {
              color: #c2c2d3 !important;
              font-size: 13px !important;
            }
            .repair-all-pagination .ant-pagination-item:hover {
              border-color: #FCD116 !important;
            }
            .repair-all-pagination .ant-pagination-item:hover a {
              color: #FCD116 !important;
            }
            .repair-all-pagination .ant-pagination-item-active {
              background: #FCD116 !important;
              border-color: #FCD116 !important;
            }
            .repair-all-pagination .ant-pagination-item-active,
            .repair-all-pagination .ant-pagination-item-active a,
            .repair-all-pagination .ant-pagination-item-active span,
            .repair-all-pagination .ant-pagination-item-active div {
              color: #212121 !important;
            }
            .repair-all-pagination .ant-pagination-prev .ant-pagination-item-link,
            .repair-all-pagination .ant-pagination-next .ant-pagination-item-link {
              background: rgba(255,255,255,0.06) !important;
              border: 1px solid #3c3e4e !important;
              border-radius: 20px !important;
            }
            .repair-all-pagination .ant-pagination-prev button,
            .repair-all-pagination .ant-pagination-next button {
              color: #c2c2d3 !important;
            }
            .repair-all-pagination .ant-pagination-prev:not(.ant-pagination-disabled):hover .ant-pagination-item-link,
            .repair-all-pagination .ant-pagination-next:not(.ant-pagination-disabled):hover .ant-pagination-item-link {
              border-color: #FCD116 !important;
            }
            .repair-all-pagination .ant-pagination-prev:not(.ant-pagination-disabled):hover button,
            .repair-all-pagination .ant-pagination-next:not(.ant-pagination-disabled):hover button {
              color: #FCD116 !important;
            }
            .repair-all-pagination .ant-pagination-disabled .ant-pagination-item-link {
              opacity: 0.3 !important;
            }
            .repair-all-pagination .ant-pagination-disabled button {
              color: #555 !important;
            }
            .repair-all-pagination .ant-pagination-total-text {
              color: #979797 !important;
              font-size: 13px !important;
            }
            .repair-all-pagination .ant-select-selector {
              background: rgba(255,255,255,0.06) !important;
              border: 1px solid #3c3e4e !important;
              border-radius: 20px !important;
              color: #c2c2d3 !important;
              padding: 0 8px !important;
              height: 32px !important;
            }
            .repair-all-pagination .ant-select-selection-item {
              color: #c2c2d3 !important;
              line-height: 30px !important;
            }
            .repair-all-pagination .ant-select-arrow {
              color: #979797 !important;
            }
            .repair-all-pagination .ant-table-tbody > tr > td {
              border-bottom: 1px solid #FCD116 !important;
            }
          `}</style>
          {/* Tabs + Search/Period/Button — one row on desktop, stacked on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            {/* Tabs: 2x2 grid on mobile, horizontal underline on desktop */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-6 sm:shrink-0">
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
            {/* Search + Period + Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Input
                placeholder="ค้นหา Case No. หรือชื่ออุปกรณ์..."
                suffix={<TbSearch size={18} color='#FCD116' />}
                size="middle"
                style={{ width: isMobile ? '100%' : 360, height: 40, borderRadius: 10 }}
              />
              <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Segmented
                  options={PERIOD_OPTIONS}
                  defaultValue="ALL"
                  size={isMobile ? 'middle' : 'large'}
                  classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
                />
              </div>
              <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
                <Button type="primary" size={isMobile ? 'middle' : 'large'} shape="round" icon={<TbPrinter />} style={{ height: 40, alignSelf: isMobile ? 'flex-end' : undefined }}>
                  <p>นำออกเอกสาร</p>
                </Button>
              </ConfigProvider>
            </div>
          </div>
          {/* Filter Selects */}
          <div className="flex flex-wrap items-end gap-3 mb-4">
            {[
              { label: 'ภูมิภาค', placeholder: 'ภูมิภาคทั้งหมด...', width: 160 },
              { label: 'หน่วยงานรับผิดชอบ', placeholder: 'หน่วยงานทั้งหมด...', width: 200 },
              { label: 'สายทาง', placeholder: 'สายทางทั้งหมด...', width: 160 },
              { label: 'การค้ำประกัน', placeholder: 'สถานะการค้ำประกันทั้งหมด...', width: 240 },
              { label: 'หมวดหมู่ปัญหา', placeholder: 'หมวดหมู่ปัญหาทั้งหมด...', width: 200 },
            ].map((filter) => (
              <div key={filter.label} className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-fit sm:flex-initial">
                <span style={{ fontSize: 16, fontWeight: 400, color: '#FCD116' }}>{filter.label}</span>
                <Select
                  placeholder={filter.placeholder}
                  style={{ width: isMobile ? '100%' : filter.width, height: 40, borderRadius: 10, border: '1px solid #FCD116' }}
                  suffixIcon={<TbChevronDown size={16} color='#FCD116' />}
                  options={[{ label: 'ตัวอย่าง', value: 'example' }]}
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
            <Table
              columns={columns}
              dataSource={filteredData}
              loading={historyLoading}
              pagination={{
                current: historyPage,
                pageSize: historyPageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`,
                onChange: (page, pageSize) => {
                  setHistoryPage(page)
                  setHistoryPageSize(pageSize)
                },
              }}
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
