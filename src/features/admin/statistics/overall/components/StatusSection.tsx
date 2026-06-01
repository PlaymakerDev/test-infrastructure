"use client"
import React, { useState, useCallback, useEffect } from 'react'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import { Segmented } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import SwapButton from '@/components/swap-button/SwapButton'
import { useStatisticsContext } from '../context'
import { StatisticsMapPanel, StatisticsComparisonTable } from './shared'
import type { ComparisonRecord, StatCard } from './shared'

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

const SUB_TAB_OPTIONS = [
  { label: 'ภาพรวมเหตุการณ์', value: 'OVERVIEW' },
  { label: 'ตารางเปรียบเทียบเหตุการณ์', value: 'COMPARISON' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const COMPARISON_MOCK_DATA: ComparisonRecord[] = [
  { key: '1', agency: 'สทช. 1 (กรุงเทพ)', installations: 5, online: 4, offline: 1, newCmdWeb: 3, newCmdApp: 2 },
  { key: '1-1', agency: 'สทช. 1 (กรุงเทพ)', installations: 3, online: 3, offline: 0, newCmdWeb: 2, newCmdApp: 1, isChild: true },
  { key: '1-2', agency: 'ขทช.สมุทรปราการ', installations: 2, online: 1, offline: 1, newCmdWeb: 1, newCmdApp: 1, isChild: true },
  { key: '2', agency: 'สทช. 2 (สระบุรี)', installations: 8, online: 7, offline: 1, newCmdWeb: 2, newCmdApp: 1 },
  { key: '2-1', agency: 'สทช. 2 (สระบุรี)', installations: 5, online: 5, offline: 0, newCmdWeb: 1, newCmdApp: 1, isChild: true },
  { key: '2-2', agency: 'ขทช.นครราชสีมา', installations: 3, online: 2, offline: 1, newCmdWeb: 1, newCmdApp: 0, isChild: true },
  { key: '3', agency: 'สทช. 10 (เชียงใหม่)', installations: 15, online: 12, offline: 3, newCmdWeb: 8, newCmdApp: 6 },
  { key: '3-1', agency: 'สทช. 10 (เชียงใหม่)', installations: 8, online: 7, offline: 1, newCmdWeb: 5, newCmdApp: 3, isChild: true },
  { key: '3-2', agency: 'ขทช.ลำปาง', installations: 4, online: 3, offline: 1, newCmdWeb: 2, newCmdApp: 2, isChild: true },
  { key: '3-3', agency: 'ขทช.เชียงราย', installations: 3, online: 2, offline: 1, newCmdWeb: 1, newCmdApp: 1, isChild: true },
]

const STATUS_CARDS: StatCard[] = [
  { borderColor: '#66AEFF', icon: '/images/statistics/c1.png', label: 'จุดติดตั้งทั้งหมด', labelColor: '#66AEFF', value: '53', unit: 'จุดติดตั้ง', sub: 'ภาคกลาง (75.6%)' },
  { borderColor: '#666BFF', icon: '/images/statistics/c2.png', label: 'เหตุการณ์ทั้งหมด', labelColor: '#666BFF', value: '16', unit: 'เหตุการณ์', sub: 'สทช. 10 (เชียงใหม่) (72.1%)' },
  { borderColor: '#C300FF', icon: '/images/statistics/c3.png', label: 'หน่วยงานที่มีเหตุการณ์', labelColor: '#C300FF', value: '45', unit: 'หน่วยงาน', sub: 'แขวงทางหลวงชนบทเชียงใหม่ (4 เหตุการณ์)' },
  { borderColor: '#FC1691', icon: '/images/statistics/c4.png', label: 'หมวดหมู่ยอดนิยม', labelColor: '#FC1691', value: 'การท่องเที่ยว', sub: 'การท่องเที่ยว · 36 จุดติดตั้ง' },
]

const StatusSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setCurrentTab } = useStatisticsContext()
  const isMobile = useIsMobile()
  const activeSubTab = (searchParams.get('subtab') || 'OVERVIEW').toUpperCase()
  const [activePeriod, setActivePeriod] = useState('ALL')
  const [searchText, setSearchText] = useState('')

  const handleBack = useCallback(() => router.push('/admin/statistics'), [router])

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="px-3">
        <section className="flex items-start gap-3">
          <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
          <div>
            <h1 className="text-(--yellow)">สถานะและการปรับเปลี่ยนข้อความ</h1>
            <p className="text-(--yellow)">สถิติและรายงานการแจ้งเตือนเหตุการณ์</p>
          </div>
        </section>
        <section className="mt-5 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SwapButton
            options={SUB_TAB_OPTIONS}
            defaultActive={activeSubTab}
            setLabelValue={(value) => router.push(`/admin/statistics?status&subtab=${value.toLowerCase()}`)}
            size={isMobile ? 'middle' : 'large'}
          />
        </section>
        {activeSubTab === 'OVERVIEW' && (
          <section className="mt-4 px-3 sm:px-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Segmented
              value={activePeriod}
              onChange={(value) => setActivePeriod(value as string)}
              options={PERIOD_OPTIONS}
              size={isMobile ? 'middle' : 'large'}
              classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
            />
          </section>
        )}
      </div>
      {activeSubTab === 'OVERVIEW' && (
        <StatisticsMapPanel
          markerColorFn={() => '#B2FF00'}
          markerLabelFn={(_item, index) => index + 1}
          badgeColorFn={() => '#FCD116'}
          searchText={searchText}
          onSearchChange={setSearchText}
          statsCards={STATUS_CARDS}
        />
      )}
      {activeSubTab === 'COMPARISON' && (
        <StatisticsComparisonTable data={COMPARISON_MOCK_DATA} />
      )}
    </div>
  )
}

export default React.memo(StatusSection)
