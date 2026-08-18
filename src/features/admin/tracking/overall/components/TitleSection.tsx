"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useOverallContext } from '../context'
import { useUserRole } from '@/hooks/useUserRole'
import { TRACKING_TAB_OPTIONS, allowedTrackingTabs } from '../data/tabs'

const TitleSection: React.FC = () => {
  const { currentTab, setCurrentTab } = useOverallContext()
  const router = useRouter()
  const { role, isResolved } = useUserRole()

  // Which tabs this role gets — admin: all · user: everything but ติดตาม GPS ·
  // contractor: WIM only. Rendered only once the role has resolved so the list
  // never collapses under the user mid-glance.
  const options = useMemo(() => {
    const allowed = allowedTrackingTabs(role)
    return TRACKING_TAB_OPTIONS.filter((option) => allowed.includes(option.value))
  }, [role])

  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>Truck Tracking</h1>
        <p className='text-(--yellow)'>ระบบติดตามและตรวจสอบยานพาหนะ</p>
      </section>
      {/* Reserve the row height while the role resolves so the page below
        * doesn't jump when the tabs appear. */}
      <section className='mt-5 min-h-[52px]'>
        {isResolved && (
          <SwapButton
            options={options}
            activeValue={currentTab}
            setLabelValue={(value) => {
              // GPS has no inline content — it's a shortcut into its own detail
              // route, not a real overview tab, so it must never become
              // `currentTab` (that would get persisted to the URL and loop:
              // back-navigation would land on ?tab=TRACK_GPS and redirect
              // straight back into the same detail page).
              if (value === 'TRACK_GPS') {
                router.push('/admin/tracking/detail/gps')
                return
              }
              setCurrentTab(value)
            }}
          />
        )}
      </section>
    </div>
  )
}

export default React.memo(TitleSection)
