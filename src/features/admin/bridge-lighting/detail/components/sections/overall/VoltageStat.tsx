import { APIResponsePostPmChart } from '@/types/bridge-lighting/overall-api'
import { Col, Row } from 'antd'
import React from 'react'
import { TbBolt } from 'react-icons/tb'

interface Props {
  pmChartData?: APIResponsePostPmChart
  isPmChartSuccess?: boolean
}

const VoltageStat: React.FC<Props> = (props) => {
  const { pmChartData, isPmChartSuccess } = props
  const currentData = pmChartData?.[pmChartData.length - 1]

  if (!isPmChartSuccess) return null

  return (
    <div className='flex-1 min-h-0 flex flex-col bg-(--dark-black)/80 backdrop-blur-xs rounded-lg p-5'>
      <section>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={9} lg={24} xl={24} xxl={9} xxxl={9}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-(--yellow)'>
              <div className='flex items-start gap-2'>
                <TbBolt className='fs-22 text-(--yellow) shrink-0' />
                <h4 className='text-(--yellow) mb-0'>Voltage</h4>
              </div>
              <div className='mt-1.5'>
                <p><span className='fs-12 text-(--yellow)'>Avg</span> <span className='fs-18 font-bold'>{currentData?.v_avg || '-'}</span> <span className='fs-12'>V</span></p>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-(--yellow)'>
              <h4 className='text-(--yellow) mb-0'>Phase 1</h4>
              <p><span className='fs-18 font-bold'>{currentData?.v_l1 || '-'}</span> <span className='fs-12'>V</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-(--yellow)'>
              <h4 className='text-(--yellow) mb-0'>Phase 2</h4>
              <p><span className='fs-18 font-bold'>{currentData?.v_l2 || '-'}</span> <span className='fs-12'>V</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-(--yellow)'>
              <h4 className='text-(--yellow) mb-0'>Phase 3</h4>
              <p><span className='fs-18 font-bold'>{currentData?.v_l3 || '-'}</span> <span className='fs-12'>V</span></p>
            </div>
          </Col>
        </Row>
      </section>
      <section className='mt-3'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={9} lg={24} xl={24} xxl={9} xxxl={9}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
              <div className='flex items-start gap-2'>
                <TbBolt className='fs-22 text-blue-500 shrink-0' />
                <h4 className='text-blue-500 mb-0'>Current</h4>
              </div>
              <div className='mt-1.5'>
                <p><span className='fs-12 text-blue-500'>Avg</span> <span className='fs-18 font-bold'>{currentData?.i_avg || '-'}</span> <span className='fs-12'>A</span></p>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
              <h4 className='text-blue-500 mb-0'>Phase 1</h4>
              <p><span className='fs-18 font-bold'>{currentData?.i_l1 || '-'}</span> <span className='fs-12'>A</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
              <h4 className='text-blue-500 mb-0'>Phase 2</h4>
              <p><span className='fs-18 font-bold'>{currentData?.i_l2 || '-'}</span> <span className='fs-12'>A</span></p>
            </div>
          </Col>
          <Col xs={24} sm={8} md={5} lg={8} xl={8} xxl={5} xxxl={5}>
            <div className='h-full bg-[#66AEFF1A] border-2 rounded-lg px-4 py-2 border-blue-500'>
              <h4 className='text-blue-500 mb-0'>Phase 3</h4>
              <p><span className='fs-18 font-bold'>{currentData?.i_l3 || '-'}</span> <span className='fs-12'>A</span></p>
            </div>
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(VoltageStat)
