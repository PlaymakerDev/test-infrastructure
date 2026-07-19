"use client"
import React from 'react'

/** Read-only placeholder until the backend exposes command state and control. */
const RemoteControlCard: React.FC = () => (
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
        <img src='/images/Lighting/ictl1.png' alt='' width={30} height={30} className='shrink-0' />
        สถานะการทำงาน
      </div>
      <h2 className='text-white font-bold text-[22px] leading-tight m-0'>
        ยังไม่มีข้อมูลสถานะคำสั่ง
      </h2>
      <p className='text-white/70 text-[12px] leading-tight m-0'>อัปเดตล่าสุด : -</p>
    </div>

    <div className='mt-4 flex-1 flex flex-col min-h-0'>
      <h3 className='text-[#FCD116] font-bold text-[20px] leading-tight m-0'>
        คำสั่งเปิด-ปิดระยะไกล
      </h3>
      <p className='text-gray-400 text-[12px] leading-snug mt-1.5 m-0'>
        ระบบยังไม่มี API สำหรับตรวจสอบหรือส่งคำสั่ง จึงปิดการใช้งานส่วนควบคุมนี้ไว้ชั่วคราว
      </p>

      <div className='mt-auto pt-3'>
        <button
          type='button'
          aria-label='คำสั่งเปิด-ปิดระยะไกลยังไม่พร้อมใช้งาน'
          disabled
          className='border-0 p-0 bg-transparent cursor-not-allowed opacity-40'
        >
          <img src='/images/Lighting/arrowdown.png' alt='' width={40} height={40} className='shrink-0' />
        </button>
      </div>
    </div>
  </div>
)

export default React.memo(RemoteControlCard)
