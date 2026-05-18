import { Col, Row } from 'antd'
import React from 'react'
import { TbNavigation, TbPlayerPauseFilled, TbTruck, TbTruckDelivery, TbWeight } from 'react-icons/tb'

interface Props {

}

const VehicleStat: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8} lg={8} xl={12} xxl={8} xxxl={8}>
        <div className="h-full bg-[#66AEFF1A] border-2 rounded-lg p-5 border-blue-500">
          <TbNavigation className='fs-24 text-blue-500 mb-1' />
          <h3 className='text-blue-500'>รถในระบบทั้งหมด</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
          <p className='fs-11 text-gray-400'>Active : 262,797 (54.2%)</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={12} xxl={8} xxxl={8}>
        <div className="h-full bg-[#FFB1001A] border-2 rounded-lg p-5 border-yellow-500">
          <TbTruck className='fs-24 text-yellow-500 mb-1' />
          <h3 className='text-yellow-500'>รถบนสายทาง ทช.</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
          <p className='fs-11 text-gray-400'>7.6% ของรถที่ active</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={12} xxl={8} xxxl={8}>
        <div className="h-full bg-[#05F2DB1A] border-2 rounded-lg p-5 border-teal-500">
          <TbTruckDelivery className='fs-24 text-teal-500 mb-1' />
          <h3 className='text-teal-500'>อัตรารถบนสายทาง</h3>
          <p className='fs-24 font-bold'>12.4%</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={12} xxl={8} xxxl={8}>
        <div className="h-full bg-[#B2FF001A] border-2 rounded-lg p-5 border-lime-500">
          <TbTruckDelivery className='fs-24 text-lime-500 mb-1' />
          <h3 className='text-lime-500'>รถกำลังเคลื่อนที่</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
          <p className='fs-11 text-gray-400'>{"Speed > 0 และ < 10 นาที"}</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={12} xxl={8} xxxl={8}>
        <div className="h-full bg-[#FF6A001A] border-2 rounded-lg p-5 border-orange-500">
          <TbPlayerPauseFilled className='fs-24 text-orange-500 mb-1' />
          <h3 className='text-orange-500'>รถจอดนิ่ง</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
          <p className='fs-11 text-gray-400'>{"Speed = 0 และ < 10 นาที"}</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={12} xxl={8} xxxl={8}>
        <div className="h-full bg-[#E94C4C1A] border-2 rounded-lg p-5 border-red-500">
          <TbWeight className='fs-24 text-red-500 mb-1' />
          <h3 className='text-red-500'>รถประวัติน้ำหนักเกิน</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
          <p className='fs-11 text-gray-400'>2.5% ของรถที่ active</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(VehicleStat)
