'use client'

import Link from 'next/link'
import { ShieldCheck, ShieldOff, X } from 'lucide-react'
import type { MediaType } from '@/lib/types'
import type { Source } from '@/lib/source-registry'

function noteFor(source: Source, media: MediaType): string | null {
  if (!source.movie && !source.series) return 'Not set'
  if (media === 'tv' && !source.series) return 'Films only'
  return "Can't play this title"
}

export function SourcePicker({
  open,
  onClose,
  sources,
  activeId,
  media,
  playable,
  onSelect,
  sandboxed,
  onSandboxedChange,
}: {
  open: boolean
  onClose: () => void
  sources: Source[]
  activeId: string
  media: MediaType
  playable: (source: Source) => boolean
  onSelect: (id: string) => void
  sandboxed: boolean
  onSandboxedChange: (on: boolean) => void
}) {
  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 z-30 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out-soft ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        inert={!open}
        aria-label="Source"
        className={`absolute inset-x-0 bottom-0 z-40 flex max-h-[75%] flex-col rounded-t-lg border-t border-line bg-ink/95 backdrop-blur-xl transition-transform duration-300 ease-out-soft sm:top-0 sm:left-auto sm:h-auto sm:max-h-none sm:w-full sm:max-w-xs sm:rounded-none sm:border-t-0 sm:border-l ${
          open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        }`}
      >
        <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line sm:hidden" />
        <header className="flex shrink-0 items-center gap-3 px-5 pt-3 pb-3 sm:pt-5">
          <h2 className="display flex-1 truncate text-lg font-semibold text-paper">
            Source
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sources"
            className="grid size-10 place-items-center rounded-xs text-dim transition-colors hover:text-paper active:opacity-60 sm:size-8"
          >
            <X size={16} />
          </button>
        </header>

        <p className="shrink-0 px-5 pb-4 text-2xs text-dim">
          For this title only. Change the default in{' '}
          <Link href="/settings" className="text-mist underline underline-offset-4">
            settings
          </Link>
          .
        </p>

        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain border-t border-line">
          {sources.map((source) => {
            const active = source.id === activeId
            const disabled = !playable(source)

            return (
              <li key={source.id}>
                <button
                  type="button"
                  onClick={() => onSelect(source.id)}
                  disabled={disabled}
                  aria-current={active ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors pointer-coarse:py-3.5 ${
                    active ? 'bg-surface' : 'enabled:hover:bg-surface/50 enabled:active:bg-surface/50'
                  } disabled:opacity-40`}
                >
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${
                      active ? 'bg-amber' : 'bg-line'
                    }`}
                  />
                  <span
                    className={`flex-1 truncate font-mono text-xs ${
                      active ? 'text-paper' : 'text-mist'
                    }`}
                  >
                    {source.label}
                  </span>
                  {disabled && (
                    <span className="label shrink-0 text-2xs text-dim">
                      {noteFor(source, media)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="shrink-0 border-t border-line px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <button
            type="button"
            role="switch"
            aria-checked={sandboxed}
            onClick={() => onSandboxedChange(!sandboxed)}
            className="flex w-full items-center gap-3 py-1.5 text-left active:opacity-70"
          >
            {sandboxed ? (
              <ShieldCheck size={16} className="shrink-0 text-amber" />
            ) : (
              <ShieldOff size={16} className="shrink-0 text-flare" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-paper">Block pop-ups</span>
              <span className="block text-2xs text-dim">
                {sandboxed
                  ? 'Stops new tabs and redirects. Turn off only if the player refuses to load.'
                  : 'Off for this title. Ads can open tabs and redirect.'}
              </span>
            </span>
            <span
              aria-hidden
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                sandboxed ? 'bg-amber' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-ink transition-transform duration-200 ease-out-soft ${
                  sandboxed ? 'translate-x-4' : ''
                }`}
              />
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
