'use client'

import { WifiOff } from 'lucide-react'
import { BRAND } from '@/lib/brand'

/**
 * Precached by the service worker and served for any navigation it has no
 * copy of while the network is down. Public in `proxy.ts`, so installing the
 * worker from the sign-in page does not precache a redirect instead.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pt-safe pb-safe">
      <span className="display text-xl font-semibold text-amber">{BRAND}</span>
      <WifiOff size={22} strokeWidth={1.75} className="mt-10 text-dim" />
      <h1 className="display mt-4 text-3xl font-semibold">You&rsquo;re offline</h1>
      <p className="mt-3 text-base text-mist">
        Anything you opened recently still works. This page wasn&rsquo;t one of
        them, and playback always needs a connection.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="label mt-8 inline-flex h-11 w-fit items-center rounded-xs bg-amber px-5 text-2xs text-ink transition active:scale-[0.97]"
      >
        Try again
      </button>
    </main>
  )
}
