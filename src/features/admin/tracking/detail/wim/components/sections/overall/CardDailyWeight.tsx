import React from 'react'

interface Props {

}

const CardDailyWeight: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full bg-[#66AEFF1A] border-2 rounded-lg p-5 border-blue-500">
      <section>
        <h3 className='text-blue-500'>รถบรรทุกเข้าชั่งวันนี้</h3>
        <p><span className='fs-24 font-bold'>1,708</span> คัน</p>
      </section>
      <section className='mt-5'>
        <p className='text-xs text-gray-400'>น้ำหนักที่ชั่งได้สูงสุด/คัน</p>
        <p>56.4 ตัน</p>
      </section>
    </div>
  )
}

export default React.memo<Props>(CardDailyWeight)
