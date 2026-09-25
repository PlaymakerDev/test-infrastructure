"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Result, Spin } from 'antd'
import { useUserRole } from '@/hooks/useUserRole'
import {
  TitleSection,
  NewContactSection,
  NewProjectSection,
  NewUserSection,
  NewRoadSection,
} from '../components'
import { OverallProvider } from '../context'
import { allowedSettingsTabs, SETTINGS_TAB_OPTIONS, type SettingsTab } from '../data/tabs'

const isSettingsTab = (value: string | null): value is SettingsTab =>
  SETTINGS_TAB_OPTIONS.some((o) => o.value === value)

const SettingScreen = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  // Seed from `?tab=` so back-navigation from a project detail page lands on
  // the tab the user left from (mirrors tracking/overall's context).
  const [requestedTab, setRequestedTabState] = useState<SettingsTab>(
    isSettingsTab(tabParam) ? tabParam : 'PROJECT'
  )
  const { role, isResolved } = useUserRole()

  const allowedTabs = useMemo(() => allowedSettingsTabs(role), [role])

  // Clamp DERIVED rather than in an effect: a section the role can't have must
  // never render for even one commit — that would fire its queries and 403.
  // `undefined` when the role gets no tabs at all (role `user`).
  const currentTab: SettingsTab | undefined = allowedTabs.includes(requestedTab)
    ? requestedTab
    : allowedTabs[0]

  const writeTabParam = useCallback((value: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('tab') === value) return
    params.set('tab', value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const setRequestedTab = useCallback((value: SettingsTab) => {
    setRequestedTabState(value)
    writeTabParam(value)
  }, [writeTabParam])

  // Bring `?tab=` back in line when the role clamp overrode what the URL asked
  // for. Wait for the role to resolve — before that `allowedTabs` is the empty
  // `user` set and `currentTab` is undefined.
  useEffect(() => {
    if (isResolved && currentTab && currentTab !== requestedTab) writeTabParam(currentTab)
  }, [isResolved, currentTab, requestedTab, writeTabParam])

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'PROJECT':
        return <NewProjectSection />
      case 'ROUTE':
        return <NewRoadSection />
      case 'CONTACT':
        return <NewContactSection />
      case 'USER':
        return <NewUserSection />
      default:
        return null
    }
  }, [currentTab])

  // Three states for the body: role still resolving (AuthHydrator lands one
  // tick after mount on a hard load) → spinner; no permitted tab (role `user`,
  // or an unrecognised one) → no-access; otherwise the section.
  //
  // OverallProvider mounts ONLY in that last branch: it fetches the project
  // list + departments as soon as it mounts, and role `user` isn't admitted to
  // `/manage/project` at all, so mounting it unconditionally would fire a 403
  // on a page that shows them nothing anyway.
  const body = !isResolved ? (
    <div className='flex justify-center py-20'>
      <Spin size='large' />
    </div>
  ) : currentTab === undefined ? (
    <Result
      status='403'
      title='ไม่มีสิทธิ์เข้าถึง'
      subTitle='บัญชีของคุณไม่มีสิทธิ์ใช้งานหน้าระบบและการตั้งค่า'
    />
  ) : (
    <OverallProvider>{renderContent}</OverallProvider>
  )

  return (
    <div
      className='main-screen px-8 flex flex-col'
      style={{ height: 'calc(100vh - var(--nav-h))' }}
    >
      <div className='shrink-0'>
        <TitleSection currentTab={currentTab} setCurrentTab={setRequestedTab} />
      </div>
      <section className='mt-6 pb-8 flex-1 min-h-0'>
        {body}
      </section>
    </div>
  )
}

export default React.memo(SettingScreen)