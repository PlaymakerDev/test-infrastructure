"use client"
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface Props {
  children: React.ReactNode
}

/**
 * TanStack Query setup for the app. Mounted once at the root layout so every
 * route/component can call `useQuery`/`useMutation` directly.
 *
 * Server-state defaults are tuned for a dashboard app:
 * - `staleTime: 60s` — data stays "fresh" for a minute before background refetch
 * - `refetchOnWindowFocus: false` — dashboards shouldn't blink when tabs change
 * - `retry: 1` — one auto-retry on failure (BaseService handles 401 separately)
 *
 * The `useState` wrapper guarantees the same client across re-renders without
 * sharing state between users in SSR. */
const QueryProvider: React.FC<Props> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools — only renders in development; tree-shaken in production. */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-left' />
    </QueryClientProvider>
  )
}

export default QueryProvider
