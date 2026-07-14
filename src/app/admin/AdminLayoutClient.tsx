"use client"
import React, { Suspense } from 'react'
import PageLayout from '@/components/layout/Layout'
import ScopeUrlSync from '@/components/provider/ScopeUrlSync'

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
      <PageLayout>
        {children}
      </PageLayout>
    </>
  )
}

export default React.memo<Props>(AdminLayoutClient)
