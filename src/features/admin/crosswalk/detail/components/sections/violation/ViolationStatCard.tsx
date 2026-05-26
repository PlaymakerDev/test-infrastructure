import { Card, Col, Row, Tag } from 'antd'
import React from 'react'
import { TbHandClick, TbTruck, TbUser, TbUserX } from "react-icons/tb";

interface Props {

}

const ViolationStatCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <TbUser className='fs-22 text-white mb-1' />
          <h4 className='text-white mb-1'>คนข้ามทั้งหมด</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>26</span> <span className='fs-14'>คน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 18:35:29 น. </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <TbHandClick className='fs-22 text-blue-500 mb-1' />
          <h4 className='text-blue-500 mb-1'>การกดปุ่ม</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>13</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 10:19:07 น. </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <TbUserX className='fs-22 text-red-500 mb-1' />
          <h4 className='text-red-500 mb-1'>คนข้ามฝ่าฝืนสัญญาณไฟ</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 12:45:32 น. </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <TbTruck className='fs-22 text-orange-500 mb-1' />
          <h4 className='text-orange-500 mb-1'>รถข้ามฝ่าฝืนสัญญาณไฟ</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>คัน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 12:45:32 น. </p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ViolationStatCard)
