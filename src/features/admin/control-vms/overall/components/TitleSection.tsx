"use client"
import SharedTitleSection, { TabOption } from '@/components/section/TitleSection'
import React, { useCallback } from 'react'
import { useControlVMSContext } from '../context'

interface Props { }

const OPTIONS: TabOption[] = [
  { label: 'ควบคุมป้าย VMS', value: 'VMS' },
  { label: 'กำหนดการแสดงผล', value: 'DISPLAY' },
]

const TitleSection: React.FC<Props> = () => {
  const { currentTab, setCurrentTab, setBureau, setBureauState, setBureauRoute, setBureauSign, setVMSIdList, setAddMode } = useControlVMSContext()

  // Bureau/state/route/sign selection + the checked VMS ids only make sense
  // within the VMS tab's own session — clear them on every tab switch so
  // returning to VMS (or leaving it) never shows a stale selection.
  const handleTabChange = useCallback((value: string) => {
    setBureau(null)
    setBureauState(null)
    setBureauRoute(null)
    setBureauSign(null)
    setVMSIdList([])
    setAddMode(false)
    setCurrentTab(value)
  }, [setBureau, setBureauState, setBureauRoute, setBureauSign, setVMSIdList, setAddMode, setCurrentTab])

  return (
    <SharedTitleSection
      title="ควบคุมป้ายอัจริยะ"
      subtitle="ระบบจัดการป้าย VMS ระยะไกล"
      tabOptions={OPTIONS}
      defaultTab="VMS"
      activeTab={currentTab}
      onTabChange={handleTabChange}
      className="px-10"
    />
  )
}

export default React.memo(TitleSection)
