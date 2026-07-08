import React from 'react'

interface Props {
  children: React.ReactNode
}

const Layout: React.FC<Props> = (props) => {
  const { children } = props
  return <main className='min-h-dvh'>{children}</main>
}

export default React.memo<Props>(Layout)
