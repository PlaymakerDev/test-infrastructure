"use client"
import React, { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { App, ConfigProvider, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { TbWifi, TbWifiOff, TbX } from 'react-icons/tb'
import { TitleSection } from '../components'
import {
  useCreateMaintenanceCase,
  useMaintenanceSolution,
  useProjectBySolution,
  useSolutionMapLocation,
} from '@/hooks/queries/maintenance'
import { ProjectInfoModal } from '@/components/modal'
import type { CameraItem, SolutionDetailResponse } from '@/types/maintenance'

interface Props {
  id: string
}

interface TableRow {
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

interface TitleSectionWithDataProps {
  id: string
  data: SolutionDetailResponse | null
  coord: [number, number] | null
  resolvedProjectId?: number
  routeTitle?: string
  routeSubtitle?: string
  routeRoadId?: number
}

/** Route context is URL-scoped; a direct visit falls back to solution API data. */
const TitleSectionWithData: React.FC<TitleSectionWithDataProps> = ({
  id,
  data,
  coord,
  resolvedProjectId,
  routeTitle,
  routeSubtitle,
  routeRoadId,
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
    />
  )
}

const DetailContent: React.FC<{ id: string }> = ({ id }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { modal } = App.useApp()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null)
  const numericId = Number(id)

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
  const projectQuery = useProjectBySolution(numericId)
  const projectId = projectQuery.data?.id

  // Google Map pin — solution/{id} has no coordinates, but the feature's own
  // overview endpoint (keyed by the URL's prefix + department_id) carries
  // GeometryPoint filtered to this solution_id.
  const mapLocationQuery = useSolutionMapLocation(routeContext.map?.prefix, routeContext.map?.departmentId, numericId)
  const coord = useMemo<[number, number] | null>(() => {
    const point = mapLocationQuery.data?.locations?.[0]?.GeometryPoint
    return point && point.length === 2 ? [point[0], point[1]] : null
  }, [mapLocationQuery.data])

  const createCase = useCreateMaintenanceCase()

  // Map API data to table rows — show every device (both online and offline).
  const tableData: TableRow[] = (solutionData?.lists ?? []).map((item: CameraItem) => ({
    key: item.camera_id,
    status: item.status ? 'online' : 'offline',
    cameraName: item.camera_name,
    ipAddress: item.camera_ip,
    caseNo: item.case_no ?? null,
    cameraId: item.camera_id,
    category: item.category ?? '-',
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
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-normal whitespace-nowrap'
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
        // ไม่มี case_no และ offline → โชว์ปุ่มเปิดเคส
        if (record.status === 'offline') {
          return (
            <button
              type='button'
              className='px-3 py-1 rounded-full text-[12px] font-normal whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity'
              style={{ background: '#FCD116', color: '#212121' }}
              onClick={() => {
                setSelectedRow(record)
                setIsModalOpen(true)
              }}
            >
              เปิด Case
            </button>
          )
        }
        // online และไม่มี case_no → ไม่โชว์ปุ่ม
        return <span>-</span>
      },
    },
    { title: 'ประเภท', dataIndex: 'category', key: 'category', width: 120, align: 'center' },
    { title: 'ยี่ห้อ', dataIndex: 'brand', key: 'brand', width: 120, align: 'center' },
    { title: 'รุ่น', dataIndex: 'model', key: 'model', width: 120, align: 'center' },
    { title: 'ชื่ออุปกรณ์', dataIndex: 'cameraName', key: 'cameraName', width: 200 },
    { title: 'Hostname', dataIndex: 'hostname', key: 'hostname', width: 140, align: 'center' },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 140, align: 'center' },
    { title: 'Anydesk', dataIndex: 'anydesk', key: 'anydesk', width: 130, align: 'center' },
    { title: 'ZeroTier', dataIndex: 'zerotier', key: 'zerotier', width: 130, align: 'center' },
    { title: 'Username', dataIndex: 'username', key: 'username', width: 120, align: 'center' },
    { title: 'Password', dataIndex: 'password', key: 'password', width: 120, align: 'center' },
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
    <div className='main-screen'>
      <TitleSectionWithData
        id={id}
        data={solutionData}
        coord={coord}
        resolvedProjectId={projectId}
        routeTitle={routeContext.title}
        routeSubtitle={routeContext.subtitle}
        routeRoadId={routeContext.roadId}
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
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size='middle'
          />
        </ConfigProvider>
      </section>

      {/* Custom White Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          {/* Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              zIndex: 1,
            }}
          />

          {/* Modal Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: 'calc(100% - 32px)',
              maxWidth: 800,
              minHeight: 400,
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              padding: '20px 24px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ปิด */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <TbX size={20} color='#999' />
              </button>
            </div>

            {/* รูป */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src='/atlas/images/Maintenance/icmd1.png'
                alt='maintenance'
                style={{ width: 100, height: 100, objectFit: 'contain' }}
              />
            </div>

            {/* หัวข้อ */}
            <h3 style={{ fontSize: 24, fontWeight: 700, color: '#525252', margin: '0 0 8px 0', textAlign: 'center' }}>
              ยืนยันเปิด Case อุปกรณ์นี้หรือไม่?
            </h3>
            <p style={{ fontSize: 14, fontWeight: 400, color: '#525252', margin: '0 0 24px 0', textAlign: 'center' }}>
              ระบบจะออก Case No. ให้อัตโนมัติ
            </p>

            {/* เนื้อหา */}
            <div
              style={{
                fontSize: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: 16,
                borderRadius: 12,
                backgroundColor: '#E94C4C33',
                border: '2px solid #E94C4C',
              }}
            >
              <div><span style={{ color: '#979797' }}>ชื่ออุปกรณ์ : </span><span style={{ color: '#212121' }}>{selectedRow?.cameraName || '-'}</span></div>
              <div><span style={{ color: '#979797' }}>IP Address : </span><span style={{ color: '#212121' }}>{selectedRow?.ipAddress || '-'}</span></div>
              <div><span style={{ color: '#979797' }}>สถานะการค้ำประกัน : </span><span style={{ color: '#E94C4C', fontWeight: 700, fontSize: 14 }}>{warranty}</span></div>
            </div>

            {/* ปุ่ม */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 'auto',
                paddingTop: 32,
              }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 88,
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1px solid #C4C4C4',
                  backgroundColor: '#FFFFFF',
                  color: '#212121',
                  cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (!selectedRow || createCase.isPending) return
                  // `mutate` + callbacks (not mutateAsync) per the canonical
                  // write pattern — the hook itself invalidates the solution/
                  // cases/history reads so the device table refreshes.
                  createCase.mutate({ camera_id: selectedRow.cameraId }, {
                    onSuccess: () => {
                      setIsModalOpen(false)
                      modal.success({
                        title: 'เปิด Case สำเร็จ',
                        content: `สร้าง Case สำหรับอุปกรณ์ ${selectedRow.cameraName} เรียบร้อยแล้ว`,
                        okText: 'ตกลง',
                        centered: true,
                      })
                    },
                    onError: (err) => {
                      console.error('Error creating case:', err)
                      modal.error({
                        title: 'ไม่สามารถเปิด Case ได้',
                        content: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
                        okText: 'ตกลง',
                        centered: true,
                      })
                    },
                  })
                }}
                disabled={createCase.isPending}
                style={{
                  padding: '8px 20px',
                  borderRadius: 88,
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  backgroundColor: createCase.isPending ? '#C4C4C4' : '#FCD116',
                  color: '#212121',
                  cursor: createCase.isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {createCase.isPending ? 'กำลังสร้าง...' : 'เปิด Case'}
              </button>
            </div>
          </div>
        </div>
      )}

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
