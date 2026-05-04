import { Col, Progress, Row } from 'antd'
import React from 'react'

interface Props {

}

const RatioChart: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='bg-[#B8CDB533] p-3 rounded-lg flex flex-col items-center'>
      <Row gutter={[16, 16]}>
        <Col xs={8} sm={8} md={8} lg={8} xl={8} xxl={8}>
          <div className='text-center'>
            <Progress
              type="circle"
              percent={75}
            />
            <h3>CCTV</h3>
          </div>
        </Col>
        <Col xs={8} sm={8} md={8} lg={8} xl={8} xxl={8}>
          <div className='text-center'>
            <Progress
              type="circle"
              percent={75}
            />
            <h3>VMS</h3>
          </div>
        </Col>
        <Col xs={8} sm={8} md={8} lg={8} xl={8} xxl={8}>
          <div className='text-center'>
            <Progress
              type="circle"
              percent={75}
            />
            <h3>Lighting</h3>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default React.memo<Props>(RatioChart)
