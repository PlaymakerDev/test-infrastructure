import { MobileDailyCountData, MobileMasterDepartmentByTIDData } from '@/types/tracking/detail-api'
import { fmtNumber } from '@/utils/formatNumber'
import { Col, Empty, Row, Skeleton } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

interface Props {
  departmentData?: MobileMasterDepartmentByTIDData
  countData?: MobileDailyCountData
  isCountLoading?: boolean
  isCountError?: boolean
}

const MobileDetailCard: React.FC<Props> = (props) => {
  const { departmentData, countData, isCountLoading, isCountError } = props

  const renderCountContent = useMemo(() => {
    if (isCountLoading) return <Skeleton loading={isCountLoading} active paragraph={{ rows: 5 }} />
    if (isCountError) return <Empty description="ไม่พบข้อมูล" />
    return (
      <section>
        <div className='flex flex-col gap-1 mb-2.5'>
          <p className='text-gray-500'>จำนวนครั้งที่จัดตั้งประจำปี</p>
          <p>{fmtNumber(Number(countData?.actual)) || 0} ครั้ง</p>
        </div>
        <div className='flex flex-col gap-1 mb-2.5'>
          <p className='text-gray-500'>จำนวนรถเข้าชั่ง</p>
          <p className='text-blue-500'>{fmtNumber(Number(countData?.sum_total)) || 0} ครั้ง</p>
        </div>
        <div className='flex flex-col gap-1 mb-2.5'>
          <p className='text-gray-500'>จำนวนรถน้ำหนักรวมเกิน</p>
          <p className='text-red-500'>{fmtNumber(Number(countData?.sum_total_over)) || 0} คัน</p>
        </div>
        <div className='flex flex-col gap-1 mb-2.5'>
          <p className='text-gray-500'>จำนวนรถน้ำหนักเพลาเกิน</p>
          <p className='text-orange-500'>{fmtNumber(Number(countData?.weight_axis_over_count)) || 0} คัน</p>
        </div>
        {/* <div className='flex flex-col gap-1 mb-2.5'>
          <p className='text-gray-500'>จำนวนการยอมรับน้ำหนัก</p>
          <p className='text-shadow-teal-500'>25 คัน</p>
        </div>
        <div className='flex flex-col gap-1 mb-2.5'>
          <p className='text-gray-500'>จำนวนการดำเนิคดี</p>
          <p className='text-pink-500'>2 คัน</p>
        </div> */}
      </section>
    )
  }, [isCountLoading, isCountError, countData])

  return (
    <div className="h-full rounded-lg p-5 bg-(--dark-black)">
      <h3 className='text-(--yellow)'>ข้อมูลหน่วยจัดตั้งเคลื่อนที่</h3>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
            <h3 className='text-(--yellow) mb-3'>ข้อมูลสายทาง</h3>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>รหัสสายทาง</p>
                <p>{departmentData?.way_id || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>ชื่อสายทาง</p>
                <p>{departmentData?.way_name || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>อำเภอ</p>
                <p>{departmentData?.district || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จังหวัด</p>
                <p>{departmentData?.province || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>กม. เริ่มต้น</p>
                <p>{departmentData?.km_from || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>กม. สิ้นสุด</p>
                <p>{departmentData?.km_to || '-'}</p>
              </div>
            </section>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
            <h3 className='text-(--yellow) mb-3'>ข้อมูลหน่วยจัดตั้ง</h3>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>ขื่อหน่วยชั่งยานพาหนะ</p>
                <p>{departmentData?.dept_province || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>การร่วมบูรณาการ</p>
                <p>{departmentData?.collaboration || '-'}</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>วันที่และเวลาจัดตั้งล่าสุด</p>
                <p>{dayjs(departmentData?.create_date, 'DD/MM/BBBB').format('DD MMM BBBB')} {departmentData?.time_from} น.</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>วันที่และเวลาสิ้นสุดล่าสุด</p>
                <p>{dayjs(departmentData?.create_date, 'DD/MM/BBBB').format('DD MMM BBBB')} {departmentData?.time_to} น.</p>
              </div>
            </section>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
            <h3 className='text-(--yellow) mb-3'>ประวัติการจัดตั้ง</h3>
            {renderCountContent}
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileDetailCard)
