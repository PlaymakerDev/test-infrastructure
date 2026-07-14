"use client"
import React from 'react'

/** Remote ON/OFF control card — status box, warning text, expand trigger.
 *  Shown on the OVERVIEW tab below route tabs. */
const RemoteControlCard: React.FC = () => {
  return (
    <div
      className='w-full max-w-[429px] h-[310px] rounded-2xl p-5 flex flex-col'
      style={{ background: '#191919CC' }}
    >
      <div
        className='p-4 flex flex-col gap-1.5 rounded-[12px] border-2 border-white/70'
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, rgba(26,26,26,0.95) 90%)',
        }}
      >
        <div className='flex items-center gap-2 text-white text-xs font-semibold'>
          <img src='/atlas/images/Lighting/ictl1.png' alt='' width={30} height={30} className='shrink-0' />
          สถานะการทำงาน
        </div>
        <h2 className='text-white font-bold text-[22px] leading-tight m-0'>
          ปิดไฟตู้โจรกรรม
        </h2>
        <p className='text-white/70 text-[12px] leading-tight m-0'>
          อัพเดตล่าสุด : 15 เม.ย. 2569 18:35:29 น.
        </p>
      </div>

      <div className='mt-4 flex-1 flex flex-col min-h-0'>
        <h3 className='text-[#FCD116] font-bold text-[20px] leading-tight m-0'>
          คำสั่งเปิด-ปิดระยะไกล
        </h3>
        <p className='text-gray-400 text-[12px] leading-snug mt-1.5 m-0'>
          การสั่งงานนี้อาจส่งผลต่ออุปกรณ์ไฟฟ้าและผู้ใช้งานในพื้นที่ กรุณาตรวจสอบความปลอดภัยก่อนดำเนินการทุกครั้ง
        </p>

        <div className='mt-auto pt-3'>
          <button
            type='button'
            aria-label='เปิดคำสั่งเปิด-ปิดระยะไกล'
            className='border-0 cursor-pointer hover:brightness-110 transition-all p-0 bg-transparent'
          >
            <img src='/atlas/images/Lighting/arrowdown.png' alt='' width={40} height={40} className='shrink-0' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default React.memo(RemoteControlCard)
