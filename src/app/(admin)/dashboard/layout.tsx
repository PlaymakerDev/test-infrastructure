import React from 'react'
import { DashboardProvider } from '@/features/admin/dashboard/context';
import Navbar from '@/components/layout/Navbar';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = (props) => {
  const {
    children
  } = props

  return (
    <DashboardProvider>
      <Navbar />
      <main>{children}</main>
    </DashboardProvider>
  )
}

export default React.memo<Props>(Layout)
