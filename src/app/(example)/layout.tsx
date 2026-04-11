"use client"
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import React from 'react'
import PageLayout from '@/components/layout/Layout'
import { ExampleProvider } from '@/features/example/example/context'

interface Props {
  children: React.ReactNode;
}

const ExampleLayout: React.FC<Props> = (props) => {
  const { children } = props

  return (
    <PageLayout>
      <ExampleProvider>
        {children}
      </ExampleProvider>
    </PageLayout>
  )
}

export default React.memo<Props>(ExampleLayout)
