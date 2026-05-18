import { Col, Row } from 'antd'
import React from 'react'

interface Props {

}

const VehicleDetail: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='rounded-lg p-5 bg-(--mid-gray)'>
      <section>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h2 className='font-bold text-white leading-tight'>71-9621</h2>
            <p className='fs-12 text-gray-400 text-sm mt-1'>พระนครศรีอยุธยา</p>
          </div>
          <span className='inline-block py-0.5 px-3.5 rounded-full text-xs whitespace-nowrap border border-(--yellow) text-(--yellow) mt-1'>
            รถเคลื่อนที่
          </span>
        </div>
      </section>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
            <h4 className='text-(--yellow) mb-3'>ข้อมูลรถบรรทุก</h4>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>ยี่ห้อ</p>
                <p className='fs-12'>UD TRUCKS</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>ประเภท</p>
                <p className='fs-12'>รถบรรทุกไม่ประจำทาง</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>น้ำหนัก</p>
                <p className='fs-12'>8,300 กม.</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>บริษัท</p>
                <p className='fs-12'>บริษัท หงษ์ทอง วิศวกิจ จำกัด</p>
              </div>
            </section>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={12} xxxl={12}>
            <h4 className='text-(--yellow) mb-3'>ข้อมูลสายทาง</h4>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='fs-12 text-gray-500'>สายทาง</p>
                <p className='fs-12'>แยกทางหลวงหมายเลข 4 (กม.ที่ 70+112) - ถนนสาย ก. ฝั่งเมืองรวมเมืองสะเดา</p>
              </div>
            </section>
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(VehicleDetail)
