'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Player chrome that gets out of the way. `pinned` holds it open for as long as
 * something on top of the video needs reading — a drawer, an empty state.
 *
 * Pointer movement over the video cannot wake it: the source plays in a
 * cross-origin iframe and swallows its own events. The chrome bar listens for
 * its own hover instead, which is why it keeps pointer events while faded.
 */
export function useAutoHide(delay: number, pinned = false) {
  const [hidden, setHidden] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wake = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setHidden(false)
    timer.current = setTimeout(() => setHidden(true), delay)
  }, [delay])

  useEffect(() => {
    if (pinned) {
      if (timer.current) clearTimeout(timer.current)
      setHidden(false)
      return
    }

    wake()
    window.addEventListener('keydown', wake)
    return () => {
      window.removeEventListener('keydown', wake)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [pinned, wake])

  return { hidden: hidden && !pinned, wake }
}
