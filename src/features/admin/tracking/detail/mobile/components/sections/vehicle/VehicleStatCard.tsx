import { fmtNumber } from '@/utils/formatNumber';
import { Col, Empty, Row, Skeleton } from 'antd'
import React from 'react'
import { TbTruck, TbUserShield } from "react-icons/tb";
import { useMobileDailyCount } from '../../../hooks'
import { useMobileContext } from '../../../context'

interface Props {

}

const VehicleStatCard: React.FC<Props> = () => {
  const { id, searchParams } = useMobileContext()

  const { data, isLoading, isError } = useMobileDailyCount(id as string | number | undefined, {
    start_date: searchParams.start_date,
    end_date: searchParams.end_date,
  })
  const countData = data?.data.data

  const closeStation = Number(countData?.total_station_count) - Number(countData?.open_station_count)

  if (isLoading) return <Skeleton loading={isLoading} active paragraph={{ rows: 10 }} />
  if (isError) return <Empty description="ไม่พบข้อมูล" />

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-2xl'>
          <TbTruck className='fs-22 text-blue-500 mb-1' />
          <h4 className='text-blue-500 mb-1'>รถเข้าชั่งทั้งหมด</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(countData?.sum_total)) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(Number(countData?.max_grossweight_not_over), 1) || 0} ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-2xl'>
          <TbTruck className='fs-22 text-red-500 mb-1' />
          <h4 className='text-red-500 mb-1'>รถน้ำหนักเกิน</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(countData?.sum_total_over)) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(Number(countData?.max_grossweight_over), 1) || 0} ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-2xl'>
          <TbTruck className='fs-22 text-orange-500 mb-1' />
          <h4 className='text-orange-500 mb-1'>รถน้ำหนักเพลาเกิน</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(Number(countData?.weight_axis_over_count)) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(Number(countData?.axis_over_gross_weight), 1) || 0} ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={5}>
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-2xl'>
          <TbUserShield className='fs-22 mb-1' />
          <h4 className='mb-1'>สถานะการตรวจสอบน้ำหนักเคลื่อนที่</h4>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-blue-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-blue-500 mb-0'>{fmtNumber(Number(countData?.open_station_count)) || 0} เปิดด่าน</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>{fmtNumber(closeStation) || 0} ปิดด่าน</p>
            </div>
          </div>
        </div>
      </Col>

    </Row>
  )
}

export default React.memo<Props>(VehicleStatCard)
