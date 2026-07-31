'use client'

import { useCallback, useEffect, useState } from 'react'

const KEY = 'tv-recent-searches'
const MAX = 6

/**
 * Per-device, unlike the library: what you typed on your laptop is not a fact
 * about you worth syncing, and it would leak search terms into the blob
 * document that every device reads.
 */
function read(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((item) => typeof item === 'string').slice(0, MAX)
  } catch {
    return []
  }
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => setRecents(read()), [])

  const commit = useCallback((next: string[]) => {
    setRecents(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* private mode, or the quota is full — the list is disposable */
    }
  }, [])

  const remember = useCallback(
    (query: string) => {
      const value = query.trim()
      if (!value) return
      const rest = read().filter(
        (item) => item.toLowerCase() !== value.toLowerCase(),
      )
      commit([value, ...rest].slice(0, MAX))
    },
    [commit],
  )

  const forget = useCallback(
    (query: string) => commit(read().filter((item) => item !== query)),
    [commit],
  )

  const clear = useCallback(() => commit([]), [commit])

  return { recents, remember, forget, clear }
}
