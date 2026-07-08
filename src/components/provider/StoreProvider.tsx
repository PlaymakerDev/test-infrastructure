'use client'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '@/stores/store'
// Side-effect import: registers dayjs' `buddhistEra` plugin once at the app
// root so the `BBBB` format token works app-wide (BuddhistDatePicker + any
// Thai-formatted date labels). Must run before any tree that renders a
// Buddhist-year date, which is why it's bolted onto the outermost 'use client'
// provider. Safe against duplicate extend calls — dayjs no-ops re-registration.
import '@/configs/dayjs'

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [store] = useState<AppStore>(() => makeStore())

  return <Provider store={store}>{children}</Provider>
}