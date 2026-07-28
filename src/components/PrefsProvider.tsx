'use client'

import { useMemo, type ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { PrefsContext } from '../lib/prefs-context'
import { normalizePrefs } from '../lib/prefs'

export function PrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const stored = user?.publicMetadata?.prefs

  const prefs = useMemo(() => normalizePrefs(stored), [stored])

  return <PrefsContext value={prefs}>{children}</PrefsContext>
}
