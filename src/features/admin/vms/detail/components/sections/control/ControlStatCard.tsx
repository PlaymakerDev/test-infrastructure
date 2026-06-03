import { Col, Row } from 'antd'
import React from 'react'
import { TbDeviceDesktop, TbEdit, TbAlertTriangle, TbWifi } from 'react-icons/tb'

interface Props {}

const ControlStatCard: React.FC<Props> = () => {
  return (
    <Row gutter={[16, 16]}>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={8}
        xl={8}
        xxl={4}
      >
        <div className='h-full bg-[#66AEFF1A] border border-white py-3 px-5 rounded-lg'>
          <TbDeviceDesktop className='fs-22 text-white mb-1' />
          <h4 className='text-white mb-1'>ป้าย VMS ทั้งหมด</h4>
          <p className='mb-0.5'>
            <span className='fs-18 font-bold'>4</span>{' '}
            <span className='fs-14'>ป้าย</span>
          </p>
        </div>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={8}
        xl={8}
        xxl={4}
      >
        <div className='h-full bg-[#66AEFF1A] border border-blue-500 py-3 px-5 rounded-lg'>
          <TbWifi className='fs-22 text-blue-500 mb-1' />
          <h4 className='text-blue-500 mb-1'>ออนไลน์</h4>
          <p className='mb-0.5'>
            <span className='fs-18 font-bold'>4</span>{' '}
            <span className='fs-14'>ป้าย</span>
          </p>
        </div>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={8}
        xl={8}
        xxl={4}
      >
        <div className='h-full bg-[#66AEFF1A] border border-yellow-500 py-3 px-5 rounded-lg'>
          <TbEdit className='fs-22 text-yellow-500 mb-1' />
          <h4 className='text-yellow-500 mb-1'>เปลี่ยนข้อความ</h4>
          <p className='mb-0.5'>
            <span className='fs-18 font-bold'>31</span>{' '}
            <span className='fs-14'>ครั้ง</span>
          </p>
          <p className='fs-12 text-gray-400 mb-0'>ล่าสุด : 18:14:21 น.</p>
        </div>
      </Col>
      <Col
        xs={24}
        sm={24}
        md={8}
        lg={8}
        xl={8}
        xxl={4}
      >
        <div className='h-full bg-[#66AEFF1A] border border-red-500 py-3 px-5 rounded-lg'>
          <TbAlertTriangle className='fs-22 text-red-500 mb-1' />
          <h4 className='text-red-500 mb-1'>ข้อผิดพลาด</h4>
          <p className='mb-0.5'>
            <span className='fs-18 font-bold'>3</span>{' '}
            <span className='fs-14'>ครั้ง</span>
          </p>
          <p className='fs-12 text-gray-400 mb-0'>ล่าสุด : 12:48:02 น.</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(ControlStatCard)
