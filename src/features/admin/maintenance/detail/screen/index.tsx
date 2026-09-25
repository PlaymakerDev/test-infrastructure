"use client"
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { App, ConfigProvider, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff } from 'react-icons/tb'
import dayjs from 'dayjs'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import 'dayjs/locale/th'
import { TitleSection } from '../components'
import {
  useMaintenanceSolution,
  useProjectBySolution,
  useSolutionMapLocation,
} from '@/hooks/queries/maintenance'
import { useContactDetail } from '@/hooks/queries/shared/useContactDetail'
import { ProjectInfoModal } from '@/components/modal'
import ExportFileModal from '@/components/export/ExportFileModal'
import type { CameraItem, SolutionDetailResponse } from '@/types/maintenance'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'
import OpenCaseModal from '../components/OpenCaseModal'
import { parseDeviceTypes } from '../../data/deviceTypes'
import { useUserKind } from '@/utils/hooks/useUserKind'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

dayjs.extend(buddhistEra)
dayjs.locale('th')

interface Props {
  id: string
}

interface TableRow {
  types: { label: string; color: string }[]
  key: string
  status: 'online' | 'offline'
  cameraName: string
  ipAddress: string
  caseNo: string | null
  cameraId: string
  category: string
  brand: string
  model: string
  hostname: string
  anydesk: string
  zerotier: string
  username: string
  password: string
}

const SOLUTION_PREFIXES = new Set([
  'cctv',
  'counting',
  'analytic',
  'traffic',
  'crosswalk',
  'vms',
  'lighting',
  'tunnel',
  'wim',
])

