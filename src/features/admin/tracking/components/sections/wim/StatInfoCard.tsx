import { Card, Col, Row, Tag } from 'antd'
import React from 'react'
import { TbFlag, TbTruck, TbUserShield, TbVideo } from "react-icons/tb";

interface Props {

}

const StatInfoCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card className='h-full border-yellow-500!'>
          <TbFlag className='fs-24 text-yellow-500' />
          <h3 className='text-yellow-500'>WIM ทั้งหมด</h3>
          <p><span className='fs-18 font-bold'>5</span> คัน</p>
          <p className='fs-12 text-gray-400'>ภาคตะวันออก (94.3%)</p>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card className='h-full border-blue-500!'>
          <TbTruck className='fs-24 text-blue-500' />
          <h3 className='text-blue-500'>รถเข้าชั่งทั้งหมด</h3>
          <p><span className='fs-18 font-bold'>5</span> คัน</p>
          <p className='fs-12 text-gray-400'>น้ำหนักที่ชั่งได้สูงสุด/คัน (173.4 ตัน)</p>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card className='h-full border-red-500!'>
          <TbTruck className='fs-24 text-red-500' />
          <h3 className='text-red-500'>รถน้ำหนักเกิน</h3>
          <p><span className='fs-18 font-bold'>5</span> คัน</p>
          <p className='fs-12 text-gray-400'>น้ำหนักที่ชั่งได้สูงสุด/คัน (184.2 ตัน)</p>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card className='h-full border-orange-500!'>
          <TbTruck className='fs-24 text-orange-500' />
          <h3 className='text-orange-500'>รถน้ำหนักเกิน 10%</h3>
          <p><span className='fs-18 font-bold'>5</span> คัน</p>
          <p className='fs-12 text-gray-400'>น้ำหนักที่ชั่งได้สูงสุด/คัน (192.1 ตัน)</p>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card className='h-full'>
          <TbUserShield className='fs-24' />
          <h3>สถานะด่านตรวจสอบน้ำหนักเคลื่อนที่</h3>
          <div className='grid grid-cols-2 gap-3'>
            <div className='border border-blue-500 px-3 py-1.5 text-center rounded-3xl'>
              <p className='fs-12 text-blue-500'>5 เปิดด่าน</p>
            </div>
            <div className='border border-red-500 px-3 py-1.5 text-center rounded-3xl'>
              <p className='fs-12 text-red-500'>5 เปิดด่าน</p>
            </div>
          </div>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
        <Card className='h-full'>
          <TbVideo className='fs-24' />
          <h3>เปรียบเทียบแผน-ผล</h3>
          <div className='grid grid-cols-3 gap-3'>
            <div className='border border-yellow-500 px-3 py-1.5 text-center rounded-3xl'>
              <p className='fs-12 text-yellow-500'>5 แผนผล</p>
            </div>
            <div className='border border-blue-500 px-3 py-1.5 text-center rounded-3xl'>
              <p className='fs-12 text-blue-500'>5 ผล</p>
            </div>
            <div className='border border-red-500 px-3 py-1.5 text-center rounded-3xl'>
              <p className='fs-12 text-red-500'>5 ส่วนต่าง</p>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(StatInfoCard)
