import React from 'react'
import { LoginProvider } from '@/features/auth/login/context';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = (props) => {
  const {
    children
  } = props

  return (
    <LoginProvider>
      <header>Login Page</header>
      <main>{children}</main>
    </LoginProvider>
  )
}

export default React.memo<Props>(Layout)
