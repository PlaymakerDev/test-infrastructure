"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import { Segmented } from 'antd'
import React, { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TbArrowBigLeftFilled } from 'react-icons/tb'
import useIsMobile from '@/utils/hooks/useIsMobile'

const TAB_OPTIONS = [
  { label: 'ภาพรวม', value: 'OVERVIEW' },
  { label: 'บันทึกแจ้งซ่อม', value: 'REPAIR' },
]

const PERIOD_OPTIONS = [
  { label: 'วันนี้', value: 'TODAY' },
  { label: '7 วันที่ผ่านมา', value: 'LAST_7_DAYS' },
  { label: 'เดือนนี้', value: 'THIS_MONTH' },
  { label: 'ปีนี้', value: 'THIS_YEAR' },
  { label: 'ปีที่ผ่านมา', value: 'LAST_YEAR' },
  { label: 'ทั้งหมด', value: 'ALL' },
]

const MaintenanceTitleSection: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const hasRepair = searchParams.has('repair')
  const currentTab = hasRepair ? 'REPAIR' : 'OVERVIEW'
  const activePeriod = searchParams.get('period') || 'ALL'

  const handleBack = useCallback(() => router.push('/admin/maintenance'), [router])

  const handleTabChange = (value: string) => {
    const queryParts: string[] = []
    if (value === 'REPAIR') queryParts.push('repair')
    const query = queryParts.join('&')
    router.push(`/admin/maintenance${query ? `?${query}` : ''}`)
  }

  const handlePeriodChange = (value: string) => {
    const queryParts: string[] = []
    if (searchParams.has('repair')) queryParts.push('repair')
    queryParts.push(`period=${value}`)
    const query = queryParts.join('&')
    router.push(`/admin/maintenance${query ? `?${query}` : ''}`)
  }

  return (
    <div>
      {currentTab === 'REPAIR' ? (
        <section className="flex items-start gap-3">
          <TbArrowBigLeftFilled className="fs-24 text-(--yellow) cursor-pointer" onClick={handleBack} style={{ marginTop: 10 }} />
          <div>
            <h1 className="text-(--yellow)">บันทึกแจ้งซ่อม</h1>
            <p className="text-(--yellow)">ระบบติดตามและเฝ้าระวังการทำงานของอุปกรณ์</p>
          </div>
        </section>
      ) : (
        <section>
          <h1 className='text-(--yellow)'>Maintenance</h1>
          <p className='text-(--yellow)'>ระบบบำรุงรักษา</p>
        </section>
      )}
      {currentTab !== 'REPAIR' && (
        <section className='mt-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4'>
          <div className='flex-1 min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <SwapButton
              options={TAB_OPTIONS}
              defaultActive={currentTab}
              setLabelValue={handleTabChange}
              size={isMobile ? 'middle' : 'large'}
            />
          </div>
          <div className='shrink-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
            <Segmented
              value={activePeriod}
              onChange={(value) => handlePeriodChange(value as string)}
              options={PERIOD_OPTIONS}
              size={isMobile ? 'middle' : 'large'}
              classNames={{ root: 'min-w-max border! border-(--yellow)!' }}
            />
          </div>
        </section>
      )}
    </div>
  )
}

export default React.memo(MaintenanceTitleSection)
