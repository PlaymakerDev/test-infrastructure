import { Col, Empty, Row, Skeleton } from 'antd'
import React, { useMemo } from 'react'
import { TbCalendarStats, TbCommand } from "react-icons/tb";
import { useUpcomingSummary } from '../../../hooks/useUpcomingSummary';

interface Props {

}

const DisplayStatCard: React.FC<Props> = (props) => {
  const { } = props

  const { data, isLoading, isError } = useUpcomingSummary()

  const renderSummary = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <>
        <TbCommand className='fs-22 text-teal-500 mb-1' />
        <h4 className='text-teal-500 mb-1'>ตารางเวลา</h4>
        <p className='mb-0.5'><span className='fs-18 font-bold'>{data?.data?.count?.settings_count || 0}</span> <span className='fs-14'>คำสั่งใหม่</span></p>
        <p className='fs-12 text-gray-400 mb-0'>{data?.data?.count?.most_bureau || '-'} ({data?.data?.count?.most_bureau_percent || 0}%)</p>
      </>
    )
  }, [isLoading, isError, data])

  const renderUpcoming = useMemo(() => {
    if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
    if (isError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <>
        <TbCalendarStats className='fs-22 text-lime-500 mb-1' />
        <h4 className='text-lime-500 mb-1'>คำสั่งที่กำลังจะมาถึง</h4>
        <p className='fs-18 font-bold mb-0.5'>{data?.data?.upcoming?.setting_type_name || '-'}</p>
        <p className='fs-12 text-gray-400 mb-0'>{data?.data?.upcoming?.solution_name || '-'}</p>
      </>
    )
  }, [isLoading, isError, data])


  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
        <div className='h-full bg-[#66AEFF1A] border border-teal-500 py-3 px-5 rounded-lg'>
          {renderSummary}
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={6}>
        <div className='h-full bg-[#66AEFF1A] border border-lime-500 py-3 px-5 rounded-lg'>
          {renderUpcoming}
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(DisplayStatCard)
