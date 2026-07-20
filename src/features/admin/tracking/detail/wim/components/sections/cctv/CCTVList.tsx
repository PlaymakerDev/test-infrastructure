import { CCTVList as CCTVListItem } from '@/types/tracking/overall-api'
import { Col, Empty, Pagination, Row, Skeleton } from 'antd'
import React from 'react'
import { CardCCTVData } from '../../../components'

interface Props {
  data?: CCTVListItem[]
  isLoading?: boolean
  isError?: boolean
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number, pageSize: number) => void
}

const CCTVList: React.FC<Props> = (props) => {
  const { data, isLoading, isError, page, pageSize, total, onPageChange } = props

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />
  if (!data || data.length === 0) return <Empty description="ไม่พบข้อมูล" />

  return (
    <div>
      <Row gutter={[16, 16]}>
        {data.map((item) => (
          <Col key={item.id} xs={24} sm={24} md={24} lg={12} xl={8} xxl={6} xxxl={6}>
            <CardCCTVData item={item} />
          </Col>
        ))}
      </Row>
      <div className='mt-5 flex justify-end'>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total ?? 0}
          onChange={onPageChange}
          showSizeChanger
          pageSizeOptions={[10, 20, 50, 100]}
          locale={{ items_per_page: '/ หน้า' }}
          showTotal={(t, range) => `${range[1] - range[0] + 1} จาก ${t}`}
        />
      </div>
    </div>
  )
}

export default React.memo<Props>(CCTVList)
