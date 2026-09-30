import { IconLPR } from '@/components/icon'
import { Col, Row } from 'antd'
import React from 'react'
import { TbBroadcast, TbCar, TbHourglassHigh } from 'react-icons/tb'

interface Props {

}

const ContentCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-white bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <IconLPR size={28} />
            <h3>ตรวจจับป้ายทะเบียนประจำวัน</h3>
          </div>
          <p className='text-white/50'><span className='text-white fs-22 font-bold'>24</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-[#C8FF00] bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <TbBroadcast className='text-[#C8FF00] fs-24' />
            <h3 className='text-[#C8FF00]'>ป้ายทะเบียนเฉลี่ยรายชั่วโมง</h3>
          </div>
          <p className='text-white/50'><span className='text-white fs-22 font-bold'>24</span> คัน</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-[#00FF00] bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <TbCar className='text-[#00FF00] fs-24' />
            <h3 className='text-[#00FF00]'>ป้ายทะเบียนจังหวัดที่พบสูงสุด</h3>
          </div>
          <p className='text-[#00FF00] fs-22 font-bold'>สิงห์บุรี</p>
          <p className='text-white/50 fs-12'>229 คัน (47.9%)</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={24} xl={24} xxl={24} xxxl={24}>
        <div className='p-5 border-2 border-[#00FFAA] bg-[#66AEFF1A] rounded-2xl'>
          <div className='flex items-center gap-2'>
            <TbHourglassHigh className='text-[#00FFAA] fs-24' />
            <h3 className='text-[#00FFAA]'>ช่วงเวลาตรวจจับป้ายทะเบียนสูงสุด</h3>
          </div>
          <p className='text-white fs-22 font-bold'>08:00 - 09:00 น.</p>
          <p className='text-white/50 fs-12'>(45.1%)</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ContentCard)
