"use client"
import React, { useMemo, useState } from 'react'
import { Result, Spin } from 'antd'
import { useUserRole } from '@/hooks/useUserRole'
import {
  TitleSection,
  ProjectSection,
  RouteSection,
  ContactSection,
  UserSection,
} from '../components'
import { OverallProvider } from '../context'
import { allowedSettingsTabs, type SettingsTab } from '../data/tabs'

const SettingScreen = () => {
  const [requestedTab, setRequestedTab] = useState<SettingsTab>('PROJECT')
  const { role, isResolved } = useUserRole()

  const allowedTabs = useMemo(() => allowedSettingsTabs(role), [role])

  // Clamp DERIVED rather than in an effect: a section the role can't have must
  // never render for even one commit — that would fire its queries and 403.
  // `undefined` when the role gets no tabs at all (role `user`).
  const currentTab: SettingsTab | undefined = allowedTabs.includes(requestedTab)
    ? requestedTab
    : allowedTabs[0]

  const renderContent = useMemo(() => {
    switch (currentTab) {
      case 'PROJECT':
        return <ProjectSection />
      case 'ROUTE':
        return <RouteSection />
      case 'CONTACT':
        return <ContactSection />
      case 'USER':
        return <UserSection />
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
      className='main-screen px-10 flex flex-col'
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