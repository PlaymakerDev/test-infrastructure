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
import { getTrackingMobileDailyCountAPI } from '@/services/routes/TrackingDetailService';
import dayjs from 'dayjs';
import { MobileMasterDepartmentByTIDData } from '@/types/tracking/detail-api';

interface Props {
  id: string[] | string | number | undefined;
  departmentData?: MobileMasterDepartmentByTIDData
  isDepartmentLoading?: boolean
  isDepartmentError?: boolean
}

const OverallSection: React.FC<Props> = (props) => {
  const { id, departmentData, isDepartmentLoading, isDepartmentError } = props

  const {
    data: countData,
    isLoading: isCountLoading,
    isError: isCountError
  } = useQuery({
    queryKey: ['tracking_overall_mobile_daily_status_count'],
    queryFn: () => getTrackingMobileDailyCountAPI({
      start_date: dayjs().format('YYYY-MM-DD'),
      end_date: dayjs().format('YYYY-MM-DD'),
      tid: String(id)
    }),
    enabled: !!id,
  })

  const renderDetailContent = useMemo(() => {
    if (isDepartmentLoading) return <Skeleton loading={isDepartmentLoading} active paragraph={{ rows: 10 }} />
    if (isDepartmentError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={12} xxxl={12}>
          <MobileDetailCard
            departmentData={departmentData}
            countData={countData?.data.data}
            isCountLoading={isCountLoading}
            isCountError={isCountError}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={12} xxl={6} xxxl={6}>
          <MobileDetailImage
            departmentData={departmentData}
          />
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={6} xxxl={6}>
          <MobileDetailMap
            departmentData={departmentData}
          />
        </Col>
      </Row>
    )
  }, [
    departmentData,
    countData,
    isDepartmentLoading,
    isDepartmentError,
    isCountLoading,
    isCountError
  ])

  const renderMobileStatContent = useMemo(() => {
    if (isCountLoading) return <Skeleton loading={isCountLoading} active paragraph={{ rows: 10 }} />
    if (isCountError) return <Empty description="ไม่พบข้อมูล" />
    return <MobileStatCard data={countData?.data.data} />
  }, [countData, isCountLoading, isCountError])

  return (
    <>
      <section>
        {renderDetailContent}
      </section>
      <section className='mt-5'>
        {renderMobileStatContent}
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
