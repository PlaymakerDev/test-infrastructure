import { Col, Empty, Pagination, Row, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { CardDetectionVehicle } from '../../../components'
import { APIResponseLPRPlateList } from '@/types/lpr/new-lpr-api'

interface Props {
  data?: APIResponseLPRPlateList
  isLoading?: boolean
  isError?: boolean
  page: number
  limit: number
  onPageChange: (page: number, limit: number) => void
}

const GridDetectionData: React.FC<Props> = (props) => {
  const { data, isLoading, isError, page, limit, onPageChange } = props

  const renderDetectionData = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 4 }} />
    if (isError) return <Empty description="Error loading detection data" />
    if (!data?.res_data?.length) return <Empty description="No detection data available" />
    return data?.res_data?.map(item => {
      return (
        <Col key={item.id} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} xxxl={6}>
          <CardDetectionVehicle data={item} />
        </Col>
      )
    })
  }, [data, isLoading, isError])

  if (!data?.res_data?.length) return <Empty description="No detection data available" />

  return (
    <>
      <Row gutter={[16, 16]}>
        {renderDetectionData}
      </Row>
      <div className='flex justify-end mt-4'>
        <Pagination
          current={page}
          pageSize={limit}
          total={data?.meta_data?.count}
          showSizeChanger
          onChange={onPageChange}
          locale={{ items_per_page: '/ หน้า' }}
        />
      </div>
    </>
  )
}

export default React.memo<Props>(GridDetectionData)
