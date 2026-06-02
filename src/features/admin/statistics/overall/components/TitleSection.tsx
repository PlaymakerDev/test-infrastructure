"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import { Segmented } from 'antd'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

const TAB_OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERVIEW' },
  { label: 'รายงานเหตุการณ์', value: 'INCIDENT' },
  { label: 'ไฟฟ้าแจ้งเตือน', value: 'ALERT' },
  { label: 'สถานะและการปรับเปลี่ยนข้อความ', value: 'STATUS' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const TitleSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()

  // Determine current tab from boolean params
  const hasStatus = searchParams.has('status')
  const hasIncident = searchParams.has('incident')
  const hasAlert = searchParams.has('alert')
  const currentTab = hasStatus ? 'STATUS' : hasIncident ? 'INCIDENT' : hasAlert ? 'ALERT' : 'OVERVIEW'

  const activePeriod = searchParams.get('period') || 'ALL'

  const handleTabChange = (value: string) => {
    // Build query string without = for boolean params
    const queryParts: string[] = []

    if (value === 'STATUS') {
      queryParts.push('status')
    } else if (value === 'INCIDENT') {
      queryParts.push('incident')
    } else if (value === 'ALERT') {
      queryParts.push('alert')
    }

    // Keep period if exists
    const period = searchParams.get('period')
    if (period && value !== 'STATUS') {
      queryParts.push(`period=${period}`)
    }

    const query = queryParts.join('&')
    router.push(`/admin/statistics${query ? `?${query}` : ''}`)
  }

  const handlePeriodChange = (value: string) => {
    // Build query string without = for boolean params
    const queryParts: string[] = []

    // Preserve current tab
    if (searchParams.has('status')) {
      queryParts.push('status')
    } else if (searchParams.has('incident')) {
      queryParts.push('incident')
    } else if (searchParams.has('alert')) {
      queryParts.push('alert')
    }

    queryParts.push(`period=${value}`)

    const query = queryParts.join('&')
    router.push(`/admin/statistics${query ? `?${query}` : ''}`)
  }

  return (
    <div>
      {currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' && (
        <section>
          <h1 className='text-(--yellow)'>Statistics</h1>
          <p className='text-(--yellow)'>สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </section>
      )}
      <section className={`${currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' ? 'mt-5' : 'mt-0'} flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4`}>
        {currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' && (
          <div className='flex-1 min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <SwapButton
              options={TAB_OPTIONS}
              defaultActive={currentTab}
              setLabelValue={handleTabChange}
              size={isMobile ? 'middle' : 'large'}
            />
          </div>
        )}
        {currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT' && (
          <div className='shrink-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <Segmented
              value={activePeriod}
              onChange={(value) => handlePeriodChange(value as string)}
              options={PERIOD_OPTIONS}
              size={isMobile ? 'middle' : 'large'}
              classNames={{
                root: 'min-w-max border! border-(--yellow)!',
              }}
            />
          </div>
        )}
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
