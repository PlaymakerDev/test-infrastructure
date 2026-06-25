"use client"
import SharedTitleSection from '@/components/section/TitleSection'
import React from 'react'

const TitleSection: React.FC = () => (
  <SharedTitleSection title="VMS" subtitle="ระบบป้ายปรับเปลี่ยนข้อความ" />
)

export default React.memo(TitleSection)
