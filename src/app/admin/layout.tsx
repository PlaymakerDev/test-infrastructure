"use client"
import React from 'react'
import PageLayout from '@/components/layout/Layout'
import ScopeUrlSync from '@/components/provider/ScopeUrlSync'

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = (props) => {
  const { children } = props

  return (
    <>
      {/* Must render BEFORE the page tree — see ScopeUrlSync docblock. */}
      <ScopeUrlSync />
      <PageLayout>
        {children}
      </PageLayout>
    </>
  )
}

export default React.memo<Props>(AdminLayout)
