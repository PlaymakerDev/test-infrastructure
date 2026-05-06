import { Col, Row } from 'antd'
import React from 'react'
import { TbBox, TbCar, TbTruck } from 'react-icons/tb'

interface Props {

}

const OverallStatCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-lg p-5 border-yellow-500">
          <TbTruck className='fs-24 text-yellow-500 mb-1' />
          <h3 className='text-yellow-500'>AADT</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-lg p-5 border-yellow-500">
          <TbCar className='fs-24 text-yellow-500 mb-1' />
          <h3 className='text-yellow-500'>PCU Average</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
        <div className="bg-[#FCD1161A] border-2 rounded-lg p-5 border-yellow-500">
          <TbBox className='fs-24 text-yellow-500 mb-1' />
          <h3 className='text-yellow-500'>รถน้ำหนักเกิน 10%</h3>
          <p><span className='fs-24 font-bold'>3,632.70</span> คัน</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(OverallStatCard)
