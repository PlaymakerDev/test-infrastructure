"use client"
import SharedTitleSection, { TabOption } from '@/components/section/TitleSection'
import React from 'react'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS: TabOption[] = [
  { label: 'ควบคุมป้าย VMS', value: 'VMS' },
  { label: 'กำหนดการแสดงผล', value: 'DISPLAY' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => (
  <SharedTitleSection
    title="ควบคุมป้ายอัจริยะ"
    subtitle="ระบบจัดการป้าย VMS ระยะไกล"
    tabOptions={OPTIONS}
    defaultTab="VMS"
    onTabChange={setCurrentTab}
    className="px-10"
  />
)

export default React.memo(TitleSection)
