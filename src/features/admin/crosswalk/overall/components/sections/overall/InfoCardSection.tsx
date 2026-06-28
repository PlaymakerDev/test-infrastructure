import { StatCardRow } from '@/components/section/StatCard'
import React from 'react'
import { TbShield, TbWalk } from 'react-icons/tb'

const CARDS = [
  { icon: <TbWalk />,   title: 'ทางข้ามในระบบทั้งหมด', count: 20, activeLabel: 'Active : 8 (38.9%)',   color: 'yellow' as const },
  { icon: <TbShield />, title: 'ในค้ำ',                  count: 5,  activeLabel: 'Active : 5 (100.0%)', color: 'teal'   as const },
  { icon: <TbShield />, title: 'อัตรารถบนสายทาง',         count: 15, activeLabel: 'Active : 3 (24.5%)', color: 'gray'   as const },
]

const InfoCardSection: React.FC = () => <StatCardRow cards={CARDS} />

export default React.memo(InfoCardSection)
