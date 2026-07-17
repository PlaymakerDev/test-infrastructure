"use client"
import React from 'react'
import SharedTitleSection from '@/components/section/TitleSection'

const TitleSection: React.FC = () => (
  <SharedTitleSection
    title='Crosswalk'
    subtitle='ระบบสัญญาณไฟทางข้ามอัจฉริยะ'
  />
)

export default React.memo(TitleSection)
