"use client"
import React, { Suspense } from 'react'
import PageLayout from '@/components/layout/Layout'
import ScopeUrlSync from '@/components/provider/ScopeUrlSync'
import AuthHydrator from '@/components/provider/AuthHydrator'
import BackToTop from '@/components/common/BackToTop'

interface Props {
  children: React.ReactNode;
}

const AdminLayoutClient: React.FC<Props> = (props) => {
  const { children } = props

  return (
    <>
      {/* Must render BEFORE the page tree — see ScopeUrlSync docblock.
        * Suspense: useSearchParams needs a boundary during build-time
        * prerender; ScopeUrlSync renders null, so a null fallback is
        * lossless and the render-order guarantee still holds on the client. */}
      <Suspense fallback={null}>
        <ScopeUrlSync />
      </Suspense>
      <AuthHydrator />
      <PageLayout>
        {children}
      </PageLayout>
      {/* Shows only after the window is scrolled — pages that don't scroll
        * (dashboard desktop) never see it. */}
      <BackToTop />
    </>
  )
}

export default React.memo<Props>(AdminLayoutClient)
