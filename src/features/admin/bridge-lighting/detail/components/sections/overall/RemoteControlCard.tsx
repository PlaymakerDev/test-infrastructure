"use client"
import React, { useState } from 'react'
import { TbPower } from 'react-icons/tb'

interface Props {}

/** Remote ON/OFF control card — yellow heading, warning text, toggle button.
 *  Replicates the Figma left-bottom card "คำสั่งเปิด-ปิดระยะไกล". */
const RemoteControlCard: React.FC<Props> = () => {
  const [isOn, setIsOn] = useState(false)

  return (
    <div className='flex flex-col gap-1.5 pt-2 w-full'>
      <h3
        className='font-bold text-(--yellow)'
        style={{ fontSize: 20 }}
      >
        คำสั่งเปิด-ปิดระยะไกล
      </h3>
      <p
        className='text-white/60 leading-snug'
        style={{ fontSize: 12 }}
      >
        การสั่งงานนี้อาจส่งผลต่ออุปกรณ์ไฟฟ้าและผู้ใช้งานในพื้นที่ กรุณาตรวจสอบความปลอดภัยก่อนดำเนินการทุกครั้ง
      </p>
      <button
        type='button'
        onClick={() => setIsOn((v) => !v)}
        className='inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold w-fit mt-1'
        style={{
          background: isOn ? '#FCD116' : 'rgba(252,209,22,0.15)',
          border: '1.5px solid #FCD116',
          color: isOn ? '#212121' : '#FCD116',
        }}
      >
        <TbPower size={14} />
        {isOn ? 'เปิดไฟประดับ' : 'ปิดไฟประดับ'}
      </button>
    </div>
  )
}

export default React.memo<Props>(RemoteControlCard)
