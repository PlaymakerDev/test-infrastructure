import React from 'react'
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { PageProvider } from '../provider/ContextProvider';
import { usePathname } from 'next/navigation';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = (props) => {
  const { children } = props
  const pathname = usePathname()
  const isDashboard = pathname === '/admin/dashboard'

  return (
    <PageProvider>
      <Navbar />
      <Sidebar />
      <main className={`h-screen w-screen ${isDashboard ? '' : 'pt-(--nav-offset)'}`}>
        {children}
      </main>
    </PageProvider>
  )
}

export default React.memo<Props>(Layout)
