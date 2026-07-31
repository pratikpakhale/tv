'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
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
}: {
  open: boolean
  onClose: () => void
  sources: Source[]
  activeId: string
  media: MediaType
  playable: (source: Source) => boolean
  onSelect: (id: string) => void
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
        className={`absolute inset-y-0 right-0 z-40 flex w-full max-w-xs flex-col border-l border-line bg-ink/95 backdrop-blur-xl transition-transform duration-300 ease-out-soft ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-3">
          <h2 className="display flex-1 truncate text-lg font-semibold text-paper">
            Source
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sources"
            className="grid size-8 place-items-center rounded-xs text-dim transition-colors hover:text-paper"
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

        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto border-t border-line">
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
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    active ? 'bg-surface' : 'enabled:hover:bg-surface/50'
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
      </aside>
    </>
  )
}
