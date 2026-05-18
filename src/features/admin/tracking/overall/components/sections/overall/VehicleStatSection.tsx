import React from 'react'

interface Props { }

const VehicleStatSection: React.FC<Props> = (props) => {
  const { } = props

  return (
    <div className='border-2 rounded-lg border-(--yellow) p-5'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        {/* f1 — xs: border-b | sm: border-b + border-r | lg: border-r only */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--yellow)/50 border-b sm:border-r lg:border-b-0'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>รวมรถเข้าชั่งวันนี้</h3>
            <p className='text-xs text-gray-400'>รวมรถเข้าชั่งวันนี้</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>6,496</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>420</h2>
            </div>
          </section>
        </figure>

        {/* f2 — xs: border-b | sm: border-b (rightmost, no border-r) | lg: border-b-0 + border-r */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--yellow)/50 border-b lg:border-b-0 lg:border-r'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>สถานีตรวจสอบน้ำหนัก</h3>
            <p className='text-xs text-gray-400'>เปิดใช้งาน 4 / 5</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>634</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>1</h2>
            </div>
          </section>
        </figure>

        {/* f3 — xs: border-b | sm: border-b-0 + border-r | lg: border-r */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6 border-(--yellow)/50 border-b sm:border-b-0 sm:border-r'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>WIM (Weight-In-Motion)</h3>
            <p className='text-xs text-gray-400'>เปิดใช้งาน 21 / 74</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>5,860</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>417</h2>
            </div>
          </section>
        </figure>

        {/* f4 — last item, no border needed at any breakpoint */}
        <figure className='flex flex-col items-center gap-2 py-3 px-2 sm:px-4 lg:px-6'>
          <section className='text-center'>
            <h3 className='text-xs font-semibold text-white sm:text-sm'>หน่วยตรวจสอบน้ำหนักเคลื่อนที่</h3>
            <p className='text-xs text-gray-400'>เปิดใช้งาน 2 / 97</p>
          </section>
          <section className='flex items-center gap-4 lg:gap-8'>
            <div className='text-center'>
              <p className='text-xs text-(--yellow)'>รถเข้าชั่ง</p>
              <h2 className='text-2xl font-bold leading-tight text-(--yellow) lg:text-3xl'>2</h2>
            </div>
            <div className='text-center'>
              <p className='text-xs text-red-400'>น้ำหนักเกิน</p>
              <h2 className='text-2xl font-bold leading-tight text-red-400 lg:text-3xl'>2</h2>
            </div>
          </section>
        </figure>
      </div>
    </div>
  )
}

export default React.memo<Props>(VehicleStatSection)