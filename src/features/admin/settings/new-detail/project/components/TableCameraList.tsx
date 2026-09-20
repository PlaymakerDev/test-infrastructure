import React from 'react'
import { APIResponseSolutionCameraList, SolutionCameraList } from '@/types/manage/project-detail-api'
import { ConfigProvider, Table, TableProps } from 'antd'

interface Props {
  data?: APIResponseSolutionCameraList | null
}

const TableCameraList: React.FC<Props> = (props) => {
  const { data } = props

  const columns: TableProps<SolutionCameraList>['columns'] = [
    {
      title: 'เลือก',
      dataIndex: 'select',
      key: 'select',
      width: 100,
    },
    {
      title: 'ชื่ออุปกรณ์',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 400,
    },
    {
      title: 'สถานะการเลือกใช้งาน',
      dataIndex: 'solution_id',
      key: 'solution_id',
      width: 200,
    },
    {
      title: 'สถานะการเชื่อมต่อ',
      dataIndex: 'curl_status',
      key: 'curl_status',
      width: 200,
    },
    {
      title: 'Live Stream',
      dataIndex: 'hls_url',
      key: 'hls_url',
      width: 200,
    },
  ];


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
      <Table<SolutionCameraList>
        rowKey="id"
        columns={columns}
        dataSource={data || []}
        size='medium'
        // loading={isLoading}
        pagination={{
          locale: { items_per_page: '/ หน้า' }
        }}
        scroll={{ x: 'max-content' }}
      />
    </ConfigProvider>

  )
}

export default React.memo<Props>(TableCameraList)
