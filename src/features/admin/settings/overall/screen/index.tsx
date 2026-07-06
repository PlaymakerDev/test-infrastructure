"use client"
import React, { useMemo, useState } from 'react'
import {
  TitleSection,
  ProjectSection,
  RouteSection,
  ContactSection,
  UserSection,
} from '../components'
import { OverallProvider } from '../context'

const SettingScreen = () => {
  const [currentTab, setCurrentTab] = useState('PROJECT')

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
        return <ProjectSection />
    }
  }, [currentTab])

  return (
    <OverallProvider>
      <div className='main-screen px-10'>
        <TitleSection setCurrentTab={setCurrentTab} />
        <section className='mt-8'>
          {renderContent}
        </section>
      </div>
    </OverallProvider>
  )
}

export default React.memo(SettingScreen)
