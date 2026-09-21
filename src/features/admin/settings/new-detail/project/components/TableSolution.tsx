import { SOLUTION_TYPE } from '@/constants';
import { getSolutionByIDAPI, getSolutionCameraListAPI } from '@/services/routes/ProjectDetailService';
import { getCrossingCodesAPI } from '@/services/routes/SolutionService';
import { useAppDispatch } from '@/stores/hooks';
import { setConfirmDeleteSolutionModalOpen, setCreateDeviceModalOpen, setCrossingCodeModalOpen, setEquipmentModalOpen, setViewDeviceModalOpen } from '@/stores/reducers/modal/customModalSlice';
import { getEquipmentModalType } from '@/features/admin/settings/new-detail/project/data/equipmentModal';
import { SolutionList, SolutionLocation } from '@/types/manage/project-detail-api';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, ConfigProvider, Empty, Table, TableProps } from 'antd';
import { AxiosError } from 'axios';
import React, { useCallback } from 'react'
import { TbPencilMinus, TbShieldLock, TbTrash, TbVideo } from 'react-icons/tb';
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
        if (record.solution_type.solution_name === 'CCTV') return <TbVideo className='fs-28 text-(--yellow) cursor-pointer' title='ดู/จัดการอุปกรณ์' onClick={() => openEquipmentModal(record)} />
        if (record.solution_type.solution_name_atlas === 'Traffic Lighting') return
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
      render: (_, record) => {
        if (record.solution_name) {
          return <Link href={`/solutions/${record.id}`}>{record.solution_name}</Link>
        }
        return '-'
      }
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
