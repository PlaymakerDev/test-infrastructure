"use client"
import SharedTitleSection from '@/components/section/TitleSection'
import React from 'react'

const TitleSection: React.FC = () => (
  <SharedTitleSection title="Bridge Lighting" subtitle="ระบบควบคุมแสงสว่างไฟประดับสะพาน" />
)

export default React.memo(TitleSection)
