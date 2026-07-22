"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { Input, Table, Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbSearch, TbChevronLeft, TbChevronRight } from 'react-icons/tb'
import {
  useMaintenanceSummary,
  useMaintenanceWarrantySummary,
  useMaintenanceOfflineRoads,
  useUptimeStatisticsAll,
} from '@/hooks/queries/maintenance'

// Hidden from Solution Overview until a real uptime-statistics endpoint
// exists for them — showing a mock percentage next to 7 real ones is
// misleading.
const HIDDEN_SOLUTION_TYPES = new Set(['Counting', 'Analytic'])

interface LineRecord {
  key: string
  line: string
  installPoints: number
  devices: number
  offline: number
}

const LINE_COLUMNS: ColumnsType<LineRecord> = [
  { title: 'สายทาง', dataIndex: 'line', key: 'line' },
  {
    title: 'จุดติดตั้ง', dataIndex: 'installPoints', key: 'installPoints', align: 'center',
    render: (val: number) => <span style={{ color: '#FCD116' }}>{val}</span>,
  },
  { title: 'อุปกรณ์', dataIndex: 'devices', key: 'devices', align: 'center' },
  {
    title: 'ออฟไลน์', dataIndex: 'offline', key: 'offline', align: 'center',
    render: (val: number) => (
      <span style={{ backgroundColor: '#E94C4C', color: '#FFFFFF', borderRadius: 88, width: 50, display: 'inline-block', textAlign: 'center' }}>
        {val}
      </span>
    ),
  },
]

const SOLUTION_COLORS: Record<string, string> = {
  CCTV: '#FF8566',
  Traffic: '#FFC766',
  Crosswalk: '#D9FF66',
  VMS: '#70FF66',
  Lighting: '#66FFB5',
  Tunnel: '#66F0FF',
  WIM: '#668CFF',
  Counting: '#D9FF66',
  Analytic: '#70FF66',
  'Traffic Signal': '#66FFB5',
}

const getSolutionColor = (type: string): string => {
  return SOLUTION_COLORS[type] || '#70FF66'
}

/** Map period value (from URL) to YYYY-MM-DD string for API param `offline_since` */
const periodToOfflineSince = (period?: string): string | undefined => {
  const now = new Date()
  // Use local date parts instead of toISOString() to avoid UTC offset issues (e.g. UTC+7)
  const toYYYYMMDD = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  switch (period) {
    case 'TODAY': {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return toYYYYMMDD(d)
    }
    case 'LAST_7_DAYS': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return toYYYYMMDD(d)
    }
    case 'THIS_MONTH': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1)
      return toYYYYMMDD(d)
    }
    case 'THIS_YEAR': {
      const d = new Date(now.getFullYear(), 0, 1)
      return toYYYYMMDD(d)
    }
    case 'LAST_YEAR': {
      const d = new Date(now.getFullYear() - 1, 0, 1)
      return toYYYYMMDD(d)
    }
    case 'ALL':
    default:
      return undefined
  }
}

