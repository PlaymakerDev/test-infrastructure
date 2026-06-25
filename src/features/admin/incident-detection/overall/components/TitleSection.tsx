"use client"
import SharedTitleSection from '@/components/section/TitleSection'
import React from 'react'

interface Props { }

const TitleSection: React.FC<Props> = () => {
  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>Incident Detection</h1>
        <p className='text-(--yellow)'>ระบบวิเคราะห์และตรวจจับเหตุการณ์การจราจรผิดปกติจากกล้องโทรทัศน์วงจรปิด เพื่อแจ้งเตือนความปลอดภัยและเก็บข้อมูลสถิติ</p>
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
