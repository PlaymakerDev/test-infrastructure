import React, { Suspense } from 'react'
import SettingScreen from '@/features/admin/settings/overall/screen'

interface Props { }

// SettingScreen reads `?tab=` via useSearchParams — needs a Suspense boundary
// or `next build` fails to prerender this page.
const SettingPage: React.FC<Props> = () => {
  return (
    <Suspense>
      <SettingScreen />
    </Suspense>
  )
}

export default React.memo(SettingPage)
