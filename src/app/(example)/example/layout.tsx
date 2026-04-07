import React from 'react'
import { ExampleProvider } from '@/features/example/example/context';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = (props) => {
  const {
    children
  } = props

  return (
    <ExampleProvider>
      <main>{children}</main>
    </ExampleProvider>
  )
}

export default React.memo<Props>(Layout)
