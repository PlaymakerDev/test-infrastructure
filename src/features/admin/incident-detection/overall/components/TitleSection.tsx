"use client"
import SharedTitleSection from '@/components/section/TitleSection'
import React from 'react'

const TitleSection: React.FC = () => (
  <SharedTitleSection title="Incident Detection" subtitle="ระบบวิเคราะห์หน้าที่เหตุและตรวจจับการจราจรผิดปกติจากกล้องโทรทัศน์วงจรปิด เพื่อแจ้งเตือนความปลอดภัยและเก็บข้อมูลสถิติ" />
)

export default React.memo(TitleSection)
