"use client"
import SwapButton from '@/components/swap-button/SwapButton'
import { useUserRole } from '@/hooks/useUserRole'
import React, { useMemo } from 'react'
import { SETTINGS_TAB_OPTIONS, allowedSettingsTabs, type SettingsTab } from '../data/tabs'

interface Props {
  /** `undefined` when the role has no permitted tab — the row renders empty. */
  currentTab?: SettingsTab;
  setCurrentTab: (value: SettingsTab) => void;
}

const TitleSection: React.FC<Props> = (props) => {
  const { currentTab, setCurrentTab } = props
  const { role, isResolved } = useUserRole()

  // Which tabs this role gets — admin: all four · contractor: โครงการ only ·
  // user: none. Rendered only once the role has resolved so a contractor never
  // sees tabs they can't open flash by on a hard load.
  const options = useMemo(() => {
    const allowed = allowedSettingsTabs(role)
    return SETTINGS_TAB_OPTIONS.filter((option) => allowed.includes(option.value))
  }, [role])

  return (
    <div>
      <section>
        <h1 className='text-(--yellow)'>ระบบและการตั้งค่า</h1>
        <p className='text-(--yellow)'>การจัดการข้อมูลพื้นฐานของระบบ</p>
      </section>
      {/* Reserve the row height while the role resolves so the table below
        * doesn't jump when the tabs appear. */}
      <section className='mt-5 min-h-[52px]'>
        {isResolved && options.length > 0 && (
          <SwapButton
            options={options}
            activeValue={currentTab}
            setLabelValue={(value) => setCurrentTab(value as SettingsTab)}
          />
        )}
      </section>
    </div>
  )
}

export default React.memo<Props>(TitleSection)