import { Card, Col, Row, Tag } from 'antd'
import React from 'react'
import { TbFlag, TbTruck, TbVideo } from "react-icons/tb";
import { useDailyCount } from '../../../hooks';
import { useWIMContext } from '../../../context';
import { fmtNumber } from '@/utils/formatNumber';

interface Props {

}

const VehicleStatCard: React.FC<Props> = () => {
  const { id, stationType, vehicleSearchParams } = useWIMContext()

  const dailyCount = useDailyCount(id as string | number | undefined, stationType, {
    startDate: vehicleSearchParams.start_date,
    endDate: vehicleSearchParams.end_date,
  })

  const totalCamera = Number(dailyCount.data?.camera_online) + (Number(dailyCount.data?.camera_offline))

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-blue-500 mb-1' />
          <h4 className='text-blue-500 mb-1'>รถเข้าชั่งทั้งหมด</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(dailyCount.data?.sum_total) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(dailyCount.data?.max_grossweight_not_over) || 0} ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-red-500 mb-1' />
          <h4 className='text-red-500 mb-1'>รถน้ำหนักเกิน</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(dailyCount.data?.sum_total_over) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(dailyCount.data?.max_grossweight_over) || 0} ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-orange-500 mb-1' />
          <h4 className='text-orange-500 mb-1'>รถน้ำหนักเกิน 10%</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>{fmtNumber(dailyCount.data?.sum_isover_10percent) || 0}</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน ({fmtNumber(dailyCount.data?.max_grossweight_over) || 0} ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={5}>
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <TbFlag className='fs-22 mb-1' />
          <h4 className='mb-1'>สถานะ WIM</h4>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-green-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-green-500 mb-0'>{fmtNumber(dailyCount.data?.normal) || 0} เปิดปกติ</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-yellow-500 mb-0'>{fmtNumber(dailyCount.data?.abnormal) || 0} ระบบขัดข้อง</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>{fmtNumber(dailyCount.data?.wim_disconnected) || 0} ไม่ส่งข้อมูล</p>
            </div>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={5}>
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <TbVideo className='fs-22 mb-1' />
          <h4 className='mb-1'>สถานะกล้อง</h4>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-yellow-500 mb-0'>{fmtNumber(totalCamera) || 0} ทั้งหมด</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-blue-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-blue-500 mb-0'>{fmtNumber(dailyCount.data?.camera_online) || 0} ออนไลน์</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>{fmtNumber(dailyCount.data?.camera_offline) || 0} ออฟไลน์</p>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(VehicleStatCard)
