"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useIsMobile from '@/utils/hooks/useIsMobile'

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
  const isMobile = useIsMobile(1280)

  // Determine current tab from boolean params
  const hasStatus = searchParams.has('status')
  const hasIncident = searchParams.has('incident')
  const hasAlert = searchParams.has('alert')
  const currentTab = hasStatus ? 'STATUS' : hasIncident ? 'INCIDENT' : hasAlert ? 'ALERT' : 'OVERVIEW'

  const activePeriod = searchParams.get('period') || 'ALL'
  const showTabsAndPeriod = currentTab !== 'STATUS' && currentTab !== 'ALERT' && currentTab !== 'INCIDENT'

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
      {showTabsAndPeriod && (
        <section>
          <h1 className='text-(--yellow)'>Statistics</h1>
          <p className='text-(--yellow)'>สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
        </section>
      )}
      {showTabsAndPeriod && (
        // `flex-wrap` (no fixed sm:flex-row switch) — the period group drops
        // to its own line the moment it no longer fits beside the tabs, at
        // any viewport width, instead of forcing a scrollbar.
        <section className='mt-5 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <SwapButton
              options={TAB_OPTIONS}
              defaultActive={currentTab}
              setLabelValue={handleTabChange}
              size={isMobile ? 'middle' : 'large'}
              mobileWrap
            />
          </div>
          <div className='flex flex-wrap gap-1 rounded-xl border border-(--yellow) p-1'>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = activePeriod === opt.value
              return (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => handlePeriodChange(opt.value)}
                  className='px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-sm font-medium cursor-pointer transition-colors whitespace-nowrap'
                  style={isActive
                    ? { background: 'var(--yellow)', color: '#212121' }
                    : { background: 'transparent', color: 'var(--yellow)' }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

export default React.memo(TitleSection)
