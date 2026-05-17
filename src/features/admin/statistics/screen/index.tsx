"use client"
import React, { useState } from 'react'
import { Segmented } from 'antd'
import SwapButton from '@/components/swap-button/SwapButton'
import { OverviewSection, IncidentSection, AlertSection, StatusSection } from '../components'

const TAB_OPTIONS = [
  { label: 'ภาพรวม', value: 'overview' },
  { label: 'รายงานเหตุการณ์', value: 'incident' },
  { label: 'ไฟฟ้าแจ้งเตือน', value: 'alert' },
  { label: 'สถานะและการปรับเปลี่ยนข้อความ', value: 'status' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const sectionMap: Record<string, React.FC> = {
  overview: OverviewSection,
  incident: IncidentSection,
  alert: AlertSection,
  status: StatusSection,
}

const StatisticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TAB_OPTIONS[0].value)
  const [activePeriod, setActivePeriod] = useState<string>('ALL')

  const ActiveSection = sectionMap[activeTab]

  return (
    <div className="main-screen px-10">
      {activeTab !== 'status' && (
        <>
          <section>
            <h1 className="text-[32px] font-bold text-[#FCD116]">Statistics</h1>
            <p className="mt-2 text-base leading-none text-[#FCD116]">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
          </section>
          <section className="mt-5 flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SwapButton
                options={TAB_OPTIONS}
                defaultActive="overview"
                setLabelValue={(value) => setActiveTab(value)}
              />
            </div>
            <div className="shrink-0">
              <Segmented
                value={activePeriod}
                onChange={(value) => setActivePeriod(value as string)}
                options={PERIOD_OPTIONS}
                size="large"
                classNames={{
                  root: 'min-w-max border! border-(--yellow)!',
                }}
              />
            </div>
          </section>
        </>
      )}
      {activeTab === 'status' && <StatusSection onBack={() => setActiveTab('overview')} />}
      {activeTab !== 'status' && ActiveSection && <ActiveSection />}
    </div>
  )
}

export default React.memo(StatisticsScreen)
