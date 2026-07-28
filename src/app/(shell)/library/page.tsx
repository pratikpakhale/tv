'use client'

import Link from 'next/link'
import { useContinueWatching, useLibrary, useSavedTitles } from '@/store/library'
import { PosterCard } from '@/components/PosterCard'
import { Grid } from '@/components/Row'
import { Empty } from '@/components/states'
import { episodeCode, relativeTime } from '@/lib/format'
import { useDocumentTitle } from '@/lib/seo'

export default function LibraryPage() {
  const saved = useSavedTitles()
  const history = useContinueWatching()
  const clearHistory = useLibrary((state) => state.clearHistory)

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
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Recent · {history.length}</h2>
            <button
              type="button"
              onClick={clearHistory}
              className="label text-2xs text-dim transition-colors hover:text-amber"
            >
              Clear
            </button>
          </div>
          <Grid>
            {history.map((entry) => (
              <PosterCard
                key={`${entry.media}:${entry.id}`}
                {...entry}
                progress={
                  entry.episode && entry.totalEpisodes
                    ? entry.episode / entry.totalEpisodes
                    : undefined
                }
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
