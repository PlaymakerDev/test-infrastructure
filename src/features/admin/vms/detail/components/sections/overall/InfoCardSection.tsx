import { Col, Row } from 'antd'
import React from 'react'
import { TbDeviceDesktop, TbDeviceDesktopOff, TbWifi, TbWifiOff } from 'react-icons/tb'

interface Props {}

const InfoCardSection: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbDeviceDesktop className='fs-22 text-white shrink-0' />
            <h4 className='text-white mb-0'>ป้าย VMS ทั้งหมด</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>4</span> <span className='fs-14'>ป้าย</span></p>
          <p className='fs-12 text-gray-400 mb-0'>อัปเดตล่าสุด : 18:35:29 น.</p>
        </div>
      </Col>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbWifi className='fs-22 text-blue-500 shrink-0' />
            <h4 className='text-blue-500 mb-0'>ออนไลน์</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>4</span> <span className='fs-14'>ป้าย</span></p>
          <p className='fs-12 text-gray-400 mb-0'>อัปเดตล่าสุด : 18:35:29 น.</p>
        </div>
      </Col>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbWifiOff className='fs-22 text-red-500 shrink-0' />
            <h4 className='text-red-500 mb-0'>ออฟไลน์</h4>
          </div>
          <p className='mb-0.5'><span className='fs-18 font-bold'>0</span> <span className='fs-14'>ป้าย</span></p>
          <p className='fs-12 text-gray-400 mb-0'>อัปเดตล่าสุด : 18:35:29 น.</p>
        </div>
      </Col>
      <Col xs={24}>
        <div className='bg-[#66AEFF1A] border border-orange-500 py-3 px-5 rounded-lg'>
          <div className='flex items-center gap-2 mb-2'>
            <TbDeviceDesktopOff className='fs-22 text-orange-500 shrink-0' />
            <h4 className='text-orange-500 mb-0'>ข้อความที่แสดงล่าสุด</h4>
          </div>
          <p className='mb-0.5 fs-12'>ระวังอุบัติเหตุ ลดความเร็ว</p>
          <p className='fs-12 text-gray-400 mb-0'>อัปเดตล่าสุด : 10:19:07 น.</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(InfoCardSection)
