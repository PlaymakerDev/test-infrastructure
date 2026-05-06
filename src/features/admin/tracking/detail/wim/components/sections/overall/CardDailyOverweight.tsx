import { InfoCircleOutlined } from '@ant-design/icons'
import React from 'react'

interface Props {

}

const CardDailyOverweight: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className="h-full bg-[#E982821A] border-2 rounded-lg p-5 border-red-500">
      <section>
        <h3 className='text-red-500'>รถบรรทุกน้ำหนักเกินวันนี้</h3>
        <p><span className='fs-24 font-bold'>1,708</span> คัน</p>
      </section>
      <section className='mt-5'>
        <p className='text-xs text-gray-400'>น้ำหนักเกินสูงสุด/คัน</p>
        <p>56.4 ตัน</p>
      </section>
      <section className='mt-5'>
        <div className='flex items-center gap-1.5'>
          <InfoCircleOutlined className='text-xs! text-red-500!' />
          <p className='text-red-500'>เกินพิกัด 25%</p>
        </div>
      </section>
    </div>
  )
}

export default React.memo<Props>(CardDailyOverweight)
