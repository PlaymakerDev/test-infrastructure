import { Table, TableProps } from 'antd'
import React from 'react'

interface Props {

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
  const { } = props

  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'ลำดับ',
      dataIndex: 'key',
      key: 'key',
      width: 100,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'ชื่อกล้อง',
      dataIndex: 'camera_name',
      key: 'camera_name',
      width: 300,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'กม.ที่',
      dataIndex: 'sta',
      key: 'sta',
      width: 100,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'การทำงาน',
      dataIndex: 'solution',
      key: 'solution',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'Stream Status',
      dataIndex: 'stream_status',
      key: 'stream_status',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'Device Status',
      dataIndex: 'device_status',
      key: 'device_status',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 200,
      render: (item) => {
        if (item) return item
        return '-'
      }
    },
  ];

  return (
    <Table<DataType>
      key={'key'}
      rowKey="id"
      columns={columns}
      dataSource={[]}
      size='middle'
      loading={false}
      pagination={{
        showSizeChanger: true,
        onChange: (page, pageSize) => console.log(page, pageSize),
        locale: { items_per_page: '/ หน้า' }
      }}
      scroll={{ x: 'max-content' }}
    />
  )
}

export default React.memo<Props>(TableCCTVData)
