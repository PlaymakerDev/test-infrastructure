import { SOLUTION_TYPE } from '@/constants';
import { getSolutionByIDAPI } from '@/services/routes/ProjectDetailService';
import { getCrossingCodesAPI } from '@/services/routes/SolutionService';
import { useAppDispatch } from '@/stores/hooks';
import { setCreateDeviceModalOpen, setCrossingCodeModalOpen } from '@/stores/reducers/modal/customModalSlice';
import { SolutionList, SolutionLocation } from '@/types/manage/project-detail-api';
import { PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Empty, message, Table, TableProps } from 'antd';
import { AxiosError } from 'axios';
import React, { useCallback } from 'react'
import { TbPencilMinus, TbShieldLock, TbTrash, TbVideo } from 'react-icons/tb';

interface Props {
  item: SolutionLocation
  data?: SolutionList[]
  isLoading?: boolean
  isError?: boolean
}

const TableSolution: React.FC<Props> = (props) => {
  const { item, data, isLoading, isError } = props
  const dispatch = useAppDispatch()

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
  }, [dispatch, item])

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
  }, [dispatch, item])

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
        if (record.solution_type.solution_name === 'CCTV') return <TbVideo className='fs-28 text-(--yellow) cursor-pointer' />
        return (
          <ConfigProvider theme={{ token: { colorPrimary: '#66AEFF', colorTextLightSolid: '#0A0A0A' } }}>
            <Button
              ghost
              type='primary'
              icon={<PlusOutlined />}
              shape='circle'
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
