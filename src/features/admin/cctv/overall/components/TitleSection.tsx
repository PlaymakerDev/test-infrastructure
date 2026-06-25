"use client"
import SharedTitleSection from '@/components/section/TitleSection'
import React from 'react'

const TitleSection: React.FC = () => (
  <SharedTitleSection title="CCTV" subtitle="ระบบกล้องวงจรปิด" />
)

export default React.memo(TitleSection)
