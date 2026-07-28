'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { normalizeDoc, type LibraryDoc } from '../lib/library-doc'
import { useLibrary } from './library'

const DEBOUNCE_MS = 1500

function snapshot(): LibraryDoc {
  const { saved, history } = useLibrary.getState()
  return { saved, history }
}

export function useLibrarySync() {
  const { isSignedIn } = useAuth()
  const applying = useRef(false)
  const dirty = useRef(false)

  useEffect(() => {
    if (!isSignedIn) return

    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const push = async (keepalive = false) => {
      dirty.current = false
      const response = await fetch('/api/library', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot()),
        keepalive,
      })
      if (!response.ok || !active) return

      const merged = normalizeDoc(await response.json())
      applying.current = true
      useLibrary.setState(merged)
      applying.current = false
    }

    const schedule = () => {
      dirty.current = true
      clearTimeout(timer)
      timer = setTimeout(() => void push().catch(() => {}), DEBOUNCE_MS)
    }

    const flush = () => {
      if (!dirty.current) return
      clearTimeout(timer)
      void push(true).catch(() => {})
    }

    void push().catch(() => {})

    const unsubscribe = useLibrary.subscribe(() => {
      if (applying.current) return
      schedule()
    })

    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', flush)

    return () => {
      active = false
      clearTimeout(timer)
      unsubscribe()
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', flush)
    }
  }, [isSignedIn])
}