// Shared column config for both PDF and Excel exports — same columns/order as
// the on-screen device table (text-only twins of the badge/link cells).
// `width` = Excel chars, `widthPct` = PDF percent (sums 100).
const DEVICE_EXPORT_COLUMNS: {
  header: string
  width: number
  widthPct: number
  align?: 'left' | 'center' | 'right'
  value: (r: TableRow) => string | number
}[] = [
    { header: 'สถานะ', width: 12, widthPct: 10, value: (r) => (r.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์') },
    { header: 'Case No.', width: 18, widthPct: 13, value: (r) => r.caseNo || '-' },
    // ประเภท mirrors the on-screen badges (labels joined).
    { header: 'ประเภท', width: 20, widthPct: 14, value: (r) => (r.types.length ? r.types.map((t) => t.label).join(', ') : '-') },
    { header: 'ยี่ห้อ', width: 12, widthPct: 9, value: (r) => r.brand },
    { header: 'รุ่น', width: 12, widthPct: 9, value: (r) => r.model },
    { header: 'Hostname', width: 28, widthPct: 32, align: 'left', value: (r) => (r.hostname && r.hostname !== '-' ? r.hostname : r.cameraName || '-') },
    // Hidden with the on-screen columns (2026-09-10 redesign) — kept for a
    // possible future revision:
    // { header: 'ชื่ออุปกรณ์', value: (r) => r.cameraName },
    // { header: 'Anydesk', value: (r) => r.anydesk },
    // { header: 'ZeroTier', value: (r) => r.zerotier },
    // { header: 'Username', value: (r) => r.username },
    // { header: 'Password', value: (r) => r.password },
    // IP last — mirrors the on-screen column order (2026-08-17, app-wide rule).
    { header: 'IP Address', width: 16, widthPct: 13, value: (r) => r.ipAddress },
  ]

interface TitleSectionWithDataProps {
  /** อุปกรณ์ออฟไลน์ที่ยังไม่มีเคส — ขับสถานะปุ่ม "+ เปิด Case" บนหัว */
  openableCount: number
  /** Absent = hide the header เปิด Case button (contractor role). */
  onOpenCase?: () => void
  id: string
  data: SolutionDetailResponse | null
  coord: [number, number] | null
  resolvedProjectId?: number
  routeTitle?: string
  routeSubtitle?: string
  routeRoadId?: number
  onExport?: () => void
}

/** Route context is URL-scoped; a direct visit falls back to solution API data. */
const TitleSectionWithData: React.FC<TitleSectionWithDataProps> = ({
  openableCount,
  onOpenCase,
  id,
  data,
  coord,
  resolvedProjectId,
  routeTitle,
  routeSubtitle,
  routeRoadId,
  onExport,
}) => {
  const title = routeTitle || data?.solution_name || id
  const subtitle = routeSubtitle || ''
  const onlineCount = data?.online_count ?? 0
  const offlineCount = data?.offline_count ?? 0
  const warranty = data?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ'
  return (
    <TitleSection
      id={id}
      title={title}
      subtitle={subtitle}
      onlineCount={onlineCount}
      offlineCount={offlineCount}
      warranty={warranty}
      projectId={resolvedProjectId}
      roadId={routeRoadId}
      coord={coord}
      openableCount={openableCount}
      onOpenCase={onOpenCase}
      onExport={onExport}
    />
  )
}

const DetailContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { modal } = App.useApp()
  const { userKind } = useUserKind()
  // เปิด Case modal (2026-09-11 redesign) — one device-picker dialog shared by
  // the header button (no pre-tick) and the per-row buttons (pre-ticked).
  const [openCase, setOpenCase] = useState<{ open: boolean; preselectId: string | null }>({ open: false, preselectId: null })
  const [exportOpen, setExportOpen] = useState(false)
  const numericId = Number(id)

  // ผู้รับจ้างเปิดเคสไม่ได้ (user 2026-09-11) — ปุ่ม +เปิด Case ทั้งบนหัวและใน
  // ตารางซ่อนทั้งหมด เหลือลิงก์ Case No. เข้าไปกรอกบันทึกแจ้งซ่อมเท่านั้น.
  // มาจาก session (user_kind ตอน login); `?role=contractor` = override ให้
  // เจ้าหน้าที่ดูมุมมองผู้รับจ้างได้ (mirror case/screen/index.tsx).
  const isContractor = searchParams.get('role') === 'contractor' || userKind === 'contractor'

  // The URL is the source of truth for optional navigation context. Validate
  // the dynamic prefix before interpolating it into an API path; missing or
  // invalid/mismatched context simply disables the optional route metadata on
  // a direct deep link.
  const routeQuery = searchParams.toString()
  const routeContext = useMemo(() => {
    const params = new URLSearchParams(routeQuery)
    const contextId = Number(params.get('context_id'))
    if (!Number.isFinite(contextId) || contextId !== numericId) {
      return { map: null, roadId: undefined, title: undefined, subtitle: undefined }
    }
    const prefix = params.get('prefix')?.toLowerCase() ?? ''
    const departmentParam = params.get('dept_id')
    const roadParam = params.get('road_id')
    const departmentId = departmentParam === null ? Number.NaN : Number(departmentParam)
    const roadId = roadParam === null ? Number.NaN : Number(roadParam)
    return {
      map: SOLUTION_PREFIXES.has(prefix) && Number.isFinite(departmentId) && departmentId >= 0
        ? { prefix, departmentId }
        : null,
      roadId: Number.isFinite(roadId) && roadId >= 0 ? roadId : undefined,
      title: params.get('title') || undefined,
      subtitle: params.get('subtitle') || undefined,
    }
  }, [numericId, routeQuery])

  const solutionQuery = useMaintenanceSolution(numericId)
  const solutionData: SolutionDetailResponse | null = solutionQuery.data ?? null
  const loading = solutionQuery.isLoading
  const error = solutionQuery.isError ? 'ไม่สามารถโหลดข้อมูลได้' : null

  // Resolve the owning project from the solution_id (this route's `id`) so the
  // ⓘ "ดูข้อมูลโครงการ" modal opens even on a direct visit with no route context.
  // Also backs the "ยืนยันเปิด Case" confirm dialog's project-info box below.
  const projectQuery = useProjectBySolution(numericId)
  const projectDetail = projectQuery.data
  const projectId = projectDetail?.id
  // `projectDetail.contractor.username` is a short login/code (e.g. "ftd"), not the
  // display-worthy company name — the full name (e.g. "บริษัท เฟิร์สเทค ดีไซน์ จำกัด")
  // only lives on the contract/contact-detail endpoint (same one the ⓘ ProjectInfoModal
  // uses via `company_name`).
  const contactDetailQuery = useContactDetail(projectId)
  const contractorName = contactDetailQuery.data?.data.company_name
  // Fallback subtitle ("<project name> — <solution name>") reconstructed from
  // already-fetched data when the URL doesn't carry one — avoids requiring
  // every navigation entry point to stuff long Thai text into the query string.
  const apiSubtitle = [projectDetail?.project_name, solutionData?.solution_name].filter(Boolean).join(' — ')
  const warrantyRangeText = useMemo(() => {
    if (!projectDetail?.warranty_start_date || !projectDetail?.warranty_end_date) return '-'
    const start = dayjs(projectDetail.warranty_start_date)
    const end = dayjs(projectDetail.warranty_end_date)
    if (!start.isValid() || !end.isValid()) return '-'
    const years = end.diff(start, 'year')
    return `${start.format('DD MMM BBBB')} - ${end.format('DD MMM BBBB')} (${years} ปี)`
  }, [projectDetail?.warranty_start_date, projectDetail?.warranty_end_date])

  // Google Map pin — solution/{id} has no coordinates, but the feature's own
  // overview endpoint (keyed by the URL's prefix + department_id) carries
  // GeometryPoint filtered to this solution_id.
  const mapLocationQuery = useSolutionMapLocation(routeContext.map?.prefix, routeContext.map?.departmentId, numericId)
  const coord = useMemo<[number, number] | null>(() => {
    const point = mapLocationQuery.data?.locations?.[0]?.GeometryPoint
    return point && point.length === 2 ? [point[0], point[1]] : null
  }, [mapLocationQuery.data])

  /** เปิด Case (2026-09-11 flow v2): the modal does NOT create anything —
   *  it routes to /case/new (the officer's letter-creation page). The case +
   *  its auto Case No. are created when the letter is saved there (pending
   *  the BE multi-device endpoint). */
  const handleOpenCaseSubmit = (cameraIds: string[]) => {
    const params = new URLSearchParams(routeQuery)
    // `source` says which table the user came FROM. Opening a case starts a new
    // trail from this device table, so a stale `source=repair_history` (left by
    // an earlier visit) must not ride along — it would send the back arrow to
    // the history page instead of here (user 2026-09-21).
    params.delete('source')
    params.set('solution_id', id)
    params.set('camera_ids', cameraIds.join(','))
    router.push(`/admin/maintenance/case/new?${params.toString()}`)
  }

  // Deep link from the notification bell: ?camera_id=<uuid> scrolls the
  // device table to that camera's row once the data lands. antd/rc-table
  // stamps each row with data-row-key (= our camera_id row key), so no
  // per-row refs are needed. One-shot per mount — later refetches must not
  // yank the scroll position again while the user is reading.
  const targetCameraId = searchParams.get('camera_id')
  const scrolledToCameraRef = useRef(false)
  useEffect(() => {
    if (scrolledToCameraRef.current || !targetCameraId || loading) return
    const exists = (solutionData?.lists ?? []).some(
      (i: CameraItem) => i.camera_id === targetCameraId,
    )
    if (!exists) return
    // Next tick so the Table has committed its rows to the DOM.
    const t = window.setTimeout(() => {
      const row = document.querySelector(
        `tr[data-row-key="${CSS.escape(targetCameraId)}"]`,
      )
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
        scrolledToCameraRef.current = true
      }
    }, 150)
    return () => window.clearTimeout(t)
  }, [targetCameraId, loading, solutionData])

  // Map API data to table rows — show every device (both online and offline).
  const tableData: TableRow[] = (solutionData?.lists ?? []).map((item: CameraItem) => ({
    key: item.camera_id,
    status: item.status ? 'online' : 'offline',
    cameraName: item.camera_name,
    ipAddress: item.camera_ip,
    caseNo: item.case_no ?? null,
    cameraId: item.camera_id,
    category: item.category ?? '-',
    types: parseDeviceTypes(item.solution_group),
    brand: item.brand ?? '-',
    model: item.model ?? '-',
    hostname: item.hostname ?? '-',
    anydesk: item.anydesk ?? '-',
    zerotier: item.zerotier ?? '-',
    username: item.username ?? '-',
    password: item.password ?? '-',
  }))

  const warranty = solutionData?.warranty_status ? 'ในค้ำ' : 'หมดค้ำ'

  const columns: ColumnsType<TableRow> = [
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: string) => {
        const isOnline = status === 'online'
        return (
          <span
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full fs-12 font-normal whitespace-nowrap'
            style={{ border: `1px solid ${isOnline ? '#66AEFF' : '#E94C4C'}`, color: isOnline ? '#66AEFF' : '#E94C4C' }}
          >
            {isOnline ? <TbWifi size={14} /> : <TbWifiOff size={14} />}
            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        )
      },
    },
    {
      title: 'Case No.',
      dataIndex: 'caseNo',
      key: 'caseNo',
      width: 160,
      align: 'center',
      render: (text: string | null, record: TableRow) => {
        // มี case_no → โชว์ลิงก์ case_no (ทั้ง online และ offline)
        if (text) {
          return (
            <span
              style={{ color: '#FCD116', cursor: 'pointer' }}
              onClick={() => {
                const params = new URLSearchParams(routeQuery)
                params.set('solution_id', id)
                router.push(`/admin/maintenance/case/${text}?${params.toString()}`)
              }}
            >
              {text}
            </span>
          )
        }
        // ไม่มี case_no และ offline → โชว์ปุ่มเปิดเคส (เฉพาะเจ้าหน้าที่)
        if (record.status === 'offline' && !isContractor) {
          return (
            <button
              type='button'
              className='px-3 py-1 rounded-full fs-12 font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#FCD116', color: '#212121' }}
              onClick={() => setOpenCase({ open: true, preselectId: record.cameraId })}
            >
              + เปิด Case
            </button>
          )
        }
        // online และไม่มี case_no (หรือผู้รับจ้าง) → ไม่โชว์ปุ่ม
        return <span>-</span>
      },
    },
    // ประเภท = multi-type badges from the DEVICE_BADGE registry (new design
    // 2026-09-10) — a camera can serve several solutions (CCTV + Incident +
    // Volume). Falls back to '-' until the BE fills `category`.
    {
      title: 'ประเภท',
      dataIndex: 'types',
      key: 'types',
      width: 230,
      render: (types: TableRow['types']) =>
        types.length ? (
          <div className='flex flex-wrap items-center gap-1.5'>
            {types.map((t) => (
              <span
                key={t.label}
                className='inline-flex items-center px-2.5 py-0.5 rounded-full fs-12 whitespace-nowrap'
                style={{ border: `1px solid ${t.color}`, color: t.color }}
              >
                {t.label}
              </span>
            ))}
          </div>
        ) : (
          <span>-</span>
        ),
    },
    { title: 'ยี่ห้อ', dataIndex: 'brand', key: 'brand', width: 120, align: 'center' },
    { title: 'รุ่น', dataIndex: 'model', key: 'model', width: 120, align: 'center' },
    // Hostname shows the device name while the BE's `hostname` field is still
    // empty — the new design merged ชื่ออุปกรณ์ into this column.
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      width: 260,
      render: (v: string, r: TableRow) => (v && v !== '-' ? v : r.cameraName || '-'),
    },
    // Columns hidden per the 2026-09-10 redesign (7-column layout ending at
    // IP Address) — kept here, not deleted, in case the next revision brings
    // them back:
    // { title: 'ชื่ออุปกรณ์', dataIndex: 'cameraName', key: 'cameraName', width: 200 },
    // { title: 'Anydesk', dataIndex: 'anydesk', key: 'anydesk', width: 130, align: 'center' },
    // { title: 'ZeroTier', dataIndex: 'zerotier', key: 'zerotier', width: 130, align: 'center' },
    // { title: 'Username', dataIndex: 'username', key: 'username', width: 120, align: 'center' },
    // { title: 'Password', dataIndex: 'password', key: 'password', width: 120, align: 'center' },
    // IP Address is the LAST column on every detail-page table (2026-08-17
    // request, applied app-wide).
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 140, align: 'center' },
  ]

  if (loading) {
    return (
      <div className='main-screen flex items-center justify-center h-64'>
        <Spin size='large' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='main-screen flex items-center justify-center h-64 text-[#E94C4C]'>
        {error}
      </div>
    )
  }

  return (
    <div className='main-screen maintenance-font-min-14'>
      <MaintenanceMinimumFontSize />
      <TitleSectionWithData
        openableCount={tableData.filter((r) => r.status === 'offline' && !r.caseNo).length}
        onOpenCase={isContractor ? undefined : () => setOpenCase({ open: true, preselectId: null })}
        id={id}
        data={solutionData}
        coord={coord}
        resolvedProjectId={projectId}
        routeTitle={routeContext.title}
        routeSubtitle={routeContext.subtitle || apiSubtitle}
        routeRoadId={routeContext.roadId}
        onExport={() => setExportOpen(true)}
      />
      {/* นำออกเอกสาร — this table has no pagination (pagination={false} below,
          tableData is already the full device list), so a single-scope export
          matches the on-screen rows exactly. */}
      <ExportFileModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        count={tableData.length}
        onExportPdf={async () => {
          const { exportTablePdf } = await import('@/utils/export/pdf')
          await exportTablePdf({
            filenameBase: 'Maintenance_Solution_Devices',
            title: `รายงานรายการอุปกรณ์ - ${routeContext.title || solutionData?.solution_name || id}`,
            columns: DEVICE_EXPORT_COLUMNS,
            rows: tableData,
          })
        }}
        onExportExcel={async () => {
          const { exportExcel } = await import('@/utils/export/excel')
          exportExcel({
            filenameBase: 'Maintenance_Solution_Devices',
            sheetName: 'Devices',
            title: `รายงานรายการอุปกรณ์ - ${routeContext.title || solutionData?.solution_name || id}`,
            columns: DEVICE_EXPORT_COLUMNS,
            rows: tableData,
          })
        }}
      />
      <section className='mt-5 px-3 sm:px-10'>
        <ConfigProvider
          theme={{
            token: { colorPrimary: '#FCD116', colorBgContainer: '#2a2a2a', colorText: '#c2c2d3' },
            components: {
              Select: {
                optionActiveBg: '#FCD11620',
                optionSelectedBg: '#FCD11640',
                colorBgElevated: '#2a2a2a',
              },
            },
          }}
        >
          {/* Soft yellow wash on the row the notification deep-link targets —
              !important because antd paints td backgrounds from its theme. */}
          {targetCameraId && (
            <style>{`
              .maintenance-target-row > td {
                background: rgba(252, 209, 22, 0.14) !important;
              }
            `}</style>
          )}
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size='middle'
            rowClassName={(record) =>
              record.cameraId === targetCameraId ? 'maintenance-target-row' : ''
            }
          />
        </ConfigProvider>
      </section>

      {/* เปิด Case — device picker (2026-09-11 redesign). Devices = offline
        * rows without an open case; the project box mirrors the old dialog.
        * Never mounts for contractors — they can't open cases. */}
      {!isContractor && <OpenCaseModal
        open={openCase.open}
        preselectId={openCase.preselectId}
        devices={tableData
          .filter((r) => r.status === 'offline' && !r.caseNo)
          .map((r) => ({
            cameraId: r.cameraId,
            name: (r.hostname && r.hostname !== '-' ? r.hostname : r.cameraName) || '-',
            ip: r.ipAddress || '-',
            types: r.types,
          }))}
        project={{
          projectName: projectDetail?.project_name || '-',
          contractor: contractorName || '-',
          department: projectDetail?.department?.department_short_name || '-',
          contractNo: projectDetail?.contract_no || '-',
          warranty: warranty === 'ในค้ำ' ? 'ในค้ำ' : 'หมดค้ำ',
          warrantyRange: warrantyRangeText,
        }}
        submitting={false}
        onClose={() => setOpenCase({ open: false, preselectId: null })}
        onSubmit={handleOpenCaseSubmit}
      />}

      {/* Global Project Info modal — opens from the ⓘ icon in the title bar. Reads project_id/road_id from Redux. */}
      <ProjectInfoModal />
    </div>
  )
}

const MaintenanceDetailScreen: React.FC<Props> = ({ id }) => {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><Spin size='large' /></div>}>
      <DetailContent id={id} />
    </Suspense>
  )
}

export default React.memo<Props>(MaintenanceDetailScreen)
