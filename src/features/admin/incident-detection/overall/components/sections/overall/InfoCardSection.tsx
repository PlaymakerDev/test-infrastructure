import { StatCardRow } from '@/components/section/StatCard'
import React from 'react'
import { TbCarCrash, TbShield } from 'react-icons/tb'

const CARDS = [
  { icon: <TbCarCrash />, title: 'กล้องวิเคราะห์ในระบบทั้งหมด', count: 795, activeLabel: 'Active : 485 (62.4%)', color: 'yellow' as const },
  { icon: <TbShield />,   title: 'ในค้ำ',                         count: 582, activeLabel: 'Active : 459 (82.1%)', color: 'teal'   as const },
  { icon: <TbShield />,   title: 'หมดค้ำ',                        count: 213, activeLabel: 'Active : 26 (12.5%)',  color: 'gray'   as const },
]

const InfoCardSection: React.FC = () => <StatCardRow cards={CARDS} />

export default React.memo(InfoCardSection)
