import { StatCardRow } from '@/components/section/StatCard'
import React from 'react'
import { TbDeviceDesktop, TbShield } from 'react-icons/tb'

const CARDS = [
  { icon: <TbDeviceDesktop />, title: 'ไฟประดับสะพานในระบบทั้งหมด', count: 207, activeLabel: 'Active : 55 (41.4%)', color: 'yellow' as const },
  { icon: <TbShield />,         title: 'ในค้ำ',                         count: 115, activeLabel: 'Active : 45 (42.9%)', color: 'teal'   as const },
  { icon: <TbShield />,         title: 'หมดค้ำ',                        count: 92,  activeLabel: 'Active : 10 (8.5%)',  color: 'gray'   as const },
]

const InfoCardSection: React.FC = () => <StatCardRow cards={CARDS} />

export default React.memo(InfoCardSection)
