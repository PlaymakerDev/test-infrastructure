import { Col, Row } from 'antd'
import React from 'react'
import { TbCloud, TbRainbow, TbThermometer, TbUmbrella, TbWind } from 'react-icons/tb'

interface Props { }

const InfoCardSection: React.FC<Props> = () => {
  return (
    <div className='flex-1 min-h-0 flex flex-col bg-black/70 backdrop-blur-xs rounded-lg p-5'>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <div className='h-full bg-[#FFB1001A] border-2 rounded-lg px-4 py-2 border-(--yellow)'>
            <TbRainbow className='fs-24 text-(--yellow) mb-1' />
            <h4 className='text-(--yellow)'>สภาพอากาศโดยรวม</h4>
            <p className='fs-14 font-bold'>ท้องฟ้าโปร่ง มีแสงอาทิตย์ส่อง</p>
          </div>
        </Col>
        <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} xxxl={24}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-teal-500'>
            <TbCloud className='fs-24 text-teal-500 mb-1' />
            <h4 className='text-teal-500'>คุณภาพอากาศ AQI</h4>
            <p className='fs-14 font-bold'>คุณภาพอากาศดี</p>
          </div>
        </Col>
        <Col xs={24} sm={8} md={8} lg={12} xl={8} xxl={8} xxxl={8}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
            <TbThermometer className='fs-24 text-blue-500 mb-1' />
            <h4 className='text-blue-500'>อุณหภูมิ</h4>
            <p className='mb-0.5'><span className='fs-14 font-bold'>4</span> <span className='fs-12'>°C</span></p>        </div>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
            <TbUmbrella className='fs-24 text-blue-500 mb-1' />
            <h4 className='text-blue-500'>ปริมาณน้ำฝน</h4>
            <p className='mb-0.5'><span className='fs-14 font-bold'>4</span> <span className='fs-12'>mm/min</span></p>        </div>
        </Col>
        <Col xs={24} sm={8} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
          <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
            <TbWind className='fs-24 text-blue-500 mb-1' />
            <h4 className='text-blue-500'>ความเร็วลม</h4>
            <p className='mb-0.5'><span className='fs-14 font-bold'>4</span> <span className='fs-12'>km/h</span></p>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default React.memo<Props>(InfoCardSection)