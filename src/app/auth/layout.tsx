import React from 'react'

// The login screen reads the URL via useSearchParams — same build-time
// prerender constraint as /admin (see src/app/admin/layout.tsx). Render
// per-request instead of failing the static export.
export const dynamic = 'force-dynamic'

interface Props {
  children: React.ReactNode
}

const Layout: React.FC<Props> = (props) => {
  const { children } = props
  return <main className='min-h-dvh'>{children}</main>
}

export default React.memo<Props>(Layout)
