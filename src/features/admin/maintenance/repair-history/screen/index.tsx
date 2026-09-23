"use client"
import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, ConfigProvider, Input, Result, Segmented, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbArrowBigLeftFilled, TbChevronLeft, TbChevronRight, TbPrinter, TbSearch } from 'react-icons/tb'
import { useMaintenanceSolution, useMaintenanceCases, useProjectBySolution } from '@/hooks/queries/maintenance'
import type { CaseHistoryItem } from '@/types/maintenance'
import useIsMobile from '@/utils/hooks/useIsMobile'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'
import { useAppDispatch } from '@/stores/hooks'
import { setProjectInfoModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { ProjectInfoModal } from '@/components/modal'
import ExportFileModal from '@/components/export/ExportFileModal'
import { caseStatusMeta } from '../../data/caseStatus'
import { isNewCase } from '../../data/recentCase'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** Header badge sizing — copied verbatim from the shared `DetailTitleSection`
 *  (components/section/DetailTitleSection.tsx) so this hand-rolled header
 *  matches every other detail page: 14px text, 2px/14px padding, 28px tall.
 *  Action buttons stay AntD `size='middle'` (32px) — that split is intentional. */
const BADGE_CLASS =
  'inline-flex items-center justify-center gap-1.5 py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border'

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id: string
}

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: 'เมื่อวาน', value: 'YESTERDAY' },
  { label: '7 วัน', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

interface ExportRow {
  caseNo: string
  deviceCount: number
  status: string
  reportedAt: string
  dueDate: string
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
    { header: 'Case No.', width: 20, widthPct: 20, value: (r) => r.caseNo },
    { header: 'จำนวนอุปกรณ์', width: 14, widthPct: 13, align: 'center', value: (r) => r.deviceCount },
    { header: 'สถานะการดำเนินการ', width: 20, widthPct: 19, align: 'center', value: (r) => r.status },
    { header: 'วันที่แจ้งซ่อม', width: 16, widthPct: 16, value: (r) => r.reportedAt },
    { header: 'วันที่ครบกำหนด', width: 16, widthPct: 16, value: (r) => r.dueDate },
    { header: 'วันที่ปิด Case', width: 16, widthPct: 16, value: (r) => r.closedAt },
  ]

const isWithinPeriod = (value: string | null | undefined, period: string): boolean => {
  if (period === 'ALL') return true
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
    case 'YESTERDAY':
      start = now.subtract(1, 'day').startOf('day')
      end = now.subtract(1, 'day').endOf('day')
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

  const [searchText, setSearchText] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('ALL')
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

  const loading = solutionQuery.isLoading || casesQuery.isLoading
  const hasError = solutionQuery.isError || casesQuery.isError
  const solutionData = solutionQuery.data ?? null
  // Fallback subtitle ("<project name> — <solution name>") reconstructed from
  // already-fetched data when the URL doesn't carry one — mirrors detail/screen.
  const routeSubtitle = subtitleParam || [projectQuery.data?.project_name, solutionData?.solution_name].filter(Boolean).join(' — ')
  const cases = useMemo(() => casesQuery.data ?? [], [casesQuery.data])

  // Derived from API
  const warranty = warrantyParam || (solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ')
  const onlineCount = solutionData?.online_count ?? 0
  const offlineCount = solutionData?.offline_count ?? 0

  const filteredCases = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return cases.filter((item) => {
      // 2026-09-11 redesign: the history lists EVERY case (open + closed,
      // per mock — "ยังไม่ดำเนินการ" rows appear alongside closed ones), so
      // the period applies to the report date rather than the close date.
      if (!isWithinPeriod(item.reported_at, selectedPeriod)) return false
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
    deviceCount: item.camera_count ?? 1,
    status: caseStatusMeta(item.status, item.closed_at).label,
    reportedAt: formatTableDate(item.reported_at),
    dueDate: formatTableDate(item.due_date),
    closedAt: formatTableDate(item.closed_at),
  })), [filteredCases])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, selectedPeriod])

  const handleBack = () => {
    // Drop `source` on the way back: once the user is on the device table, that
    // table is the trail head again (otherwise it leaks into anything opened
    // from there and misdirects the next back arrow).
    const params = new URLSearchParams(searchParams.toString())
    params.delete('source')
    const query = params.toString()
    router.push(`/admin/maintenance/detail/${id}${query ? `?${query}` : ''}`)
  }

  // Case No. → the case tracking page (mock: closed cases live here once the
  // detail table drops their number). context_id must equal the solution id so
  // the case page keeps this route context; source=repair_history routes its
  // back arrow to this page instead of the detail page.
  const goToCase = (caseNo: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('solution_id', id)
    params.set('context_id', id)
    params.set('source', 'repair_history')
    router.push(`/admin/maintenance/case/${caseNo}?${params.toString()}`)
  }

  const columns: ColumnsType<CaseHistoryItem> = [
    {
      title: 'Case No.',
      dataIndex: 'case_no',
      key: 'case_no',
      width: 200,
      onCell: () => ({ style: { paddingLeft: 20 } }),
      onHeaderCell: () => ({ style: { paddingLeft: 20 } }),
      // Yellow = the row's click target (the whole row navigates to the case
      // page — the old quick-info modal was removed 2026-09-11 since the case
      // page shows everything it did). A case nobody has filed anything
      // against yet carries a glowing "new" chip (user 2026-09-22).
      render: (caseNo: string, record: CaseHistoryItem) => (
        <span style={{ color: '#FCD116' }}>
          {caseNo}
          {isNewCase(record.status, record.reported_at) && (
            <span className='maintenance-new-badge'>new</span>
          )}
        </span>
      ),
    },
    {
      title: 'จำนวนอุปกรณ์',
      dataIndex: 'camera_count',
      key: 'device_count',
      width: 140,
      align: 'center',
      render: (count: number | undefined) => count ?? 1,
    },
    {
      title: 'สถานะการดำเนินการ',
      key: 'status',
      width: 190,
      align: 'center',
      render: (_v: unknown, record: CaseHistoryItem) => {
        const meta = caseStatusMeta(record.status, record.closed_at)
        return (
          <span
            className='inline-flex items-center px-3.5 py-0.5 rounded-full whitespace-nowrap'
            style={{ border: `1px solid ${meta.color}`, color: meta.color, fontSize: 12 }}
          >
            {meta.label}
          </span>
        )
      },
    },
    { title: 'วันที่แจ้งซ่อม', dataIndex: 'reported_at', key: 'reported_at', width: 150, render: formatTableDate },
    { title: 'วันที่ครบกำหนด', dataIndex: 'due_date', key: 'due_date', width: 150, render: formatTableDate },
    { title: 'วันที่ปิด Case', dataIndex: 'closed_at', key: 'closed_at', width: 150, render: formatTableDate },
    // Columns hidden per the 2026-09-11 redesign — kept for a possible revert:
    // { title: 'จำนวนครั้งซ่อมแซม', dataIndex: 'camera_ip', key: 'repair_count', width: 150, align: 'center', render: (ip: string) => repairCountByIp[ip] ?? 1 },
    // { title: 'ประเภท', dataIndex: 'camera_ip', key: 'category', width: 140, render: (ip: string) => cameraInfoByIp[ip]?.category || '-' },
    // { title: 'Hostname', dataIndex: 'camera_ip', key: 'hostname', width: 160, render: (ip: string) => cameraInfoByIp[ip]?.hostname || '-' },
    // { title: 'IP Address', dataIndex: 'camera_ip', key: 'camera_ip', width: 140 },
    // { title: 'หมวดหมู่ของปัญหาที่พบ', dataIndex: 'problem', key: 'problem', width: 200 },
    // { title: 'หน่วยงานรับผิดชอบ', dataIndex: 'responsible', key: 'responsible', width: 250 },
    // { title: 'วันที่ตรวจสอบ', dataIndex: 'inspection_date', key: 'inspection_date', width: 140, render: formatTableDate },
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
      {/* Outer padding / arrow size / row spacing mirror DetailTitleSection
          (`px-8`, `fs-24` arrow at `mt-2`, no extra top padding) so this header
          lines up with every other detail page. Mobile keeps its tighter px-4. */}
      <div className='px-4 sm:px-8'>
        <section className='flex items-start gap-3'>
          <TbArrowBigLeftFilled
            className='fs-24 cursor-pointer mt-2 shrink-0'
            style={{ color: '#FCD116' }}
            onClick={handleBack}
          />
          <div>
            <h1 className='text-[20px] sm:text-[24px] font-bold' style={{ color: '#FCD116' }}>
              ประวัติการซ่อม
            </h1>
            <div className='flex flex-wrap items-center gap-2'>
              {/* No font-size class — matches DetailTitleSection's plain
                  `<p>{installPoint}</p>` (16px); `fs-12` pinned it to 14px. */}
              {(routeSubtitle || solutionData?.solution_name) && (
                <p className='font-normal' style={{ color: '#FFFFFF' }}>
                  {routeSubtitle || solutionData?.solution_name}
                </p>
              )}
              <span
                className={BADGE_CLASS}
                style={{ borderColor: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797', color: warranty === 'ในค้ำ' ? '#05F2DB' : '#979797' }}
              >
                {warranty}
              </span>
              <span
                className={BADGE_CLASS}
                style={{ borderColor: '#66AEFF', color: '#66AEFF', minWidth: 60 }}
              >
                <img src={`${BASE_PATH}/images/Maintenance/icrpblue.png`} alt='' width={14} height={14} />
                {onlineCount}
              </span>
              <span
                className={BADGE_CLASS}
                style={{ borderColor: '#E94C4C', color: '#E94C4C', minWidth: 60 }}
              >
                <img src={`${BASE_PATH}/images/Maintenance/icrpred.png`} alt='' width={14} height={14} />
                {offlineCount}
              </span>
              <img
                src={`${BASE_PATH}/images/statistics/icbt.png`}
                alt='ดูข้อมูลโครงการ'
                title='ดูข้อมูลโครงการ'
                width={24}
                height={24}
                className='shrink-0'
                onClick={() => projectId !== undefined && dispatch(setProjectInfoModalOpen({
                  open: true,
                  project_id: projectId,
                  road_id: roadId ?? null,
                }))}
                style={{ cursor: projectId !== undefined ? 'pointer' : 'default', opacity: projectId !== undefined ? 1 : 0.5 }}
              />
              {/* AntD Button (32px) — the action buttons are deliberately taller
                  than the 28px pills, same as DetailTitleSection. */}
              <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
                <Button
                  type='primary'
                  size='middle'
                  shape='round'
                  icon={<TbPrinter />}
                  onClick={() => setExportOpen(true)}
                >
                  <p className='fs-12'>นำออกเอกสาร</p>
                </Button>
              </ConfigProvider>
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
            onClick: () => goToCase(record.case_no),
            style: { cursor: 'pointer' },
          })}
        />
        {/* Custom Pagination */}
        <div className='flex items-center justify-center gap-1 mt-3 flex-wrap px-1'>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className='flex items-center justify-center w-6 h-6 rounded bg-[#2A2A2A] text-[#FCD116] fs-12 disabled:opacity-50 hover:bg-[#333] transition-colors'
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
                className={`flex items-center justify-center w-6 h-6 rounded fs-12 font-medium transition-colors ${currentPage === pageNum
                  ? 'bg-[#FCD116] text-[#191919]'
                  : 'bg-[#2A2A2A] text-white hover:bg-[#333]'
                  }`}
              >
                {pageNum}
              </button>
            )
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className='text-white/50 fs-12 px-1'>...</span>
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || filteredCases.length === 0}
            className='flex items-center justify-center w-6 h-6 rounded bg-[#2A2A2A] text-[#FCD116] fs-12 disabled:opacity-50 hover:bg-[#333] transition-colors'
          >
            <TbChevronRight size={14} />
          </button>
        </div>
      </section>

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
