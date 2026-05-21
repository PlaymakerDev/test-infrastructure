import { Card, Col, Row, Tag } from 'antd'
import React from 'react'
import { TbCalendarStats, TbCircleCheck, TbCommand, TbFlag, TbGavel, TbTruck, TbUserShield, TbVideo } from "react-icons/tb";

interface Props {

}

const DisplayStatCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={5}>
        <div className='h-full bg-[#66AEFF1A] border border-teal-500 py-3 px-5 rounded-lg'>
          <TbCommand className='fs-22 text-teal-500 mb-1' />
          <h4 className='text-teal-500 mb-1'>ตารางเวลา</h4>
          <p className='mb-0.5'><span className='fs-18 font-bold'>16</span> <span className='fs-14'>คำสั่งใหม่</span></p>
          <p className='fs-12 text-gray-400 mb-0'>สทช. 1 (ปทุมธานี) (38.9%)</p>
        </div>
      </Col>
      <Col xs={24} sm={12} md={12} lg={8} xl={8} xxl={5}>
        <div className='h-full bg-[#66AEFF1A] border border-lime-500 py-3 px-5 rounded-lg'>
          <TbCalendarStats className='fs-22 text-lime-500 mb-1' />
          <h4 className='text-lime-500 mb-1'>คำสั่งที่กำลังจะมาถึง</h4>
          <p className='fs-18 font-bold mb-0.5'>การท่องเที่ยว</p>
          <p className='fs-12 text-gray-400 mb-0'>{"VMS >> ฉช.4050 จุดที่ 1"}</p>
        </div>
      </Col>
    </Row>
  )
}

export default React.memo<Props>(DisplayStatCard)
