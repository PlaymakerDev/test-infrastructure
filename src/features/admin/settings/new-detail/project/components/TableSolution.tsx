import { SOLUTION_TYPE } from '@/constants';
import { getProjectByIDAPI, getSolutionByIDAPI, getSolutionCameraListAPI } from '@/services/routes/ProjectDetailService';
import { getCrossingCodesAPI } from '@/services/routes/SolutionService';
import { getLightingIMEIBySolutionAPI } from '@/services/routes/LightingService';
import { useAppDispatch } from '@/stores/hooks';
import { setConfirmDeleteSolutionModalOpen, setCreateDeviceModalOpen, setCrossingCodeModalOpen, setEquipmentModalOpen, setViewDeviceModalOpen } from '@/stores/reducers/modal/customModalSlice';
import { getEquipmentModalType } from '@/features/admin/settings/new-detail/project/data/equipmentModal';
import {
  buildLightingSolutionHref,
  buildSolutionDetailUrl,
  type SolutionDetailContext,
} from '@/features/admin/settings/new-detail/project/data/solutionDetailUrl';
import { useLightingCentralList } from '@/hooks/queries/lighting';
import { mapCentralListToProjects } from '@/features/admin/traffic-lighting/overall/data/trafficLightingProjects';
import { SolutionList, SolutionLocation } from '@/types/manage/project-detail-api';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, ConfigProvider, Empty, Table, TableProps, Tooltip } from 'antd';
import { AxiosError } from 'axios';
import React, { useCallback, useMemo, useState } from 'react'
import { TbCircuitCapacitor, TbPencilMinus, TbShieldLock, TbTrash } from 'react-icons/tb';
import { useProjectContext } from '../context';
import { SOLUTION_TYPE_LIGHTING } from '../data/lighting';
import Link from 'next/link';

interface Props {
  item: SolutionLocation
  data?: SolutionList[]
  isLoading?: boolean
  isError?: boolean
}

