"use client"
import SharedTitleSection from '@/components/section/TitleSection'
import React from 'react'

const TitleSection: React.FC = () => (
  <SharedTitleSection title="Traffic Signal" subtitle="ระบบสัญญาณไฟจราจรอัจฉริยะ" />
)

export default React.memo(TitleSection)
