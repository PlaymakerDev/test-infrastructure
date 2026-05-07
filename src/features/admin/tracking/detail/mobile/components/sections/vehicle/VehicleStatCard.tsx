import { Card, Col, Row, Tag } from 'antd'
import React from 'react'
import { TbCircleCheck, TbFlag, TbGavel, TbTruck, TbUserShield, TbVideo } from "react-icons/tb";

interface Props {

}

const VehicleStatCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={3}>
        <div className='h-full bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-blue-500 mb-1' />
          <h4 className='text-blue-500 mb-1'>รถเข้าชั่งทั้งหมด</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (173.4 ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={3}>
        <div className='h-full bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-red-500 mb-1' />
          <h4 className='text-red-500 mb-1'>รถน้ำหนักเกิน</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (184.2 ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={3}>
        <div className='h-full bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-orange-500 mb-1' />
          <h4 className='text-orange-500 mb-1'>รถน้ำหนักเกิน 10%</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (192.1 ตัน)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={3}>
        <div className='h-full bg-[#66AEFF1A] border border-teal-500 py-3 px-5 rounded-lg'>
          <TbCircleCheck className='fs-22 text-teal-500 mb-1' />
          <h4 className='text-teal-500 mb-1'>การยอมรับน้ำหนัก</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={3}>
        <div className='h-full bg-[#66AEFF1A] border border-pink-500 py-3 px-5 rounded-lg'>
          <TbGavel className='fs-22 text-pink-500 mb-1' />
          <h4 className='text-pink-500 mb-1'>การดำเนินคดี</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={5}>
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <TbUserShield className='fs-22 mb-1' />
          <h4 className='mb-1'>สถานะการตรวจสอบน้ำหนักเคลื่อนที่</h4>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-blue-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-blue-500 mb-0'>638 เปิดด่าน</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>638 ปิดด่าน</p>
            </div>
          </div>
        </div>
      </Col>

    </Row>
  )
}

export default React.memo<Props>(VehicleStatCard)
