import React from 'react'
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { PageProvider } from '../provider/ContextProvider';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = (props) => {
  const { children } = props

  return (
    <PageProvider>
      <Navbar />
      <Sidebar />
      <main className='h-screen w-screen'>
        {children}
      </main>
    </PageProvider>
  )
}

export default React.memo<Props>(Layout)
