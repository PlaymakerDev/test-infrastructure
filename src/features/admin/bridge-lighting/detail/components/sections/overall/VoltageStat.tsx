import { Col, Row } from 'antd'
import React from 'react'
import { TbBolt, TbCloud, TbRainbow, TbThermometer, TbUmbrella, TbWind } from 'react-icons/tb'

interface Props {

}

const VoltageStat: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-(--dark-black)/80 backdrop-blur-xs rounded-[20px] p-6'>
      <section>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={24} md={9} lg={24} xl={24} xxl={9} xxxl={9}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#FCD116]'>
              <div className='flex items-start gap-2'>
                <TbBolt className='fs-24 text-[#FCD116] shrink-0' />
                <h4 className='text-[#FCD116] mb-0'>Voltage</h4>
              </div>
              <div className='mt-1.5'>
                <p><span className='fs-12 text-[#FCD116]'>Avg</span> <span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>V</span></p>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#FCD116]'>
              <h4 className='text-[#FCD116] mb-0'>Phase 1</h4>
              <p><span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>V</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#FCD116]'>
              <h4 className='text-[#FCD116] mb-0'>Phase 2</h4>
              <p><span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>V</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#FCD116]'>
              <h4 className='text-[#FCD116] mb-0'>Phase 3</h4>
              <p><span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>V</span></p>
            </div>
          </Col>
        </Row>
      </section>
      <section className='mt-5'>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={24} md={9} lg={24} xl={24} xxl={9} xxxl={9}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#66AEFF]'>
              <div className='flex items-start gap-2'>
                <TbBolt className='fs-24 text-[#66AEFF] shrink-0' />
                <h4 className='text-[#66AEFF] mb-0'>Current</h4>
              </div>
              <div className='mt-1.5'>
                <p><span className='fs-12 text-[#66AEFF]'>Avg</span> <span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>A</span></p>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#66AEFF]'>
              <h4 className='text-[#66AEFF] mb-0'>Phase 1</h4>
              <p><span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>A</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#66AEFF]'>
              <h4 className='text-[#66AEFF] mb-0'>Phase 2</h4>
              <p><span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>A</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-[20px] px-5 py-3 border-[#66AEFF]'>
              <h4 className='text-[#66AEFF] mb-0'>Phase 3</h4>
              <p><span className='fs-24 font-bold'>229.3</span> <span className='fs-12'>A</span></p>
            </div>
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(VoltageStat)
