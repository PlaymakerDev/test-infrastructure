import { Col, Row } from 'antd'
import React from 'react'
import { TbHandClick, TbTruck, TbUser, TbUserX } from 'react-icons/tb'

interface Props {

}

const InfoCardSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbUser className='fs-22 text-white shrink-0' />
            <h4 className='text-white mb-0'>คนข้ามทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>26</span> <span className='fs-14'>คน</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 18:35:29 น. </p>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbHandClick className='fs-22 text-blue-500 shrink-0' />
            <h4 className='text-blue-500 mb-0'>การกดปุ่ม</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>13</span> <span className='fs-14'>ครั้ง</span></p>
            <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 10:19:07 น.  </p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbUserX className='fs-22 text-red-500 shrink-0' />
            <h4 className='text-red-500 mb-0'>คนข้ามฝ่าฝืนสัญญาณไฟ</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>9</span> <span className='fs-14'>คน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 12:48:02 น. </p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-orange-500 shrink-0' />
            <h4 className='text-orange-500 mb-0'>รถข้ามฝ่าฝืนสัญญาณไฟ</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>45</span> <span className='fs-14'>คัน</span></p>
            <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 18:14:21 น. </p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-yellow-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-yellow-500 shrink-0' />
            <h4 className='text-yellow-500 mb-0'>ปริมาณจราจรประจำวัน</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>4,972</span> <span className='fs-14'>คัน</span></p>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24}>
        <div className='bg-[#66AEFF1A] border border-lime-400 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbTruck className='fs-22 text-lime-400 shrink-0' />
            <h4 className='text-lime-400 mb-0'>ความเร็วเฉลี่ยประจำวัน</h4>
          </div>
          <div>
            <p className='mb-0.5'><span className='fs-18 font-bold'>67.03</span> <span className='fs-14'>km/h</span></p>
          </div>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
