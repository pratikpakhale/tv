'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useContinueWatching, useLibrary, useSavedTitles } from '@/store/library'
import { PosterCard } from '@/components/PosterCard'
import { HistoryCard } from '@/components/HistoryCard'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Grid } from '@/components/Row'
import { Empty } from '@/components/states'
import { episodeCode, relativeTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/seo'

/**
 * Confirmed, because clearing is a tombstone sweep that the next sync pushes to
 * every other device. There is no undo: the merge in `library-doc.ts` decides on
 * timestamps, and a restored entry keeps its original `watchedAt`, so the newer
 * tombstone would win and take the entries away again.
 */
function ClearHistory({ count }: { count: number }) {
  const clearHistory = useLibrary((state) => state.clearHistory)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label text-2xs text-dim transition-colors hover:text-amber"
      >
        Clear
      </button>

      <ConfirmDialog
        open={open}
        title="Clear watch history?"
        body={`All ${count} ${count === 1 ? 'entry goes' : 'entries go'}, here and on every other device you are signed in on. This cannot be undone.`}
        confirmLabel="Clear history"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          clearHistory()
          setOpen(false)
        }}
      />
    </>
  )
}

export default function LibraryPage() {
  const saved = useSavedTitles()
  const history = useContinueWatching()

  useDocumentTitle('Library')

  if (!saved.length && !history.length)
    return (
      <Empty
        title="Your library is empty"
        hint="Save a film or series from its page and it lands here. Anything you play shows up under Recent."
        action={
          <Link
            href="/browse/movie"
            className="label text-2xs text-amber underline underline-offset-4"
          >
            Browse films
          </Link>
        }
      />
    )

  return (
    <div className="space-y-10">
      {saved.length > 0 && (
        <section className="space-y-3">
          <h1 className="eyebrow">Saved · {saved.length}</h1>
          <Grid>
            {saved.map((entry) => (
              <PosterCard key={`${entry.media}:${entry.id}`} {...entry} />
            ))}
          </Grid>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <h2 className="eyebrow">Recent · {history.length}</h2>
            <ClearHistory count={history.length} />
          </div>
          <Grid>
            {history.map((entry) => (
              <HistoryCard
                key={`${entry.media}:${entry.id}`}
                entry={entry}
                caption={
                  entry.season !== undefined && entry.episode !== undefined
                    ? `${episodeCode(entry.season, entry.episode)} · ${relativeTime(entry.watchedAt)}`
                    : relativeTime(entry.watchedAt)
                }
              />
            ))}
          </Grid>
        </section>
      )}
    </div>
  )
}
