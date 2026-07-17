import React, { useMemo } from 'react'
import { Col, Empty, Row, Skeleton } from 'antd'
import {
  MobileDetailCard,
  MobileDetailImage,
  MobileDetailMap,
  MobileStatCard,
  OverallDataDisplaySection
} from '../components'
import { useQuery } from '@tanstack/react-query';
import { getTrackingMobileMasterDepartmentByTIDAPI } from '@/services/routes/TrackingDetailService';

interface Props {
  id: string[] | string | number | undefined;
}

const OverallSection: React.FC<Props> = (props) => {
  const { id } = props

  const { data, isLoading, isError } = useQuery({
    queryKey: ['weight_mobile_master_department', id],
    queryFn: () => getTrackingMobileMasterDepartmentByTIDAPI(String(id)),
    enabled: !!id,
  })

  const renderDetailContent = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12} xxxl={12}>
          <MobileDetailCard
            data={data?.data.data}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={6} xxxl={6}>
          <MobileDetailImage
            data={data?.data.data}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={6} xxxl={6}>
          <MobileDetailMap
            data={data?.data.data}
          />
        </Col>
      </Row>
    )
  }, [data, isLoading, isError])

  return (
    <>
      <section>
        {renderDetailContent}
      </section>
      <section className='mt-5'>
        <MobileStatCard />
      </section>
      <section className='mt-5'>
        <OverallDataDisplaySection
          id={id}
        />
      </section>
    </>
  )
}

export default React.memo<Props>(OverallSection)
