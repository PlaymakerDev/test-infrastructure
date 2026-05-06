import { Card, Col, Row, Tag } from 'antd'
import React from 'react'
import { TbFlag, TbTruck, TbVideo } from "react-icons/tb";

interface Props {

}

const WIMInfoCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-yellow-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbFlag className='fs-22 text-yellow-500 shrink-0' />
            <h4 className='text-yellow-500 mb-0'>WIM ทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ภาคตะวันออก (94.3%)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-blue-500 shrink-0' />
            <h4 className='text-blue-500 mb-0'>รถเข้าชั่งทั้งหมด</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (173.4 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-red-500 shrink-0' />
            <h4 className='text-red-500 mb-0'>รถน้ำหนักเกิน</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (184.2 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-orange-500 shrink-0' />
            <h4 className='text-orange-500 mb-0'>รถน้ำหนักเกิน 10%</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>น้ำหนักที่ชั่งได้สูงสุด/คัน (192.1 ตัน)</p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbFlag className='fs-22 shrink-0' />
            <h4 className='mb-0'>สถานะ WIM</h4>
          </div>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-green-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-green-500 mb-0'>25 เปิดด่าน</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-yellow-500 mb-0'>18 ระบบปิดด้อย</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>14 ไม่สะท้อน</p>
            </div>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbVideo className='fs-22 shrink-0' />
            <h4 className='mb-0'>สถานะกล้อง</h4>
          </div>
          <div className='flex flex-wrap gap-2'>
            <div className='bg-[#66AEFF1A] border border-yellow-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-yellow-500 mb-0'>260 ทั้งหมด</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-blue-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-blue-500 mb-0'>110 ออนไลน์</p>
            </div>
            <div className='bg-[#66AEFF1A] border border-red-500 px-3 py-1 rounded-3xl'>
              <p className='fs-12 text-red-500 mb-0'>150 ออฟไลน์</p>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(WIMInfoCard)
