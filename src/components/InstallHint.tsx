'use client'

import { useEffect, useState } from 'react'
import { Share, SquarePlus, X } from 'lucide-react'

const DISMISSED_KEY = 'tv-install-hint-dismissed'

/* Chromium's install event; not in the DOM lib yet. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = { kind: 'ios' } | { kind: 'prompt'; event: InstallPromptEvent }

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/* iPadOS reports itself as a Mac; the touch points give it away. */
function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  )
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * One quiet nudge toward installing. iOS has no install API, only the Share
 * sheet, so there it explains the two taps; Chromium hands over a prompt to
 * fire from a button. Dismissing is remembered per device.
 */
export function InstallHint() {
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return

    if (isIOS()) {
      setMode({ kind: 'ios' })
      return
    }

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setMode({ kind: 'prompt', event: event as InstallPromptEvent })
    }
    const onInstalled = () => setMode(null)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!mode) return null

  const dismiss = () => {
    setMode(null)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      /* private mode: it just comes back next visit */
    }
  }

  const install = async () => {
    if (mode.kind !== 'prompt') return
    await mode.event.prompt()
    const { outcome } = await mode.event.userChoice
    if (outcome === 'accepted') setMode(null)
    else dismiss()
  }

  return (
    <div
      role="region"
      aria-label="Install app"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-30 flex items-center gap-3 rounded-sm border border-line bg-raise py-3 pr-2 pl-4 shadow-2xl shadow-ink md:inset-x-auto md:right-6 md:bottom-6 md:w-96"
    >
      <span className="display grid size-10 shrink-0 place-items-center rounded-sm bg-ink text-base font-semibold text-amber ring-1 ring-line">
        TV.
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-paper">Put TV. on your Home Screen</p>
        {mode.kind === 'ios' ? (
          <p className="mt-0.5 text-2xs text-mist">
            Tap{' '}
            <Share size={12} aria-label="Share" className="inline -translate-y-px text-paper" />{' '}
            then{' '}
            <span className="whitespace-nowrap text-paper">
              <SquarePlus size={12} aria-hidden className="inline -translate-y-px" />{' '}
              Add to Home Screen
            </span>
          </p>
        ) : (
          <p className="mt-0.5 text-2xs text-mist">
            Full screen, its own icon, and the pages you opened still load offline.
          </p>
        )}
      </div>

      {mode.kind === 'prompt' && (
        <button
          type="button"
          onClick={() => void install()}
          className="label h-9 shrink-0 rounded-xs bg-amber px-3 text-2xs text-ink transition active:scale-[0.97]"
        >
          Install
        </button>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="grid size-9 shrink-0 place-items-center rounded-xs text-dim transition-colors hover:text-paper active:opacity-60"
      >
        <X size={16} />
      </button>
    </div>
  )
}