const TableSolution: React.FC<Props> = (props) => {
  const { item, data, isLoading, isError } = props
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const { id: projectId, roadSolution } = useProjectContext()
  const [openingDiagramFor, setOpeningDiagramFor] = useState<number | null>(null)

  // Same key AND same queryFn shape as TitleSection's — this reads its cache
  // rather than firing a second request. Only `is_warranty` is needed: VMS and
  // Bridge Lighting render their warranty pill straight off the query param.
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectByIDAPI(String(projectId)),
    enabled: !!projectId,
  })

  const detailContext = useMemo<SolutionDetailContext>(() => ({
    // The solution's OWN bureau. Without it useDeptId() falls back to dept 50
    // and the detail page quietly renders someone else's data.
    deptId: roadSolution.road?.department_id,
    projectId: roadSolution.project_id,
    roadId: roadSolution.road_id,
    isWarranty: project?.data.is_warranty ?? null,
  }), [roadSolution, project])

  // Traffic Lighting is addressed by IMEI, which lives in the lighting central
  // list, not on the solution row. Road-scoped so it is a small payload, and
  // only fetched when a Traffic Lighting row is actually on screen.
  const hasLightingRow = useMemo(
    () => (data ?? []).some((row) => row.solution_type?.id === SOLUTION_TYPE_LIGHTING),
    [data],
  )
  // `|| null` on the department too, not just a falsy check on hasLightingRow:
  // INIT_ROAD seeds department_id as 0, and 0 is a VALID dept id to the lighting
  // hook's guard — it would fire the nationwide list while the road is still
  // loading.
  const lightingList = useLightingCentralList(
    hasLightingRow ? roadSolution.road?.department_id || null : null,
    roadSolution.road_id || null,
  )
  const lightingBySolutionId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mapCentralListToProjects>[number]>()
    for (const row of mapCentralListToProjects(lightingList.data ?? [])) {
      if (row.solutionId != null) map.set(String(row.solutionId), row)
    }
    return map
  }, [lightingList.data])

  const openCrossingCodeModal = useCallback(async (record: SolutionList) => {
    try {
      const response = await getCrossingCodesAPI(record.id as number)
      dispatch(setCrossingCodeModalOpen({
        open: true,
        data: response.data,
        item: item,
        record: record
      }))
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.message)
      } else {
        console.error(error)
      }
    }
  }, [dispatch, item, message])

  /** Fetches the row's full detail first — the list row carries a trimmed
   *  shape, while FormCreateDevice seeds its defaults from
   *  APIResponseSolutionByID (and needs `id` for PUT /manage/solution/{id}). */
  const openUpdateDeviceModal = useCallback(async (record: SolutionList) => {
    try {
      const response = await getSolutionByIDAPI(record.id as number)
      dispatch(setCreateDeviceModalOpen({
        open: true,
        data: response.data,
        item: item,
        record: record,
        type: 'UPDATE'
      }))
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.message)
      } else {
        console.error(error)
      }
    }
  }, [dispatch, item, message])

  const openConfirmDeleteModal = useCallback((record: SolutionList) => {
    dispatch(setConfirmDeleteSolutionModalOpen({
      open: true,
      type: 'DELETE_SOLUTION_TYPE',
      item: item,
      record: record,
    }))
  }, [dispatch, item])

  /** "รายการอุปกรณ์" button. Kinds with a managed picker (CCTV list, camera
   *  select, Traffic Signal, VMS — see getEquipmentModalType) open it through
   *  `equipment_modal`; the modal reads the camera list live itself, so there
   *  is nothing to fetch here. Lighting / Tunnel / Bridge Lighting have no
   *  camera endpoint and keep the read-only list. */
  const openEquipmentModal = useCallback(async (record: SolutionList) => {
    const type = getEquipmentModalType(record.solution_type.id)
    if (type) {
      dispatch(setEquipmentModalOpen({
        open: true,
        type,
        item: item,
        record: record,
        solutions: data ?? [],
      }))
      return
    }
    try {
      const response = await getSolutionCameraListAPI(item.solution_location_id)
      if (response.status === 200) {
        dispatch(setViewDeviceModalOpen({
          open: true,
          data: response.data,
          type: 'DEVICE'
        }))
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.message)
      } else {
        console.error(error)
      }
    }
  }, [item, data, message, dispatch])

  /** Opens the circuit-diagram editor for a Street Light row.
   *
   *  The diagram is keyed by IMEI, not by solution, so the imei has to be
   *  resolved first. A Lora gateway has no IoT device and therefore no
   *  diagram — say so rather than opening an editor on a blank name. */
  const openDiagramEditor = useCallback(async (record: SolutionList) => {
    const deptId = roadSolution.road?.department_id
    if (!deptId && deptId !== 0) return
    setOpeningDiagramFor(record.id as number)
    try {
      const response = await getLightingIMEIBySolutionAPI(deptId, record.id as number)
      const imei = response.data?.imei?.trim()
      if (!imei) {
        message.warning('อุปกรณ์นี้ไม่มี IMEI จึงยังไม่มีผังวงจร (เช่น Lora Gateway)')
        return
      }
      // New tab: the editor is a separate app with its own chrome, and the
      // half-filled project page behind it should survive.
      window.open(
        `${process.env.NEXT_PUBLIC_HOST_BACKEND}/lighting/diagram?imei=${encodeURIComponent(imei)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } catch (error) {
      if (error instanceof AxiosError) {
        message.error(error.message)
      } else {
        console.error(error)
      }
    } finally {
      setOpeningDiagramFor(null)
    }
  }, [roadSolution.road?.department_id, message])

  /** The ไปยังหน้าเว็บ cell.
   *
   *  Every menu's detail page takes a different query-param set, and two types
   *  cannot be addressed from this page at all — see data/solutionDetailUrl.ts.
   *  Those render as muted text carrying the reason, rather than a link that
   *  would open the wrong record (or, as before this, a route that does not
   *  exist). */
  const renderDetailLink = useCallback((record: SolutionList) => {
    const label = record.solution_name?.trim()
    if (!label) return '-'

    const blocked = (reason: string) => (
      <Tooltip title={reason}>
        <span className='text-(--light-gray-3) cursor-not-allowed'>{label}</span>
      </Tooltip>
    )

    const typeId = record.solution_type?.id ?? record.solution_type_id
    const target = buildSolutionDetailUrl(typeId, record.id, detailContext)

    if (target.kind === 'blocked') return blocked(target.reason)

    if (target.kind === 'needs-lighting-row') {
      const deptId = roadSolution.road?.department_id || null
      const row = lightingBySolutionId.get(String(record.id))
      if (!deptId || !row) {
        return blocked(lightingList.isLoading
          ? 'กำลังโหลดข้อมูลอุปกรณ์ไฟฟ้าส่องสว่าง'
          : 'ไม่พบอุปกรณ์ของงานนี้ในระบบไฟฟ้าส่องสว่าง จึงยังไม่มีหน้ารายละเอียด')
      }
      return (
        <Link href={buildLightingSolutionHref(row, deptId)} className='text-(--default-blue)'>
          {label}
        </Link>
      )
    }

    return <Link href={target.href} className='text-(--default-blue)'>{label}</Link>
  }, [detailContext, lightingBySolutionId, lightingList.isLoading, roadSolution.road?.department_id])

  const columns: TableProps<SolutionList>['columns'] = [
    {
      title: 'ประเภทงาน',
      dataIndex: 'solution_name',
      key: 'solution_name',
      width: 200,
      render: (_, record) => {
        if (record.solution_type.solution_name) return SOLUTION_TYPE[String(record.solution_type.id) as keyof typeof SOLUTION_TYPE]
        return '-'
      }
    },
    {
      title: 'CrossingCode',
      dataIndex: 'crossing_code',
      key: 'crossing_code',
      width: 200,
      render: (_, record) => {
        // CCTV (1) no longer reaches this table at all — the backend filters
        // it out of GET /manage/solution because it is managed at the สายทาง
        // level. Left in the list so the intent survives if that changes.
        const unavailableTypes = [1, 6, 8, 10]
        if (unavailableTypes.includes(record.solution_type.id)) return
        return (
          <TbShieldLock
            className='fs-28 text-(--default-blue) cursor-pointer'
            onClick={() => openCrossingCodeModal(record)}
          />
        )
      }
    },
    {
      title: 'รายการอุปกรณ์',
      dataIndex: 'device',
      key: 'device',
      width: 200,
      render: (_, record) => {
        // No CCTV branch here on purpose: CCTV is one solution per
        // (โครงการ + สายทาง) and the backend filters it out of
        // GET /manage/solution, so no CCTV row reaches this table. Its
        // cameras are managed by the road-level CctvEquipmentSection above
        // the จุดติดตั้ง tabs.
        // Street Light has no camera picker — its equipment is the circuit,
        // so this cell opens the diagram editor for the row's device instead.
        //
        // Keyed on the type id, NOT on solution_name_atlas: that column is
        // NULL for all 9 rows of tbl_solution_type, so the string comparison
        // this used to make was never true and the button never rendered.
        if (record.solution_type.id === SOLUTION_TYPE_LIGHTING) {
          return (
            <Button
              type='link'
              htmlType='button'
              icon={<TbCircuitCapacitor className='fs-22' />}
              loading={openingDiagramFor === record.id}
              onClick={() => openDiagramEditor(record)}
              className='text-(--default-blue)! px-0!'
            >
              <span className='fs-12'>ผังวงจร</span>
            </Button>
          )
        }
        return (
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              ghost
              type='primary'
              htmlType='button'
              icon={<PlusOutlined />}
              shape='circle'
              onClick={() => openEquipmentModal(record)}
            />
          </ConfigProvider>
        )
      }
    },
    {
      title: 'ไปยังหน้าเว็บ',
      dataIndex: 'redirect',
      key: 'redirect',
      width: 200,
      render: (_, record) => renderDetailLink(record)
    },
    {
      title: 'จัดการ',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (_, record) => {
        return (
          <div className='flex items-center gap-2 shrink-0'>
            <TbPencilMinus
              className='fs-22 text-(--default-orange) cursor-pointer'
              title='แก้ไขข้อมูลโครงการ'
              onClick={() => openUpdateDeviceModal(record)}
            />
            <TbTrash
              className='fs-22 text-(--default-red) cursor-pointer'
              title='ลบโครงการ'
              onClick={() => openConfirmDeleteModal(record)}
            />
          </div>
        )
      }
    },
  ];

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerBg: "#66AEFF",
            headerColor: "#000000",
            headerSplitColor: "#00000020",
            colorText: "#FFFFFF",
            borderColor: "#66AEFF",
          },
        }
      }}
    >
      <Table<SolutionList>
        rowKey="id"
        columns={columns}
        dataSource={data}
        size='medium'
        loading={isLoading}
        pagination={{
          locale: { items_per_page: '/ หน้า' }
        }}
        scroll={{ x: 'max-content' }}
      />
    </ConfigProvider>
  )
}

export default React.memo<Props>(TableSolution)
