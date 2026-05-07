import { InfoCircleOutlined } from '@ant-design/icons'
import Image from 'next/image'
import React from 'react'

interface Props { }

const TRUCK_IMG = '/images/vehicles/placeholder/truck-icon.svg'

const MobileStatCard: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>

      {/* รถบรรทุกเข้าชั่ง */}
      <div className="flex bg-[#66AEFF1A] border-2 rounded-xl border-blue-500 overflow-hidden min-h-32.5">
        <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
          <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 text-right">
          <h4 className="text-blue-500 mb-0">รถบรรทุกเข้าชั่ง</h4>
          <p className="mb-0">
            <span className="fs-22 font-bold">1,708</span>{' '}
            <span className="fs-12 text-gray-300">คัน</span>
          </p>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักที่ชั่งได้สูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
        </div>
      </div>

      {/* รถบรรทุกน้ำหนักรวมเกิน */}
      <div className="flex bg-[#E982821A] border-2 rounded-xl border-red-500 overflow-hidden min-h-32.5">
        <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
          <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 text-right">
          <h4 className="text-red-500 mb-0">รถบรรทุกน้ำหนักรวมเกิน</h4>
          <p className="mb-0">
            <span className="fs-22 font-bold">1,708</span>{' '}
            <span className="fs-12 text-gray-300">คัน</span>
          </p>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักที่ชั่งได้สูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
          <div className="flex items-center justify-end gap-1 mt-1">
            <InfoCircleOutlined className="text-xs! text-red-500!" />
            <p className="text-red-500 fs-12 mb-0">เกินพิกัด 25%</p>
          </div>
        </div>
      </div>

      {/* รถบรรทุกน้ำหนักเพลาเกิน */}
      <div className="flex bg-[#FF7B001A] border-2 rounded-xl border-orange-500 overflow-hidden min-h-32.5">
        <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
          <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 text-right">
          <h4 className="text-orange-500 mb-0">รถบรรทุกน้ำหนักเพลาเกิน</h4>
          <p className="mb-0">
            <span className="fs-22 font-bold">1,708</span>{' '}
            <span className="fs-12 text-gray-300">คัน</span>
          </p>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักที่ชั่งได้สูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
          <div className="flex items-center justify-end gap-1 mt-1">
            <InfoCircleOutlined className="text-xs! text-orange-500!" />
            <p className="text-orange-500 fs-12 mb-0">เกินพิกัด 25%</p>
          </div>
        </div>
      </div>

      {/* ยอมรับน้ำหนัก */}
      <div className="flex bg-[#05F2DB1A] border-2 rounded-xl border-teal-400 overflow-hidden min-h-32.5">
        <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
          <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 text-right">
          <h4 className="text-teal-400 mb-0">ยอมรับน้ำหนัก</h4>
          <p className="mb-0">
            <span className="fs-22 font-bold">1,708</span>{' '}
            <span className="fs-12 text-gray-300">คัน</span>
          </p>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักรวมเกินสูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักเพลาเกินสูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
        </div>
      </div>

      {/* ดำเนินคดี */}
      <div className="flex bg-[#EB66FF1A] border-2 rounded-xl border-pink-500 overflow-hidden min-h-32.5">
        <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
          <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 text-right">
          <h4 className="text-pink-500 mb-0">ดำเนินคดี</h4>
          <p className="mb-0">
            <span className="fs-22 font-bold">1,708</span>{' '}
            <span className="fs-12 text-gray-300">คัน</span>
          </p>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักรวมเกินสูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
          <section>
            <p className="fs-12 text-gray-400 mb-0">น้ำหนักเพลาเกินสูงสุด/คัน</p>
            <p className="mb-0">56.4 ตัน</p>
          </section>
        </div>
      </div>

    </div>
  )
}

export default React.memo<Props>(MobileStatCard)