const MaintenanceOverviewSection: React.FC<{
  period?: string
}> = ({ period }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchText, setSearchText] = useState('')
  const pageSize = 10

  const offlineSince = periodToOfflineSince(period || 'ทั้งหมด')

  const summaryQuery = useMaintenanceSummary()
  const warrantyQuery = useMaintenanceWarrantySummary()
  const offlineRoadsQuery = useMaintenanceOfflineRoads(offlineSince)
  // Per-domain queries — a failed domain is simply absent from byType (its
  // ring falls back below), so one bad endpoint never blanks the others or
  // trips the page-level error state.
  const uptime = useUptimeStatisticsAll()

  const summaryData = summaryQuery.data ?? []
  const warrantyData = warrantyQuery.data ?? []
  const offlineRoads = useMemo(() => offlineRoadsQuery.data ?? [], [offlineRoadsQuery.data])
  const uptimeData = uptime.byType
  const loading = summaryQuery.isLoading || warrantyQuery.isLoading || offlineRoadsQuery.isLoading || uptime.isLoading
  const error = summaryQuery.isError || warrantyQuery.isError || offlineRoadsQuery.isError
    ? 'ไม่สามารถโหลดข้อมูลได้'
    : null

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  // Get warranty data
  const inWarranty = warrantyData.find(w => w.in_warranty === true)
  const outWarranty = warrantyData.find(w => w.in_warranty === false)

  // Filter offline roads by search text
  const filteredOfflineRoads = useMemo(() => {
    if (!searchText.trim()) return offlineRoads
    const q = searchText.toLowerCase().trim()
    return offlineRoads.filter(road =>
      road.road_name.toLowerCase().includes(q) ||
      road.road_id.toString().includes(q)
    )
  }, [offlineRoads, searchText])

  // Memoize timestamp so it doesn't change on every re-render
  const displayTimestamp = useMemo(
    () => new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'medium' }),
    // Re-calculate when data refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading]
  )

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 flex items-center justify-center h-64 text-[#E94C4C]">
        {error}
      </div>
    )
  }

  const totalPages = Math.ceil(filteredOfflineRoads.length / pageSize)

  return (
    <div className="mt-6 grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-4 items-start">
      {/* Left Column: Solution Overview + งานในค้ำ + งานหมดค้ำ */}
      <div className="flex flex-col gap-4">
        {/* Solution Overview */}
        <div className="rounded-2xl bg-[#191919] p-3 sm:p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <img src="/atlas/images/Maintenance/icsolu.png" alt="solution" width={30} height={30} className="w-6 h-6 sm:w-7.5 sm:h-7.5" />
            <h2 className="text-xl sm:text-[32px] font-bold text-[#FCD116]">Solution Overview</h2>
          </div>
          <p className="font-normal text-[#979797] mt-1 hidden sm:block" style={{ fontSize: 14 }}>ภาพรวมสถานะการทำงานของอุปกรณ์</p>
          <div className="mt-3 sm:mt-5 grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
            {summaryData.filter((item) => !HIDDEN_SOLUTION_TYPES.has(item.type)).map((item, idx) => {
              const color = getSolutionColor(item.type)
              const onlinePercent = uptimeData[item.type]?.percentage
              const hasUptime = typeof onlinePercent === 'number' && Number.isFinite(onlinePercent)
              const boundedPercent = hasUptime ? Math.min(100, Math.max(0, onlinePercent)) : 0
              const ringColor = hasUptime ? color : '#5B5B5B'
              return (
                <div key={`${item.solution_type_id}-${idx}`} className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
                    <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#333333" strokeWidth="13" />
                      <circle
                        cx="48" cy="48" r="40" fill="none"
                        stroke={ringColor}
                        strokeWidth="13"
                        strokeDasharray={`${(boundedPercent / 100) * 251.33} 251.33`}
                        strokeLinecap="butt"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm sm:text-base lg:text-lg font-bold leading-none" style={{ color: hasUptime ? color : '#979797' }}>
                        {hasUptime ? `${boundedPercent}%` : '—'}
                      </span>
                      <span className="text-[10px] sm:text-xs leading-none mt-0.5" style={{ color: hasUptime ? color : '#979797' }}>
                        {hasUptime ? 'Online' : 'ไม่มีข้อมูล'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm sm:text-xl lg:text-2xl font-bold text-center" style={{ color }}>{item.type}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* งานในค้ำ */}
        <div className="rounded-2xl bg-[#191919] p-3 sm:p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <img src="/atlas/images/Maintenance/ics2.png" alt="support" width={30} height={30} className="w-6 h-6 sm:w-7.5 sm:h-7.5" />
            <h2 className="text-lg sm:text-[32px] font-bold text-[#05F2DB]">งานในค้ำ</h2>
          </div>
          <p className="font-normal text-[#9E9CA8] mt-0.5 hidden sm:block" style={{ fontSize: 14 }}>{displayTimestamp}</p>
          <div className="mt-2 grid grid-cols-8 gap-1">
            {(inWarranty ? [
              { value: inWarranty.project_count.toLocaleString(), label: 'โครงการ', icon: '/atlas/images/Maintenance/icc1.png' },
              { value: inWarranty.location_count.toLocaleString(), label: 'จุดติดตั้ง', icon: '/atlas/images/Maintenance/icc2.png' },
              { value: inWarranty.device_count.toLocaleString(), label: 'อุปกรณ์', icon: '/atlas/images/Maintenance/icc3.png' },
              { value: inWarranty.online_count.toLocaleString(), label: 'ออนไลน์', icon: '/atlas/images/statistics/iconconnect.png', color: '#66AEFF' },
              { value: inWarranty.offline_count.toLocaleString(), label: 'ออฟไลน์', icon: '/atlas/images/statistics/iconnoconnect.png', color: '#E94C4C' },
              { value: inWarranty.open_case_count.toString(), label: 'เปิด Case', icon: '/atlas/images/Maintenance/icc6.png', color: '#FF9D00' },
              { value: inWarranty.in_progress_count.toString(), label: 'กำลังดำเนินการ', icon: '/atlas/images/Maintenance/icc7.png', color: '#B2FF00' },
              { value: inWarranty.closed_case_count.toString(), label: 'ปิด Case', icon: '/atlas/images/Maintenance/icc8.png', color: '#05F2DB' },
            ] : []).map((item, i) => (
              <div
                key={item.label}
                className={`text-center py-1 px-0.5 ${i < 7 ? 'border-r border-r-white/10' : ''}`}
              >
                <div className="text-sm sm:text-base lg:text-lg font-bold" style={{ color: item.color || '#FFFFFF' }}>{item.value}</div>
                <div className="flex flex-row items-center justify-center gap-1 mt-0.5">
                  <img src={item.icon} alt="" width={24} height={24} className="w-6 h-6 shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-normal text-[#979797] whitespace-nowrap">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* งานหมดค้ำ */}
        <div className="rounded-2xl bg-[#191919] p-3 sm:p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              aria-hidden
              className="inline-block w-6 h-6 sm:w-7.5 sm:h-7.5 shrink-0"
              style={{
                backgroundColor: '#979797',
                WebkitMaskImage: 'url(/atlas/images/Maintenance/ics2.png)',
                maskImage: 'url(/atlas/images/Maintenance/ics2.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
              }}
            />
            <h2 className="text-lg sm:text-[32px] font-bold text-[#979797]">งานหมดค้ำ</h2>
          </div>
          <p className="font-normal text-[#9E9CA8] mt-0.5 hidden sm:block" style={{ fontSize: 14 }}>{displayTimestamp}</p>
          <div className="mt-2 grid grid-cols-8 gap-1">
            {(outWarranty ? [
              { value: outWarranty.project_count.toLocaleString(), label: 'โครงการ', icon: '/atlas/images/Maintenance/icc1.png' },
              { value: outWarranty.location_count.toLocaleString(), label: 'จุดติดตั้ง', icon: '/atlas/images/Maintenance/icc2.png' },
              { value: outWarranty.device_count.toLocaleString(), label: 'อุปกรณ์', icon: '/atlas/images/Maintenance/icc3.png' },
              { value: outWarranty.online_count.toLocaleString(), label: 'ออนไลน์', icon: '/atlas/images/statistics/iconconnect.png', color: '#66AEFF' },
              { value: outWarranty.offline_count.toLocaleString(), label: 'ออฟไลน์', icon: '/atlas/images/statistics/iconnoconnect.png', color: '#E94C4C' },
              { value: outWarranty.open_case_count.toString(), label: 'เปิด Case', icon: '/atlas/images/Maintenance/icc6.png', color: '#FF9D00' },
              { value: outWarranty.in_progress_count.toString(), label: 'กำลังดำเนินการ', icon: '/atlas/images/Maintenance/icc7.png', color: '#B2FF00' },
              { value: outWarranty.closed_case_count.toString(), label: 'ปิด Case', icon: '/atlas/images/Maintenance/icc8.png', color: '#05F2DB' },
            ] : []).map((item, i) => (
              <div
                key={item.label}
                className={`text-center py-1 px-0.5 ${i < 7 ? 'border-r border-r-white/10' : ''}`}
              >
                <div className="text-sm sm:text-base lg:text-lg font-bold" style={{ color: item.color || '#FFFFFF' }}>{item.value}</div>
                <div className="flex flex-row items-center justify-center gap-1 mt-0.5">
                  <img src={item.icon} alt="" width={24} height={24} className="w-6 h-6 shrink-0" />
                  <span className="text-[10px] sm:text-sm font-normal text-[#979797] whitespace-nowrap">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: สายทางดับทุกจุดติดตั้ง */}
      <div className="rounded-2xl bg-[#191919] p-3 sm:p-5 xl:sticky xl:top-4">
        <div className="flex items-center gap-2 flex-wrap">
          <img src="/atlas/images/Maintenance/ics1.png" alt="line-down" width={30} height={30} className="w-6 h-6 sm:w-7.5 sm:h-7.5" />
          <h2 className="text-lg sm:text-[32px] font-bold text-[#E94C4C]">สายทางดับทุกจุดติดตั้ง</h2>
        </div>
        <p className="font-normal text-[#9E9CA8] mt-1" style={{ fontSize: 14 }}>รวมสายทางที่มีอุปกรณ์ดับทุกจุดติดตั้งล่าสุด</p>
        <div className="mt-3 sm:mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Input
            placeholder="ค้นหาสายทาง..."
            className="rounded-lg flex-1"
            prefix={<TbSearch style={{ color: '#FCD116' }} />}
            size="large"
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            styles={{
              input: { fontSize: 14, fontWeight: 400, color: '#FFFFFF' },
            }}
          />
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ height: 32, padding: '0 12px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            {filteredOfflineRoads.length} สายทาง
          </span>
          <style>{`
            .ant-input-wrapper .ant-input::placeholder,
            .ant-input::placeholder {
              color: #FCD116 !important;
              font-weight: 400;
              font-size: 14px;
            }
            .ant-input-wrapper,
            .ant-input-affix-wrapper {
              border-color: #FCD116 !important;
            }
            .ant-input-wrapper:hover,
            .ant-input-affix-wrapper:hover {
              border-color: #FCD116 !important;
            }
            .ant-input-wrapper:focus-within,
            .ant-input-affix-wrapper-focused {
              border-color: #FCD116 !important;
              box-shadow: 0 0 0 2px rgba(252, 209, 22, 0.1) !important;
            }
            .line-table .ant-table-tbody > tr > td {
              border-bottom: 1px solid #FCD116 !important;
            }
            .line-table .ant-table-tbody > tr:last-child > td {
              border-bottom: none !important;
            }
          `}</style>
        </div>
        <div className="mt-4 overflow-x-auto">
          <Table
            columns={LINE_COLUMNS}
            dataSource={filteredOfflineRoads.map((road, index) => ({
              key: index.toString(),
              // Confirmed via live API: some roads genuinely have
              // road_name: "" from the backend (same known gap fixed for
              // RepairRecordsSection's tree — see commit b8be95e).
              line: road.road_name || 'โปรดระบุชื่อสายทาง',
              installPoints: road.location_count,
              devices: road.device_count,
              offline: road.offline_count,
            })).slice((currentPage - 1) * pageSize, currentPage * pageSize)}
            pagination={false}
            size="small"
            rowKey="key"
            className="line-table min-w-100"
            scroll={{ x: true }}
          />
          {/* Custom Pagination */}
          <div className="flex items-center justify-center gap-1 mt-3 flex-wrap px-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-6 h-6 rounded bg-[#2A2A2A] text-[#FCD116] text-xs disabled:opacity-50 hover:bg-[#333] transition-colors"
            >
              <TbChevronLeft size={14} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex items-center justify-center w-6 h-6 rounded text-xs font-medium transition-colors ${currentPage === pageNum
                      ? 'bg-[#FCD116] text-[#191919]'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#333]'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="text-white/50 text-xs px-1">...</span>
            )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || filteredOfflineRoads.length === 0}
              className="flex items-center justify-center w-6 h-6 rounded bg-[#2A2A2A] text-[#FCD116] text-xs disabled:opacity-50 hover:bg-[#333] transition-colors"
            >
              <TbChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default React.memo(MaintenanceOverviewSection)
