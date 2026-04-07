"use client"
import React from 'react'
import { Button, ConfigProvider, Table, TableProps } from 'antd';

interface Props {

}

interface DataType {
  key: string;
  first_name: string;
  last_name: string;
  recent_school: string;
  is_adult: "YES" | "NO";
  joined_date: string;
  leaved_date: string;
}

const TableScreen: React.FC<Props> = (props) => {
  const { } = props
  // MOCK DATA
  const data: DataType[] = [
    {
      key: '1',
      first_name: 'John',
      last_name: 'Brown',
      recent_school: 'King Mongkut\'s University of Technology Thonburi',
      is_adult: "YES",
      joined_date: '2022-01-01',
      leaved_date: '2022-12-31',
    },
    {
      key: '2',
      first_name: 'Jim',
      last_name: 'Green',
      recent_school: 'Assumption University',
      is_adult: "YES",
      joined_date: '2022-01-01',
      leaved_date: '2022-12-31',
    },
    {
      key: '3',
      first_name: 'Joe',
      last_name: 'Black',
      recent_school: 'Chulalongkorn University',
      is_adult: "NO",
      joined_date: '2022-01-01',
      leaved_date: '2022-12-31',
    },
  ];
  // In real case, this data should be fetched from API and stored in Redux or local state
  const columns: TableProps<DataType>['columns'] = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
      width: 200,
      render: (value) => {
        if (value) {
          return value
        }
        return '-'
      },
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
      width: 200,
      render: (value) => {
        if (value) {
          return value
        }
        return '-'
      },
    },
    {
      title: 'Recent School',
      dataIndex: 'recent_school',
      key: 'recent_school',
      width: 300,
      render: (value) => {
        if (value) {
          return value
        }
        return '-'
      },
    },
    {
      title: 'Is Adult',
      dataIndex: 'is_adult',
      key: 'is_adult',
      width: 100,
      align: 'center',
      render: (value) => {
        if (value) {
          return value
        }
        return '-'
      },
    },
    {
      title: 'Joined Date',
      dataIndex: 'joined_date',
      key: 'joined_date',
      width: 150,
      align: 'center',
      render: (value) => {
        if (value) {
          return value
        }
        return '-'
      },
    },
    {
      title: 'Leaved Date',
      dataIndex: 'leaved_date',
      key: 'leaved_date',
      width: 150,
      align: 'center',
      render: (value) => {
        if (value) {
          return value
        }
        return '-'
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      align: 'center',
      render: () => {
        return (
          <Button
            type='primary'
          >
            Edit
          </Button>
        )
      }
    },
  ];

  return (
    <ConfigProvider>
      <Table<DataType>
        columns={columns}
        dataSource={data}
        pagination={{
          defaultCurrent: 1,
          defaultPageSize: 10,
          current: 1,
          pageSize: 10,
          total: data.length,
          onChange: (page: number, pageSize: number) => console.log(page, pageSize),
          showSizeChanger: true,
          position: ['bottomRight'],
          showTotal: (total: number, range: [number, number]) => {
            return `${range[0]}-${range[1]} ของ ${total} รายการ`
          },
          locale: { items_per_page: "/ หน้า" }
        }}
        scroll={{ x: 1600 }}
      />
    </ConfigProvider>
  )
}

export default React.memo<Props>(TableScreen)
