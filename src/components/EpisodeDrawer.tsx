'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useSeason } from '@/lib/queries'
import { runtime, still } from '@/lib/format'
import { Timecode } from './Timecode'
import type { TitleDetail } from '@/lib/types'

export function EpisodeDrawer({
  open,
  onClose,
  detail,
  season,
  episode,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  detail: TitleDetail
  season: number
  episode: number
  onSelect: (season: number, episode: number) => void
}) {
  const seasons = (detail.seasons ?? []).filter(
    (item) => item.season_number > 0 && item.episode_count > 0,
  )

  const [active, setActive] = useState(season)
  const current = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (open) setActive(season)
  }, [open, season])

  const query = useSeason(detail.id, active, open && seasons.length > 0)

  useEffect(() => {
    if (open && query.data) current.current?.scrollIntoView({ block: 'center' })
  }, [open, query.data])

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
        aria-label="Episodes"
        className={`absolute inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-line bg-ink/95 backdrop-blur-xl transition-transform duration-300 ease-out-soft ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-3">
          <h2 className="display flex-1 truncate text-lg font-semibold text-paper">
            Episodes
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close episodes"
            className="grid size-8 place-items-center rounded-xs text-dim transition-colors hover:text-paper"
          >
            <X size={16} />
          </button>
        </header>

        <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto px-5 pb-4">
          {seasons.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.season_number)}
              aria-pressed={active === item.season_number}
              className={`data shrink-0 rounded-xs border px-2.5 py-1 text-2xs transition-colors ${
                active === item.season_number
                  ? 'border-amber bg-amber text-ink'
                  : 'border-line text-mist hover:border-mist/40 hover:text-paper'
              }`}
            >
              S{String(item.season_number).padStart(2, '0')}
            </button>
          ))}
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto border-t border-line">
          {query.isPending &&
            Array.from({ length: 8 }, (_, index) => (
              <li key={index} className="h-20 animate-pulse bg-surface/40" />
            ))}

          {query.data?.episodes.map((item) => {
            const playing =
              item.season_number === season && item.episode_number === episode

            return (
              <li key={item.id} ref={playing ? current : undefined}>
                <button
                  type="button"
                  onClick={() =>
                    onSelect(item.season_number, item.episode_number)
                  }
                  aria-current={playing ? 'true' : undefined}
                  className={`group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    playing ? 'bg-surface' : 'hover:bg-surface/50'
                  }`}
                >
                  <span
                    className={`data w-6 shrink-0 text-2xs ${
                      playing ? 'text-amber' : 'text-dim'
                    }`}
                  >
                    {String(item.episode_number).padStart(2, '0')}
                  </span>

                  <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xs bg-surface">
                    {still(item.still_path) && (
                      <img
                        src={still(item.still_path)!}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        playing ? 'text-paper' : 'text-paper/80 group-hover:text-paper'
                      }`}
                    >
                      {item.name}
                    </p>
                    <Timecode
                      className="mt-1"
                      parts={[
                        playing ? 'Now playing' : item.air_date?.slice(0, 10),
                        item.runtime ? runtime(item.runtime) : null,
                      ]}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>
    </>
  )
}
