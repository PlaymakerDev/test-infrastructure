"use client"
import React from 'react'
import type { TrafficLightingDetailTab } from '../context'
import { useDetailContext } from '../context'

const TAB_OPTIONS: { label: string; value: TrafficLightingDetailTab }[] = [
  { label: 'ภาพรวม', value: 'OVERVIEW' },
  { label: 'Lighting 4G IoT Monitor', value: 'IOT_MONITOR' },
  { label: 'รายงานสรุปการทำงาน', value: 'SUMMARY' },
]

const TabSection: React.FC = () => {
  const { currentTab, setCurrentTab } = useDetailContext()

  return (
    <section className='mt-5'>
      <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
        {TAB_OPTIONS.map((tab) => {
          const isActive = currentTab === tab.value
          return (
            <button
              key={tab.value}
              type='button'
              onClick={() => setCurrentTab(tab.value)}
              className={[
                'min-w-[160px] px-4 py-2 rounded-full text-[13px] sm:text-[14px] font-normal whitespace-nowrap',
                'border-0 cursor-pointer transition-all duration-200 shrink-0',
                isActive
                  ? 'bg-[#FCD116] text-[#212121] shadow-none'
                  : 'bg-[#2B2B2B] text-white shadow-[0_0_10px_rgba(252,209,22,0.35)] hover:shadow-[0_0_14px_rgba(252,209,22,0.5)]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default React.memo(TabSection)
