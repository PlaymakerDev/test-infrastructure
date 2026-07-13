"use client"
import React from 'react'
import SharedTitleSection from '@/components/section/TitleSection'

const TitleSection: React.FC = () => (
  <SharedTitleSection
    title='Tunnel'
    subtitle='ระบบตรวจสอบและเฝ้าระวังอุโมงค์'
  />
)

export default React.memo(TitleSection)
