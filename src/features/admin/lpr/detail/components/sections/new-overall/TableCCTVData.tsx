import { useAppDispatch } from '@/stores/hooks'
import { setCCTVModalOpen } from '@/stores/reducers/layout/layoutSlice'
import { APIResponseLPRRandomOnline, RandomOnlineData } from '@/types/lpr/new-lpr-api'
import { Empty, Table, TableProps } from 'antd'
import React from 'react'

interface Props {
  data?: APIResponseLPRRandomOnline
  isLoading?: boolean
  isError?: boolean
}

interface DataType {
  id: string
  key: string
  camera_name: string
  sta: string
  solution: string
  stream_status: 'Connect' | 'Disconnect'
  device_status: 'Connect' | 'Disconnect'
  ip_address: string
}

const TableCCTVData: React.FC<Props> = (props) => {
  const { data, isLoading, isError } = props
  const dispatch = useAppDispatch()

  const columns: TableProps<RandomOnlineData>['columns'] = [
    {
      title: 'ลำดับ',
      dataIndex: 'key',
      key: 'key',
      width: 100,
      render: (_, __, index) => {
        return index + 1
      }
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 300,
      render: (_, record) => {
        if (record.camera.name) return record.camera.name
        return '-'
      }
    },
    // {
    //   title: 'กม.ที่',
    //   dataIndex: 'sta',
    //   key: 'sta',
    //   width: 100,
    //   render: (item) => {
    //     if (item) return item
    //     return '-'
    //   }
    // },
    {
      title: 'การทำงาน',
      dataIndex: 'solution',
      key: 'solution',
      width: 200,
      render: () => {
        const color = '#FF6FB5'
        return (
          <span
            className='inline-flex items-center gap-1 px-3 rounded-full fs-12 whitespace-nowrap'
            style={{
              border: `1px solid ${color}`,
              color: color
            }}
          >
            LPR
          </span>
        )
      }
    },
    {
      title: 'Stream Status',
      dataIndex: 'stream_status',
      key: 'stream_status',
      width: 200,
      render: (_, record) => {
        const color = record.camera.is_online ? '#66AEFF' : '#E94C4C'
        return (
          <span
            className='inline-flex items-center gap-1 px-3 rounded-full fs-12 whitespace-nowrap'
            style={{
              border: `1px solid ${color}`,
              color: color
            }}
          >
            {record.camera.is_online ? 'Connect' : 'Disconnect'}
          </span>
        )
      }
    },
    // {
    //   title: 'Device Status',
    //   dataIndex: 'device_status',
    //   key: 'device_status',
    //   width: 200,
    //   render: (item) => {
    //     if (item) return item
    //     return '-'
    //   }
    // },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 200,
      render: (_, record) => {
        if (record.camera.ip_address) return record.camera.ip_address
        return '-'
      }
    },
  ];

  if (isError) return <Empty description="เกิดข้อผิดพลาดในการโหลดข้อมูล" />

  return (
    <Table<RandomOnlineData>
      key={'key'}
      rowKey="id"
      columns={columns}
      dataSource={data?.data || []}
      size='middle'
      loading={isLoading}
      pagination={{
        total: data?.count || 0,
        showSizeChanger: true,
        onChange: (page, pageSize) => console.log(page, pageSize),
        locale: { items_per_page: '/ หน้า' }
      }}
      scroll={{ x: 'max-content' }}
      onRow={(record) => {
        return {
          className: 'cursor-pointer',
          onClick: () => dispatch(setCCTVModalOpen({ open: true, camera_id: record.camera.id }))
        }
      }}
    />
  )
}

export default React.memo<Props>(TableCCTVData)
