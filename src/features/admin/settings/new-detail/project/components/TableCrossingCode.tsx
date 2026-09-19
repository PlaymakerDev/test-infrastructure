import { APIResponseCameraCrossingCode, CameraCrossingIndexCode } from '@/types/manage/project-detail-api'
import { ConfigProvider, Table, TableProps } from 'antd'
import React from 'react'

interface Props {
  data?: CameraCrossingIndexCode[]
}

const TableCrossingCode: React.FC<Props> = (props) => {
  const { data } = props

  const columns: TableProps<CameraCrossingIndexCode>['columns'] = [
    {
      title: 'ลำดับ',
      dataIndex: 'no',
      key: 'no',
      width: 100,
      render: (_, record, index) => index + 1,
    },
    {
      title: 'ชื่ออุปกรณ์',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 300,
      render: (text) => {
        if (text) return text
        return '-'
      },
    },
    {
      title: 'Crossingcode',
      dataIndex: 'crossing_index_code',
      key: 'crossing_index_code',
      width: 300,
      render: (text) => {
        if (text) return text
        return '-'
      },
    },
  ]

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
      <Table<CameraCrossingIndexCode>
        rowKey="key"
        columns={columns}
        dataSource={data}
        size='medium'
        pagination={{
          locale: { items_per_page: '/ หน้า' }
        }}
        scroll={{ x: 'max-content' }}
      />
    </ConfigProvider>
  )
}

export default React.memo<Props>(TableCrossingCode)
