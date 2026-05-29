import { Col, Row } from 'antd'
import React from 'react'
import { TbCarCrash, TbAlertTriangle, TbShieldCheck, TbVideo } from 'react-icons/tb'

interface Props {}

const InfoCardSection: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbVideo className='fs-22 text-white shrink-0' />
            <h4 className='text-white mb-0'>กล้องวิเคราะห์ทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>2</span> <span className='fs-14'>กล้อง</span></p>
          <p className='fs-12 text-gray-400 mb-0'>อัปเดตล่าสุด : 18:35:29 น.</p>
        </div>
      </Col>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbCarCrash className='fs-22 text-red-500 shrink-0' />
            <h4 className='text-red-500 mb-0'>เหตุการณ์ทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>77</span> <span className='fs-14'>เหตุการณ์</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 18:14:21 น.</p>
        </div>
      </Col>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbAlertTriangle className='fs-22 text-orange-500 shrink-0' />
            <h4 className='text-orange-500 mb-0'>เหตุการณ์วันนี้</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>12</span> <span className='fs-14'>เหตุการณ์</span></p>
          <p className='fs-12 text-gray-400 mb-0'>เหตุการณ์ล่าสุด : 10:19:07 น.</p>
        </div>
      </Col>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-green-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbShieldCheck className='fs-22 text-green-500 shrink-0' />
            <h4 className='text-green-500 mb-0'>ปกติ</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>65</span> <span className='fs-14'>ช่วงเวลา</span></p>
          <p className='fs-12 text-gray-400 mb-0'>อัปเดตล่าสุด : 18:35:29 น.</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
