"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Alert, Button, ConfigProvider, Drawer, Empty, Input, Segmented, Select, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQueries, useQuery } from '@tanstack/react-query'
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand, TbPrinter, TbSearch } from 'react-icons/tb'
import InstallSidebar from './InstallSidebar'
import MaintenanceMinimumFontSize from '../../components/MaintenanceMinimumFontSize'
import { dashboardKeys } from '@/hooks/queries/dashboard'
import { getDashboardPositionAPI } from '@/services/routes/DashboardService'
import { useDepartments } from '@/hooks/queries/manage'
import { cctvKeys } from '@/hooks/queries/cctv/queryKeys'
import { getCctvCameraCentralListAPI } from '@/services/routes/CCTVService'
import {
  INSTALL_TYPE_OPTIONS,
  type InstallType,
  extractKm,
  formatLat,
  formatLng,
  groupInstallPositions,
  installApiName,
  kmFromSta,
} from '../data/installPoints'

/** One display row = one device (CCTV: camera / Lighting-VMS: จุดติดตั้ง). */
interface DeviceRow {
  key: string
  name: string
  km: string
  lat: string
  lng: string
}

interface RoadGroup {
  roadId: number
  code: string
  pointCount: number
  deviceCount: number
  rows: DeviceRow[]
  isLoading: boolean
  isError: boolean
}

const ALL_ROADS = 'ALL'

const InstallPointsSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── ระบบ (CCTV / Lighting / VMS) — URL-synced like the repair sub-tabs ────
  const typeParam = (searchParams.get('type') ?? 'CCTV').toUpperCase()
  const type: InstallType = INSTALL_TYPE_OPTIONS.some((o) => o.value === typeParam)
    ? (typeParam as InstallType)
    : 'CCTV'
  const handleTypeChange = (value: string) => {
    router.push(`/admin/maintenance?install${value === 'CCTV' ? '' : `&type=${value}`}`)
  }

  // ── Data: nationwide install-point pool (all types, one request) ──────────
  // Same query the dashboard map uses (dept 0 + scope=all) so the cache is
  // shared; this page has no ?scope= in its URL, hence the explicit `true`
  // instead of useDashboardPosition (which reads scope from the URL).
  const positionQuery = useQuery({
    queryKey: dashboardKeys.position('0', 'all'),
    queryFn: () => getDashboardPositionAPI('0', true).then((r) => r.data),
  })
  const { data: departments } = useDepartments()
  const deptNames = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of departments ?? []) m.set(d.id, d.department_short_name)
    return m
  }, [departments])

  const apiName = installApiName(type)
  const bureaus = useMemo(
    () =>
      groupInstallPositions(
        (positionQuery.data?.locations ?? []).filter((l) => l.solution.solution_type_name === apiName),
        deptNames,
      ),
    [positionQuery.data, apiName, deptNames],
  )

  // ── Selection: default to the first ขทช. that has data; re-validate when
  // the type switches (a dept may have CCTV but no VMS). ────────────────────
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)
  useEffect(() => {
    const exists = bureaus.some((b) => b.departments.some((d) => d.id === selectedDeptId))
    if (!exists) setSelectedDeptId(bureaus[0]?.departments[0]?.id ?? null)
  }, [bureaus, selectedDeptId])

  const selectedDept = useMemo(
    () => bureaus.flatMap((b) => b.departments).find((d) => d.id === selectedDeptId),
    [bureaus, selectedDeptId],
  )
  const roads = useMemo(() => selectedDept?.roads ?? [], [selectedDept])

  // ── Filters (สายทาง dropdown + ค้นหาจุดติดตั้ง) — reset on dept/type move ─
  const [roadFilter, setRoadFilter] = useState<string>(ALL_ROADS)
  const [search, setSearch] = useState('')
  useEffect(() => {
    setRoadFilter(ALL_ROADS)
    setSearch('')
  }, [selectedDeptId, type])

  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Mobile (< lg): the sidebar lives in a left Drawer instead (smart-search
  // pattern, 2026-08-25) — separate state so desktop collapse is unaffected.
  const [drawerOpen, setDrawerOpen] = useState(false)

  // ── CCTV: per-camera rows via /cctv/cameras/central/list?road_id= (one
  // query per road of the selected ขทช., cache-shared with the CCTV search
  // page's own hook). Lighting/VMS never enable these. ──────────────────────
  const isCctv = type === 'CCTV'
  const cameraQueries = useQueries({
    queries: roads.map((road) => ({
      queryKey: cctvKeys.cameraCentralByRoad(road.id),
      queryFn: () => getCctvCameraCentralListAPI(road.id).then((r) => r.data),
      enabled: isCctv,
      staleTime: 60_000,
    })),
  })

  const roadGroups = useMemo<RoadGroup[]>(() => {
    return roads.map((road, i) => {
      if (!isCctv) {
        // Lighting / VMS: 1 จุดติดตั้ง (solution) = 1 row, straight from the
        // position payload — no extra request needed.
        const rows = road.solutions.map((s) => ({
          key: `s-${s.solution.solution_id}`,
          name: s.solution.solution_name,
          km: extractKm(s.solution.solution_name),
          lat: formatLat(s.geometry_point),
          lng: formatLng(s.geometry_point),
        }))
        return {
          roadId: road.id,
          code: road.code,
          pointCount: road.solutions.length,
          deviceCount: rows.length,
          rows,
          isLoading: false,
          isError: false,
        }
      }
      const q = cameraQueries[i]
      const lists = q?.data?.lists ?? []
      const rows = lists.flatMap((item) =>
        (item.cameras ?? []).map((cam) => ({
          key: `c-${cam.id}`,
          name: cam.camera_name,
          km: kmFromSta(cam.sta, cam.camera_name),
          lat: formatLat(cam.geometry_point),
          lng: formatLng(cam.geometry_point),
        })),
      )
      return {
        roadId: road.id,
        code: road.code,
        pointCount: lists.length,
        deviceCount: rows.length,
        rows,
        isLoading: q?.isLoading ?? false,
        isError: q?.isError ?? false,
      }
    })
  }, [roads, isCctv, cameraQueries])

  // Apply the two filters. A road with zero matching rows drops out entirely
  // (matches the mock, which only lists roads that have devices).
  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return roadGroups
      .filter((g) => roadFilter === ALL_ROADS || String(g.roadId) === roadFilter)
      .map((g) => (q ? { ...g, rows: g.rows.filter((r) => `${r.name} ${r.km} ${r.lat} ${r.lng}`.toLowerCase().includes(q)) } : g))
      .filter((g) => g.isLoading || g.isError || g.rows.length > 0)
  }, [roadGroups, roadFilter, search])

  const deviceWord = isCctv ? 'กล้อง' : 'อุปกรณ์'

  const handleExportCsv = async () => {
    const { exportCsv } = await import('@/utils/export/csv')
    const flat = visibleGroups.flatMap((g) =>
      g.rows.map((row, i) => ({ ...row, road: g.code, seq: i + 1 })),
    )
    exportCsv({
      filenameBase: `Install_Points_${type}`,
      columns: [
        { header: 'สายทาง', value: (r: (typeof flat)[number]) => r.road },
        { header: 'ลำดับ', value: (r) => r.seq },
        { header: isCctv ? 'ชื่อกล้อง' : 'ชื่ออุปกรณ์', value: (r) => r.name },
        { header: 'จุดติดตั้ง', value: (r) => r.km },
        { header: 'Latitude', value: (r) => r.lat },
        { header: 'Longitude', value: (r) => r.lng },
      ],
      rows: flat,
    })
  }

  const columns: ColumnsType<DeviceRow> = useMemo(
    () => [
      {
        title: 'ลำดับ',
        key: 'seq',
        width: 80,
        // Indent first column 28px to match the overall-page list tables.
        onHeaderCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
        onCell: () => ({ style: { paddingInlineStart: 28, paddingLeft: 28 } }),
        render: (_, __, index) => <span className='text-white/60'>{index + 1}</span>,
      },
      {
        title: isCctv ? 'ชื่อกล้อง' : 'ชื่ออุปกรณ์',
        dataIndex: 'name',
        key: 'name',
        render: (v: string) => <span className='text-white fs-12'>{v}</span>,
      },
      {
        title: 'จุดติดตั้ง',
        dataIndex: 'km',
        key: 'km',
        width: 160,
        render: (v: string) => <span className='text-white/80 fs-12'>{v}</span>,
      },
      {
        title: 'Latitude',
        dataIndex: 'lat',
        key: 'lat',
        width: 160,
        render: (v: string) => <span className='text-white/80 fs-12 tabular-nums'>{v}</span>,
      },
      {
        title: 'Longitude',
        dataIndex: 'lng',
        key: 'lng',
        width: 160,
        render: (v: string) => <span className='text-white/80 fs-12 tabular-nums'>{v}</span>,
      },
    ],
    [isCctv],
  )

  return (
    <div className='px-3 sm:px-10 maintenance-font-min-14'>
      <MaintenanceMinimumFontSize />
      {/* ระบบ toggle — Segmented in the same chrome as this menu's period
          picker (yellow-outlined container, yellow active thumb) per the
          Figma mock (2026-08-25). */}
      <section className='mb-4'>
        <Segmented
          value={type}
          onChange={(value) => handleTypeChange(value as string)}
          options={INSTALL_TYPE_OPTIONS.map(({ label, value }) => ({ label, value }))}
          size='large'
          classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
        />
      </section>

      {positionQuery.isLoading ? (
        <div className='min-h-[40vh] flex items-center justify-center'>
          <Spin size='large' />
        </div>
      ) : positionQuery.isError ? (
        <Alert
          type='error'
          showIcon
          message='ไม่สามารถโหลดข้อมูลจุดติดตั้งได้'
          action={<Button size='small' onClick={() => void positionQuery.refetch()}>ลองใหม่</Button>}
        />
      ) : (
        <div className='flex items-start gap-3'>
          {/* ══ Sidebar (lg+): width-animated collapse + yellow circle toggle
              riding the panel edge — same pattern/colours as LPR's
              LicenseSection (2026-08-25 request). ══ */}
          <div className='relative shrink-0 max-lg:hidden'>
            <div
              className={[
                'overflow-hidden transition-[width] duration-300 ease-in-out',
                sidebarOpen ? 'w-[340px]' : 'w-0',
              ].join(' ')}
            >
              <aside className='w-[340px] rounded-2xl p-4 bg-(--dark-black)'>
                <InstallSidebar
                  bureaus={bureaus}
                  selectedDeptId={selectedDeptId}
                  onSelectDept={setSelectedDeptId}
                />
              </aside>
            </div>
            <Button
              type='primary'
              shape='circle'
              title={sidebarOpen ? 'ซ่อนแถบหน่วยงาน' : 'แสดงแถบหน่วยงาน'}
              icon={sidebarOpen ? <TbLayoutSidebarLeftCollapse className='fs-16' /> : <TbLayoutSidebarLeftExpand className='fs-16' />}
              onClick={() => setSidebarOpen((v) => !v)}
              // 32px + protrude 16px — small enough to stay inside the lane the
              // content pane reserves below (was 40px/-right-5, which overlapped
              // the สายทาง dropdown, reported 2026-08-25).
              className='absolute! top-10 -right-4 z-20 w-8! h-8! min-w-8! shadow-lg'
            />
          </div>

          {/* ══ Mobile (< lg): fixed edge button + left Drawer — smart-search
              pattern; the button slides with the drawer edge. ══ */}
          <button
            type='button'
            aria-label={drawerOpen ? 'ซ่อนแถบหน่วยงาน' : 'แสดงแถบหน่วยงาน'}
            onClick={() => setDrawerOpen((v) => !v)}
            className='lg:hidden fixed top-1/2 -translate-y-1/2 z-[1100] w-10 h-10 rounded-full flex items-center justify-center bg-(--yellow) text-black shadow-lg transition-[left] duration-300 ease-in-out cursor-pointer'
            style={{ left: drawerOpen ? 320 - 20 : 8 }}
          >
            {drawerOpen ? <TbLayoutSidebarLeftCollapse className='fs-18' /> : <TbLayoutSidebarLeftExpand className='fs-18' />}
          </button>
          <Drawer
            placement='left'
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            closable={false}
            styles={{
              wrapper: { width: 320 },
              body: { padding: 16, background: 'var(--dark-black)' },
              header: { display: 'none' },
            }}
          >
            <InstallSidebar
              bureaus={bureaus}
              selectedDeptId={selectedDeptId}
              onSelectDept={(id) => {
                setSelectedDeptId(id)
                setDrawerOpen(false)
              }}
            />
          </Drawer>

          {/* Content — lg:pl-3 keeps a clear lane for the sidebar toggle
              button that protrudes past the panel edge. */}
          <div className='flex-1 min-w-0 lg:pl-3'>
            <div className='flex flex-wrap items-end gap-3'>
              <fieldset className='w-full sm:w-[220px]'>
                <label className='block fs-12 text-(--yellow) mb-1'>สายทาง</label>
                <Select
                  value={roadFilter}
                  onChange={setRoadFilter}
                  className='w-full'
                  size='large'
                  options={[
                    { label: 'สายทางทั้งหมด...', value: ALL_ROADS },
                    ...roads.map((r) => ({ label: r.code, value: String(r.id) })),
                  ]}
                />
              </fieldset>
              <fieldset className='w-full sm:w-[340px]'>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='ค้นหาจุดติดตั้ง Latitude Longitude...'
                  suffix={<TbSearch className='text-(--yellow)' />}
                  className='w-full rounded-lg'
                  size='large'
                  allowClear
                />
              </fieldset>
              <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
                <Button type='primary' shape='round' size='large' icon={<TbPrinter />} onClick={handleExportCsv}>
                  นำออก CSV
                </Button>
              </ConfigProvider>
            </div>

            {visibleGroups.length === 0 ? (
              <div className='py-16'>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={roads.length === 0 ? `หน่วยงานนี้ไม่มีจุดติดตั้ง ${type}` : 'ไม่พบจุดติดตั้งตามเงื่อนไข'}
                />
              </div>
            ) : (
              visibleGroups.map((g) => (
                <section key={g.roadId} className='mt-6'>
                  <div className='flex items-center gap-3 mb-3'>
                    <h2 className='text-white m-0'>{g.code}</h2>
                    <span className='inline-flex items-center py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-(--default-blue) text-(--default-blue)'>
                      {g.pointCount.toLocaleString()} จุดติดตั้ง
                    </span>
                    <span className='inline-flex items-center py-0.5 px-3.5 rounded-full fs-12 whitespace-nowrap border border-(--yellow) text-(--yellow)'>
                      {g.deviceCount.toLocaleString()} {deviceWord}
                    </span>
                  </div>
                  {g.isLoading ? (
                    <div className='min-h-24 flex items-center justify-center'><Spin /></div>
                  ) : g.isError ? (
                    <Alert type='error' showIcon message={`ไม่สามารถโหลดรายการกล้องของ ${g.code} ได้`} />
                  ) : (
                    <Table<DeviceRow>
                      columns={columns}
                      dataSource={g.rows}
                      rowKey='key'
                      pagination={false}
                      size='middle'
                      className='bridge-projects-table'
                      scroll={{ x: 'max-content' }}
                    />
                  )}
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(InstallPointsSection)
