import type { ReactNode } from 'react'
import { BRAND, DESCRIPTION } from '../lib/brand'

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+4rem)]">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="display text-3xl font-semibold text-amber">{BRAND}</p>
          <p className="mt-2 max-w-xs text-sm text-dim">{DESCRIPTION}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
