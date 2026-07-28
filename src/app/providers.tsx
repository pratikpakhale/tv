'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrefsProvider } from '@/components/PrefsProvider'
import { useLibrarySync } from '@/store/sync'

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 30,
          },
        },
      }),
  )

  useLibrarySync()

  return (
    <QueryClientProvider client={client}>
      <PrefsProvider>{children}</PrefsProvider>
    </QueryClientProvider>
  )
}
