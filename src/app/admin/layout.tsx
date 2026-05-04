"use client"
import React from 'react'
import PageLayout from '@/components/layout/Layout'

interface Props {
  children: React.ReactNode;
}

const AdminLayout: React.FC<Props> = (props) => {
  const { children } = props

  return (
    <PageLayout>
      {children}
    </PageLayout>
  )
}

export default React.memo<Props>(AdminLayout)
