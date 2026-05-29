import { Col, Row } from 'antd'
import React from 'react'
import { TbCarCrash, TbAlertTriangle, TbArrowIteration, TbParkingOff } from 'react-icons/tb'

interface Props {}

const EventStatCard: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <TbCarCrash className='fs-22 text-white mb-1' />
          <h4 className='text-white mb-1'>เหตุการณ์ทั้งหมด</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>77</span> <span className='fs-14'>เหตุการณ์</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ล่าสุด : 18:14:21 น.</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <TbArrowIteration className='fs-22 text-red-500 mb-1' />
          <h4 className='text-red-500 mb-1'>ขับรถย้อนศร</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>13</span> <span className='fs-14'>ครั้ง</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ล่าสุด : 12:45:32 น.</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <TbParkingOff className='fs-22 text-orange-500 mb-1' />
          <h4 className='text-orange-500 mb-1'>รถจอดกีดขวาง</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>21</span> <span className='fs-14'>ครั้ง</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ล่าสุด : 12:45:32 น.</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={4}>
        <div className='h-full bg-[#66AEFF1A] border border-yellow-500 py-3 px-5 rounded-lg'>
          <TbAlertTriangle className='fs-22 text-yellow-500 mb-1' />
          <h4 className='text-yellow-500 mb-1'>อุบัติเหตุ</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>5</span> <span className='fs-14'>ครั้ง</span></p>
          <p className='fs-12 text-gray-400 mb-0'>ล่าสุด : 10:22:15 น.</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(EventStatCard)
