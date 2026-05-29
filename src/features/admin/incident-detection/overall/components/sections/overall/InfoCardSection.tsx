import { Col, Row } from 'antd'
import React from 'react'
import { TbCarCrash, TbShield } from 'react-icons/tb'

interface Props {}

const InfoCardSection: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#FFB1001A] border-2 rounded-lg p-5 border-(--yellow)'>
          <TbCarCrash className='fs-24 text-(--yellow) mb-1' />
          <h3 className='text-(--yellow)'>กล้องวิเคราะห์ในระบบทั้งหมด</h3>
          <p><span className='fs-24 font-bold'>795</span> จุดติดตั้ง</p>
          <p className='fs-11 text-gray-400'>Active : 485 (62.4%)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#05F2DB1A] border-2 rounded-lg p-5 border-teal-500'>
          <TbShield className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>ในค้ำ</h3>
          <p><span className='fs-24 font-bold'>582</span> จุดติดตั้ง</p>
          <p className='fs-11 text-gray-400'>Active : 459 (82.1%)</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='h-full bg-[#9797971A] border-2 rounded-lg p-5 border-gray-500'>
          <TbShield className='fs-24 text-gray-500 mb-1' />
          <h3 className='text-gray-500'>หมดค้ำ</h3>
          <p><span className='fs-24 font-bold'>213</span> จุดติดตั้ง</p>
          <p className='fs-11 text-gray-400'>Active : 26 (12.5%)</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
