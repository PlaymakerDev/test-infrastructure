"use client"
import React from 'react'
import { Table } from 'antd'

interface Props {
}

const LPRList: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Table
      rowKey={'key'}
      columns={[]}
      dataSource={[]}
      loading={false}
      pagination={false}
      size='middle'
      scroll={{ x: 1200 }}
    // onRow={(row) => ({
    //   onClick: () => {
    //     if (row.type === 'data') router.push(`/admin/lpr/detail/:id
    //   },
    //   className: row.type === 'data' ? 'cursor-pointer' : '',
    // })}
    />
  )
}

export default React.memo<Props>(LPRList)
