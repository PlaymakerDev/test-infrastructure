"use client"
import React, { useState } from 'react'
import { OverviewSection, IncidentSection, AlertSection, StatusSection } from '../components'

const tabs = [
  { key: 'overview', label: 'ภาพรวม' },
  { key: 'incident', label: 'รายงานเหตุการณ์' },
  { key: 'alert', label: 'ไฟฟ้าแจ้งเตือน' },
  { key: 'status', label: 'สถานะและการปรับเปลี่ยนข้อความ' },
]

const periods = [
  { key: 'today', label: 'วันนี้' },
  { key: '7days', label: '7 วัน' },
  { key: 'month', label: 'เดือนนี้' },
  { key: 'year', label: 'ปีนี้' },
  { key: 'lastyear', label: 'ปีที่ผ่านมา' },
  { key: 'all', label: 'ทั้งหมด' },
]

const sectionMap: Record<string, React.FC> = {
  overview: OverviewSection,
  incident: IncidentSection,
  alert: AlertSection,
  status: StatusSection,
}

const StatisticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].key)
  const [activePeriod, setActivePeriod] = useState<string>('all')

  const ActiveSection = sectionMap[activeTab]

  return (
    <div className="main-screen px-10">
      <section>
        <h1 className="text-[32px] font-bold text-[#FCD116]">Statistics</h1>
        <p className="mt-2 text-base leading-none text-[#FCD116]">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
      </section>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="h-10 min-w-40 px-6 rounded-[100px] text-sm font-medium transition-all duration-300 hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: activeTab === tab.key ? '#FCD116' : '#212121',
                color: activeTab === tab.key ? '#212121' : '#FCD116',
                boxShadow: activeTab === tab.key ? 'none' : '2px 2px 10px 0px #FCD116',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          className="flex h-10 shrink-0 overflow-hidden rounded-[10px] border border-[#FCD116]"
          style={{ minWidth: 360, width: 360 }}
        >
          {periods.map(period => (
            <button
              key={period.key}
              onClick={() => setActivePeriod(period.key)}
              className="flex flex-1 cursor-pointer items-center justify-center transition-all duration-300"
              style={{
                color: activePeriod === period.key ? '#212121' : '#FCD116',
                backgroundColor: activePeriod === period.key ? '#FCD116' : 'transparent',
                borderRadius: activePeriod === period.key ? 5 : 0,
                margin: activePeriod === period.key ? '6.5px 2px' : 0,
              }}
            >
              <span className="text-xs font-medium whitespace-nowrap">{period.label}</span>
            </button>
          ))}
        </div>
      </div>
      {ActiveSection && <ActiveSection />}
    </div>
  )
}

export default React.memo(StatisticsScreen)
