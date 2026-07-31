'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { watchHref } from '@/lib/source'
import { useLibrary } from '@/store/library'
import { PosterCard } from './PosterCard'
import { ConfirmDialog } from './ConfirmDialog'
import type { HistoryEntry } from '@/lib/library-doc'

export function HistoryCard({
  entry,
  caption,
}: {
  entry: HistoryEntry
  caption?: string
}) {
  const forget = useLibrary((state) => state.forget)
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="group/history relative">
      <PosterCard
        id={entry.id}
        media={entry.media}
        title={entry.title}
        posterPath={entry.posterPath}
        year={entry.year}
        href={watchHref(entry.media, entry.id, entry.season, entry.episode)}
        progress={
          entry.episode && entry.totalEpisodes
            ? entry.episode / entry.totalEpisodes
            : undefined
        }
        caption={caption}
      />

      <button
        type="button"
        aria-label={`Remove ${entry.title} from history`}
        title="Remove from history"
        onClick={() => setConfirming(true)}
        className="absolute top-1.5 left-1.5 grid size-6 place-items-center rounded-xs bg-ink/85 text-dim opacity-0 backdrop-blur-sm transition hover:text-flare focus-visible:opacity-100 group-hover/history:opacity-100"
      >
        <X size={12} />
      </button>

      <ConfirmDialog
        open={confirming}
        title="Remove from history?"
        body={`“${entry.title}” leaves Recent and Pick up where you left off, here and on every device you are signed in on. Playing it again puts it back.`}
        confirmLabel="Remove"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          forget(entry.media, entry.id)
          setConfirming(false)
        }}
      />
    </div>
  )
}
