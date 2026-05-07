import { Col, Row } from 'antd'
import React from 'react'

interface Props {

}

const MobileDetailCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full rounded-lg p-5 bg-(--dark-black)">
      <h3 className='text-(--yellow)'>ข้อมูลหน่วยจัดตั้งเคลื่อนที่</h3>
      <section className='mt-5'>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
            <h3 className='text-(--yellow) mb-3'>ข้อมูลสายทาง</h3>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>รหัสสายทาง</p>
                <p>มห.4021</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>ชื่อสายทาง</p>
                <p>แยก ทล. 2370 (กม.ที่ 16+300) - บ้านห้วยค้อ</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>อำเภอ</p>
                <p>หนองสูง,หนองพอก</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จังหวัด</p>
                <p>มุกดาหาร</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>กม. เริ่มต้น</p>
                <p>8+000</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>กม. สิ้นสุด</p>
                <p>9+000</p>
              </div>
            </section>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
            <h3 className='text-(--yellow) mb-3'>ข้อมูลหน่วยจัดตั้ง</h3>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>ขื่อหน่วยชั่งยานพาหนะ</p>
                <p>แขวงทางหลวงชนบทมุกดาหาร</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>การร่วมบูรณาการ</p>
                <p>ไม่ระบุ</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>วันที่และเวลาจัดตั้งล่าสุด</p>
                <p>20 เม.ย. 2569 14:44:03 น.</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>วันที่และเวลาสิ้นสุดล่าสุด</p>
                <p>20 เม.ย. 2569 20:44:03 น.</p>
              </div>
            </section>
          </Col>
          <Col xs={24} sm={24} md={8} lg={8} xl={8} xxl={8} xxxl={8}>
            <h3 className='text-(--yellow) mb-3'>ประวัติการจัดตั้ง</h3>
            <section>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จำนวนวันที่จัดตั้งประจำปี</p>
                <p>26 ครั้ง</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จำนวนรถเข้าชั่ง</p>
                <p className='text-blue-500'>26 ครั้ง</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จำนวนรถน้ำหนักรวมเกิน</p>
                <p className='text-red-500'>4 คัน</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จำนวนรถน้ำหนักเพลาเกิน</p>
                <p className='text-orange-500'>21 คัน</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จำนวนการยอมรับน้ำหนัก</p>
                <p className='text-shadow-teal-500'>25 คัน</p>
              </div>
              <div className='flex flex-col gap-1 mb-2.5'>
                <p className='text-gray-500'>จำนวนการดำเนิคดี</p>
                <p className='text-pink-500'>2 คัน</p>
              </div>
            </section>
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default React.memo<Props>(MobileDetailCard)
