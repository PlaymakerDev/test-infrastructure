"use client"
import SharedTitleSection, { TabOption } from '@/components/section/TitleSection'
import React from 'react'

interface Props {
  setCurrentTab: (value: string) => void
}

const OPTIONS: TabOption[] = [
  { label: 'ภาพรวม', value: 'OVERALL' },
  { label: 'สถานีตรวจสอบน้ำหนัก', value: 'STATION' },
  { label: 'WIM (Weight-In-Motion)', value: 'WIM' },
  { label: 'ตรวจสอบน้ำหนักเคลื่อนที่', value: 'MOBILE' },
  { label: 'ติดตาม GPS', value: 'TRACK_GPS' },
  { label: 'ค้นหาป้ายทะเบียน', value: 'LICENSE' },
]

const TitleSection: React.FC<Props> = ({ setCurrentTab }) => (
  <SharedTitleSection
    title="Tracking"
    subtitle="ระบบติดตามและตรวจสอบยานพาหนะ"
    tabOptions={OPTIONS}
    defaultTab="OVERALL"
    onTabChange={setCurrentTab}
  />
)

export default React.memo(TitleSection)
