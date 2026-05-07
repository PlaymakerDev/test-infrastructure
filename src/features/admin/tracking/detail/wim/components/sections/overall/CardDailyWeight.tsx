import Image from 'next/image'
import React from 'react'

interface Props { }

const TRUCK_IMG = '/images/vehicles/placeholder/truck-icon.svg'

const CardDailyWeight: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="flex h-full bg-[#66AEFF1A] border-2 rounded-xl border-blue-500 overflow-hidden min-h-32.5">
      <div className="flex items-center justify-center p-3 w-2/5 shrink-0">
        <Image src={TRUCK_IMG} alt="truck" width={110} height={160} className="object-contain drop-shadow-lg" />
      </div>
      <div className="flex flex-col justify-between p-4 flex-1 text-right">
        <h4 className="text-blue-500 mb-0">รถบรรทุกเข้าชั่งวันนี้</h4>
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
  )
}

export default React.memo<Props>(CardDailyWeight)
