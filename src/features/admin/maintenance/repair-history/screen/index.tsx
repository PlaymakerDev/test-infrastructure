"use client"
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Image, Input, Result, Segmented, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbArrowBigLeftFilled, TbChevronLeft, TbChevronRight, TbFileText, TbPrinter, TbSearch, TbX } from 'react-icons/tb'
import { useMaintenanceSolution, useMaintenanceCases, useMaintenanceHistory, useMaintenanceCase, useProjectBySolution } from '@/hooks/queries/maintenance'
import { useProjectByCaseNo } from '@/hooks/queries/manage'
import type { CameraItem, CaseHistoryItem, HistoryCase } from '@/types/maintenance'
import { parseImageUrls } from '../../data/parseImageUrls'
import useIsMobile from '@/utils/hooks/useIsMobile'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { ProjectInfoModal } from '@/components/modal'
import ExportFileModal from '@/components/export/ExportFileModal'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id: string
}

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
]

interface ExportRow {
  caseNo: string
  repairCount: number
  category: string
  hostname: string
  ip: string
  problem: string
  responsible: string
  reportedAt: string
  inspectionDate: string
  closedAt: string
}

// Shared column config for both PDF and Excel exports — same columns/order as
// the on-screen table (text-only twin of the case_no/date-formatted cells).
const EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (r: ExportRow) => string | number
}[] = [
  { header: 'Case No.', width: 18, widthPct: 13, value: (r) => r.caseNo },
  { header: 'จำนวนครั้งซ่อมแซม', width: 14, widthPct: 9, align: 'center', value: (r) => r.repairCount },
  { header: 'ประเภท', width: 12, widthPct: 8, value: (r) => r.category },
  { header: 'Hostname', width: 16, widthPct: 10, value: (r) => r.hostname },
  { header: 'IP Address', width: 14, widthPct: 9, value: (r) => r.ip },
  { header: 'หมวดหมู่ของปัญหาที่พบ', width: 20, widthPct: 13, align: 'left', value: (r) => r.problem },
  { header: 'หน่วยงานรับผิดชอบ', width: 20, widthPct: 13, align: 'left', value: (r) => r.responsible },
  { header: 'วันที่แจ้งซ่อม', width: 14, widthPct: 9, value: (r) => r.reportedAt },
  { header: 'วันที่ตรวจสอบ', width: 14, widthPct: 9, value: (r) => r.inspectionDate },
  { header: 'วันที่ปิด Case', width: 14, widthPct: 7, value: (r) => r.closedAt },
]

const isWithinPeriod = (value: string | null | undefined, period: string): boolean => {
  if (!value) return false
  const date = dayjs(value)
  if (!date.isValid()) return false

  const now = dayjs()
  let start: dayjs.Dayjs
  let end: dayjs.Dayjs
  switch (period) {
    case 'TODAY':
      start = now.startOf('day')
      end = now.endOf('day')
      break
    case 'LAST_7_DAYS':
      start = now.subtract(6, 'day').startOf('day')
      end = now.endOf('day')
      break
    case 'THIS_YEAR':
      start = now.startOf('year')
      end = now.endOf('year')
      break
    case 'LAST_YEAR':
      start = now.subtract(1, 'year').startOf('year')
      end = now.subtract(1, 'year').endOf('year')
      break
    case 'THIS_MONTH':
    default:
      start = now.startOf('month')
      end = now.endOf('month')
      break
  }

  return !date.isBefore(start) && !date.isAfter(end)
}

const formatTableDate = (value: string | null | undefined): string => {
  if (!value) return '-'
  const date = dayjs(value)
  return date.isValid() ? date.format('DD MMM BBBB') : '-'
}

const RepairHistoryContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const isMobile = useIsMobile()
  const warrantyParam = searchParams.get('warranty') || ''
  const contextId = Number(searchParams.get('context_id'))
  const subtitleParam = Number.isFinite(contextId) && contextId === Number(id)
    ? searchParams.get('subtitle') || ''
    : ''
  const roadIdParam = Number(searchParams.get('road_id'))
  const roadId = Number.isFinite(roadIdParam) && roadIdParam >= 0 ? roadIdParam : undefined

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<CaseHistoryItem | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('TODAY')
  const [currentPage, setCurrentPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)
  const pageSize = 10

  const numericId = Number(id)
  const solutionQuery = useMaintenanceSolution(numericId)
  // Resolves the owning project id/road id so the ⓘ ProjectInfoModal opens
  // even on a direct visit with no route context — mirrors the detail page.
  const projectQuery = useProjectBySolution(numericId)
  const projectId = projectQuery.data?.id
  const casesQuery = useMaintenanceCases(numericId)
  const historyQuery = useMaintenanceHistory({ status: 'all' })
  // "ข้อมูลโครงการ" card in the case modal — only fetches once a row is
  // selected (case_no known); GET /manage/project/case/{case_no}.
  const projectByCaseQuery = useProjectByCaseNo(selectedRecord?.case_no)
  // "การดำเนินการหรือวิธีการแก้ไข" + "รายละเอียดรูปแบบไฟล์" (ก่อนซ่อม/หลังซ่อม)
  // in the same modal — GET /manage/maintenance/case/{case_no}.
  const caseDetailQuery = useMaintenanceCase(selectedRecord?.case_no)

  // Solution + cases are the core route data. The global history request only
  // enriches fields inside the record modal, so it must never hold the table in
  // a loading/error state when the core endpoints are healthy.
  const loading = solutionQuery.isLoading || casesQuery.isLoading
  const hasError = solutionQuery.isError || casesQuery.isError
  const solutionData = solutionQuery.data ?? null
  // Fallback subtitle ("<project name> — <solution name>") reconstructed from
  // already-fetched data when the URL doesn't carry one — mirrors detail/screen.
  const routeSubtitle = subtitleParam || [projectQuery.data?.project_name, solutionData?.solution_name].filter(Boolean).join(' — ')
  const cases = useMemo(() => casesQuery.data ?? [], [casesQuery.data])
  // case_no → HistoryCase lookup (history API has device/project fields the cases API lacks)
  const historyMap = useMemo(() => {
    const map: Record<string, HistoryCase> = {}
      ; (historyQuery.data ?? []).forEach((region) => {
        region.cases.forEach((c) => { map[c.case_no] = c })
      })
    return map
  }, [historyQuery.data])
  // camera_ip → CameraItem lookup — solution's device list carries ประเภท/Hostname,
  // fields the cases API itself doesn't return.
  const cameraInfoByIp = useMemo(() => {
    const map: Record<string, CameraItem> = {}
      ; (solutionData?.lists ?? []).forEach((item) => { map[item.camera_ip] = item })
    return map
  }, [solutionData])
  // camera_ip → total case count across this solution's full (unfiltered) history —
  // จำนวนครั้งซ่อมแซม is a per-device lifetime tally, not scoped to the active period/search filter.
  const repairCountByIp = useMemo(() => {
    const map: Record<string, number> = {}
      ; cases.forEach((item) => { map[item.camera_ip] = (map[item.camera_ip] ?? 0) + 1 })
    return map
  }, [cases])

  // Derived from API
  const warranty = warrantyParam || (solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ')
  const onlineCount = solutionData?.online_count ?? 0
  const offlineCount = solutionData?.offline_count ?? 0
  // HistoryCase for the selected record (carries device/project fields the cases API lacks)
  const historyCase = selectedRecord ? historyMap[selectedRecord.case_no] : undefined
  const agencyText = historyCase?.department_name || selectedRecord?.responsible || '-'
  const deviceTypeText = historyCase?.solution_type || '-'
  const installPointText = historyCase ? [historyCase.location_name, historyCase.road_name].filter(Boolean).join(' - ') || '-' : '-'
  const offlineSinceText = selectedRecord?.reported_at ? dayjs(selectedRecord.reported_at).format('DD MMM BBBB') : '-'
  const offlineDaysText = historyCase?.offline_days ? `${historyCase.offline_days} วัน` : '-'
  // ข้อมูลโครงการ card — from GET /manage/project/case/{case_no}
  const projectByCase = projectByCaseQuery.data
  const contractorText = projectByCase?.contractor?.username || '-'
  const contractNoText = projectByCase?.contract_no || '-'
  const warrantyStartText = projectByCase?.warranty_start_date ? dayjs(projectByCase.warranty_start_date).format('DD MMM BBBB') : '-'
  const warrantyEndText = projectByCase?.warranty_end_date ? dayjs(projectByCase.warranty_end_date).format('DD MMM BBBB') : '-'
  // การดำเนินการหรือวิธีการแก้ไข + รายละเอียดรูปแบบไฟล์ — from GET /manage/maintenance/case/{case_no}
  const solutionMethodText = caseDetailQuery.data?.solution_method || '-'
  const beforeImageUrls = useMemo(() => parseImageUrls(caseDetailQuery.data?.before_image), [caseDetailQuery.data?.before_image])
  const afterImageUrls = useMemo(() => parseImageUrls(caseDetailQuery.data?.after_image), [caseDetailQuery.data?.after_image])

  const filteredCases = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return cases.filter((item) => {
      // The segmented control is explicitly labelled "ปิด Case สำเร็จ", so
      // its period applies to the close timestamp (open cases do not belong in
      // a successful-close history window).
      if (!isWithinPeriod(item.closed_at, selectedPeriod)) return false
      if (!query) return true
      return [item.case_no, item.camera_name, item.camera_ip, item.problem, item.responsible]
        .some((value) => value?.toLowerCase().includes(query))
    })
  }, [cases, searchText, selectedPeriod])

  const totalPages = Math.ceil(filteredCases.length / pageSize)

  // นำออกเอกสาร — mirrors the currently-filtered (search + period) table rows,
  // not just the current page, per the app's export convention.
  const exportRows: ExportRow[] = useMemo(() => filteredCases.map((item) => ({
    caseNo: item.case_no,
    repairCount: repairCountByIp[item.camera_ip] ?? 1,
    category: cameraInfoByIp[item.camera_ip]?.category || '-',
    hostname: cameraInfoByIp[item.camera_ip]?.hostname || '-',
    ip: item.camera_ip,
    problem: item.problem || '-',
    responsible: item.responsible || '-',
    reportedAt: formatTableDate(item.reported_at),
    inspectionDate: formatTableDate(item.inspection_date),
    closedAt: formatTableDate(item.closed_at),
  })), [filteredCases, repairCountByIp, cameraInfoByIp])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, selectedPeriod])

  const handleBack = () => {
    const query = searchParams.toString()
    router.push(`/admin/maintenance/detail/${id}${query ? `?${query}` : ''}`)
  }

  const columns: ColumnsType<CaseHistoryItem> = [
    { title: 'Case No.', dataIndex: 'case_no', key: 'case_no', width: 180, onCell: () => ({ style: { paddingLeft: 20 } }), onHeaderCell: () => ({ style: { paddingLeft: 20 } }) },
    { title: 'จำนวนครั้งซ่อมแซม', dataIndex: 'camera_ip', key: 'repair_count', width: 150, align: 'center', render: (ip: string) => repairCountByIp[ip] ?? 1 },
    { title: 'ประเภท', dataIndex: 'camera_ip', key: 'category', width: 140, render: (ip: string) => cameraInfoByIp[ip]?.category || '-' },
    { title: 'Hostname', dataIndex: 'camera_ip', key: 'hostname', width: 160, render: (ip: string) => cameraInfoByIp[ip]?.hostname || '-' },
    { title: 'IP Address', dataIndex: 'camera_ip', key: 'camera_ip', width: 140 },
    { title: 'หมวดหมู่ของปัญหาที่พบ', dataIndex: 'problem', key: 'problem', width: 200 },
    { title: 'หน่วยงานรับผิดชอบ', dataIndex: 'responsible', key: 'responsible', width: 250 },
    { title: 'วันที่แจ้งซ่อม', dataIndex: 'reported_at', key: 'reported_at', width: 140, render: formatTableDate },
    { title: 'วันที่ตรวจสอบ', dataIndex: 'inspection_date', key: 'inspection_date', width: 140, render: formatTableDate },
    { title: 'วันที่ปิด Case', dataIndex: 'closed_at', key: 'closed_at', width: 140, render: formatTableDate },
  ]

  if (loading) {
    return (
      <div className='main-screen flex items-center justify-center h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className='main-screen flex items-center justify-center min-h-64'>
        <Result
          status='error'
          title='ไม่สามารถโหลดประวัติการซ่อมได้'
          subTitle='กรุณาลองใหม่อีกครั้ง'
          extra={(
            <Button
              type='primary'
              onClick={() => {
                if (solutionQuery.isError) void solutionQuery.refetch()
                if (casesQuery.isError) void casesQuery.refetch()
              }}
            >
              ลองอีกครั้ง
            </Button>
          )}
        />
      </div>
    )
  }

  return (
    <div className='main-screen maintenance-font-min-14'>
      <MaintenanceMinimumFontSize />
      <div className='px-4 sm:px-10 pt-3'>
        <section className='flex items-start gap-3'>
          <TbArrowBigLeftFilled
            className='text-[24px] cursor-pointer mt-1.5 shrink-0'
            style={{ color: '#FCD116' }}
            onClick={handleBack}
          />
          <div>
            <h1 className='text-[20px] sm:text-[24px] font-bold' style={{ color: '#FCD116' }}>
              ประวัติการซ่อม
            </h1>
            <div className='flex items-center gap-2 mt-2 flex-wrap'>
              {(routeSubtitle || solutionData?.solution_name) && (
                <p className='text-[13px] sm:text-[14px] font-normal' style={{ color: '#FFFFFF' }}>
                  {routeSubtitle || solutionData?.solution_name}
                </p>
              )}
              <span
                className='inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
                style={{ border: `1px solid ${warranty === 'ในค้ำ' ? '#05F2DB' : '#979797'}`, color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797' }}
              >
                {warranty}
              </span>
              <span
                className='inline-flex items-center gap-1.5 text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #66AEFF', color: '#66AEFF', minWidth: 60, textAlign: 'center' }}
              >
                <img src={`${BASE_PATH}/images/Maintenance/icrpblue.png`} alt='' width={13} height={13} />
                <span style={{ marginTop: 2 }}>{onlineCount}</span>
              </span>
              <span
                className='inline-flex items-center gap-1.5 text-[12px] sm:text-[14px] font-normal whitespace-nowrap'
                style={{ padding: '2px 12px', borderRadius: 9999, border: '1px solid #E94C4C', color: '#E94C4C', minWidth: 60, textAlign: 'center' }}
              >
                <img src={`${BASE_PATH}/images/Maintenance/icrpred.png`} alt='' width={13} height={13} />
                <span style={{ marginTop: 2 }}>{offlineCount}</span>
              </span>
              <img
                src={`${BASE_PATH}/images/statistics/icbt.png`}
                alt='ดูข้อมูลโครงการ'
                title='ดูข้อมูลโครงการ'
                width={26}
                height={26}
                className='shrink-0'
                onClick={() => projectId !== undefined && dispatch(setProjectInfoModalOpen({
                  open: true,
                  project_id: projectId,
                  road_id: roadId ?? null,
                }))}
                style={{ cursor: projectId !== undefined ? 'pointer' : 'default', opacity: projectId !== undefined ? 1 : 0.5 }}
              />
              <button
                className='inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[12px] sm:text-[14px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
                style={{ background: '#66AEFF', color: '#0A0A0A' }}
                type='button'
                onClick={() => setExportOpen(true)}
              >
                <TbPrinter size={14} />
                นำออกเอกสาร
              </button>
            </div>
          </div>
        </section>
      </div>
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={exportRows.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Maintenance_Repair_History',
            title: `รายงานประวัติการซ่อม - ${routeSubtitle || solutionData?.solution_name || id}`,
            columns: EXPORT_COLUMNS,
            rows: exportRows,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Maintenance_Repair_History',
            sheetName: 'RepairHistory',
            title: `รายงานประวัติการซ่อม - ${routeSubtitle || solutionData?.solution_name || id}`,
            columns: EXPORT_COLUMNS,
            rows: exportRows,
          })
        }}
      />
      <section className='mt-5 px-4 sm:px-10'>
        <div className='flex flex-col sm:flex-row sm:items-end gap-3 mb-4'>
          <div className='w-full sm:w-auto'>
            <p className='text-[16px] font-normal mb-1' style={{ color: '#FCD116' }}>ค้นหา</p>
            <Input
              placeholder='ค้นหา Case No. หรือชื่ออุปกรณ์...'
              suffix={<TbSearch size={18} color='#FCD116' />}
              size='middle'
              style={{ width: isMobile ? '100%' : 360, height: 40, borderRadius: 10 }}
              allowClear
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
          <div>
            <p className='text-[16px] font-normal mb-1' style={{ color: '#FCD116' }}>ปิด Case สำเร็จ</p>
            <div className='overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              <Segmented
                options={PERIOD_OPTIONS}
                value={selectedPeriod}
                onChange={(value) => setSelectedPeriod(String(value))}
                size={isMobile ? 'middle' : 'large'}
                classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
              />
            </div>
          </div>
        </div>
        <Table
          className='bridge-projects-table'
          columns={columns}
          dataSource={filteredCases.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          rowKey='case_no'
          pagination={false}
          locale={{ emptyText: 'ไม่พบข้อมูลในช่วงเวลาที่เลือก' }}
          scroll={{ x: 'max-content' }}
          size='middle'
          onRow={(record) => ({
            onClick: () => {
              setSelectedRecord(record)
              setIsModalOpen(true)
            },
            style: { cursor: 'pointer' },
          })}
        />
        {/* Custom Pagination */}
        <div className='flex items-center justify-center gap-1 mt-3 flex-wrap px-1'>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className='flex items-center justify-center w-6 h-6 rounded bg-[#2A2A2A] text-[#FCD116] text-xs disabled:opacity-50 hover:bg-[#333] transition-colors'
          >
            <TbChevronLeft size={14} />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + i
              if (pageNum > totalPages) pageNum = totalPages - (4 - i)
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
            )
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className='text-white/50 text-xs px-1'>...</span>
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || filteredCases.length === 0}
            className='flex items-center justify-center w-6 h-6 rounded bg-[#2A2A2A] text-[#FCD116] text-xs disabled:opacity-50 hover:bg-[#333] transition-colors'
          >
            <TbChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && selectedRecord && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1 }} />
          <div
            style={{
              position: 'relative', zIndex: 2,
              width: 'calc(100% - 32px)', maxWidth: 1630, minHeight: 400, maxHeight: '90vh',
              borderRadius: 20, backgroundColor: '#333333', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              padding: '24px 32px', display: 'flex', flexDirection: 'column', overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 400, margin: 0 }}>
                <span style={{ color: '#FCD116' }}>Case No.</span>
                <span style={{ color: '#FFFFFF', marginLeft: 8 }}>{selectedRecord.case_no}</span>
              </p>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <TbX size={20} color='#66AEFF' />
              </button>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(historyQuery.isLoading || projectByCaseQuery.isLoading || caseDetailQuery.isLoading) && (
                <div className='flex items-center gap-2 rounded-xl px-4 py-3' style={{ backgroundColor: '#66AEFF1A', color: '#B2D6F0' }}>
                  <Spin size='small' />
                  <span>กำลังโหลดข้อมูลประกอบเพิ่มเติม...</span>
                </div>
              )}
              {(historyQuery.isError || projectByCaseQuery.isError || caseDetailQuery.isError) && (
                <div
                  role='alert'
                  className='flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3'
                  style={{ backgroundColor: '#E94C4C1A', border: '1px solid #E94C4C', color: '#E94C4C' }}
                >
                  <span>ไม่สามารถโหลดข้อมูลประกอบบางส่วนได้ ข้อมูลหลักของ Case ยังใช้งานได้</span>
                  <Button size='small' danger onClick={() => { void historyQuery.refetch(); void projectByCaseQuery.refetch(); void caseDetailQuery.refetch() }}>
                    ลองอีกครั้ง
                  </Button>
                </div>
              )}
              {/* Row: ข้อมูลโครงการ + ข้อมูลอุปกรณ์ */}
              <div className='flex flex-col lg:flex-row gap-4'>
                {/* Card: ข้อมูลโครงการ */}
                <div className='flex-1 lg:flex-[55] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: '0 0 4px 0' }}>ข้อมูลโครงการ</p>
                  <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '0 0 16px 0' }}>
                    {routeSubtitle || solutionData?.solution_name || '-'}
                  </p>
                  <div className='grid grid-cols-3 lg:grid-cols-6 gap-4'>
                    {([
                      { label: 'ผู้รับจ้าง', value: contractorText, icon: 'icsc1.png' },
                      { label: 'หน่วยงานรับผิดชอบ', value: agencyText, icon: 'icsc2.png' },
                      { label: 'เลขที่สัญญา', value: contractNoText, icon: 'icsc3.png' },
                      { label: 'เริ่มต้นการรับประกัน', value: warrantyStartText, icon: 'icsc4-5.png' },
                      { label: 'สิ้นสุดการรับประกัน', value: warrantyEndText, icon: 'icsc4-5.png' },
                      { label: 'สถานะค้ำประกัน', value: solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ', icon: 'icsc6.png' },
                    ] as { label: string; value: string; icon: string }[]).map(({ label, value, icon }) => (
                      <div key={label} className='flex flex-col items-center'>
                        <img src={`${BASE_PATH}/images/Maintenance/${icon}`} alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                        <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>{label}</p>
                        <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card: ข้อมูลอุปกรณ์ */}
                <div className='flex-1 lg:flex-[45] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#66AEFF', fontWeight: 400, fontSize: 16, margin: '0 0 4px 0' }}>ข้อมูลอุปกรณ์</p>
                  <p style={{ color: '#B2D6F0', fontWeight: 400, fontSize: 12, margin: '0 0 16px 0' }}>
                    {selectedRecord.camera_name || '-'}
                  </p>
                  <div className='flex flex-wrap justify-between gap-4'>
                    {([
                      { label: 'ประเภทอุปกรณ์', value: deviceTypeText, icon: 'icsc2.1.png' },
                      { label: 'จุดติดตั้ง / สายทาง', value: installPointText, icon: 'icsc2.2.png' },
                      { label: 'IP Address', value: selectedRecord.camera_ip || '-', icon: 'icsc3.png' },
                      { label: 'วันที่เร่มออฟไลน์', value: offlineSinceText, icon: 'icsc4-5.png' },
                      { label: 'จำนวนวันออฟไลน์', value: offlineDaysText, icon: 'icsc6.png' },
                    ] as { label: string; value: string; icon: string }[]).map(({ label, value, icon }) => (
                      <div key={label} className='flex flex-col items-center' style={{ flex: '1 1 0', minWidth: 90 }}>
                        <img src={`${BASE_PATH}/images/Maintenance/${icon}`} alt='' width={30} height={30} style={{ marginBottom: 8 }} />
                        <p style={{ color: '#979797', fontWeight: 400, fontSize: 14, margin: 0, textAlign: 'center' }}>{label}</p>
                        <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 14, margin: '4px 0 0 0', textAlign: 'center' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 1 */}
              <div className='flex flex-col lg:flex-row gap-4'>
                <div className='flex-1 lg:flex-[55] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 12px 0' }}>ข้อมูลการแจ้งซ่อม</p>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หมวดหมู่ของปัญหาที่พบ</p>
                      <Input value={historyCase?.category || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>หน่วยงานรับผิดชอบหรือมอบหมาย</p>
                      <Input value={agencyText} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                  </div>
                  <div className='mt-3'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>ปัญหาที่พบ</p>
                    <Input.TextArea value={selectedRecord.problem || '-'} readOnly autoSize={{ minRows: 2, maxRows: 4 }} style={{ width: '100%', borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF', resize: 'none' }} />
                  </div>
                  <div className='mt-3'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>การดำเนินการหรือวิธีการแก้ไข</p>
                    <Input.TextArea value={solutionMethodText} readOnly autoSize={{ minRows: 2, maxRows: 4 }} style={{ width: '100%', borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF', resize: 'none' }} />
                  </div>
                  <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '16px 0 6px 0' }}>ระยะเวลา</p>
                  <div className='flex flex-col sm:flex-row gap-4'>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่แจ้งซ่อม</p>
                      <Input value={selectedRecord.reported_at || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ตรวจสอบ</p>
                      <Input value={selectedRecord.inspection_date || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                    <div className='flex-1'>
                      <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 6px 0' }}>วันที่ปิด Case</p>
                      <Input value={selectedRecord.closed_at || '-'} readOnly style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: '#191919', border: '1px solid #FCD116', color: '#FFFFFF' }} />
                    </div>
                  </div>
                </div>
                <div className='flex-1 lg:flex-[45] rounded-xl p-5' style={{ backgroundColor: '#191919' }}>
                  <p style={{ color: '#FFFFFF', fontWeight: 400, fontSize: 16, margin: '0 0 16px 0' }}>รายละเอียดรูปแบบไฟล์</p>
                  <div className='mb-4'>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 8px 0' }}>ก่อนซ่อม</p>
                    <div className='flex gap-2 flex-wrap'>
                      {beforeImageUrls.length > 0 ? beforeImageUrls.map((url) => (
                        <Image key={url} src={url} alt='ก่อนซ่อม' width={160} height={160} style={{ objectFit: 'cover', borderRadius: 8 }} />
                      )) : (
                        <div style={{ width: 160, height: 160, borderRadius: 8, backgroundColor: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TbFileText size={40} color='#555' />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#FCD116', fontWeight: 400, fontSize: 16, margin: '0 0 8px 0' }}>หลังซ่อม</p>
                    <div className='flex gap-2 flex-wrap'>
                      {afterImageUrls.length > 0 ? afterImageUrls.map((url) => (
                        <Image key={url} src={url} alt='หลังซ่อม' width={160} height={160} style={{ objectFit: 'cover', borderRadius: 8 }} />
                      )) : (
                        <div style={{ width: 160, height: 160, borderRadius: 8, backgroundColor: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TbFileText size={40} color='#555' />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ProjectInfoModal />
    </div>
  )
}

const RepairHistoryScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><Spin size='large' /></div>}>
      <RepairHistoryContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(RepairHistoryScreen)
