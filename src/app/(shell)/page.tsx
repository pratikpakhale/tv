'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { useShelf, useTrending } from '@/lib/queries'
import { tmdb } from '@/lib/tmdb'
import { PosterCard, TitleCard } from '@/components/PosterCard'
import { Grid, Row, RowItem } from '@/components/Row'
import { SkeletonRow } from '@/components/states'
import { useContinueWatching, useLibrary } from '@/store/library'
import { episodeCode } from '@/lib/format'
import type { TitleSummary } from '@/lib/types'

function Shelf({
  heading,
  to,
  items,
  loading,
}: {
  heading: string
  to?: string
  items?: TitleSummary[]
  loading: boolean
}) {
  if (loading) {
    return (
      <section>
        <h2 className="eyebrow mb-3">{heading}</h2>
        <SkeletonRow />
      </section>
    )
  }
  if (!items?.length) return null

  return (
    <Row
      heading={heading}
      action={
        to && (
          <Link
            href={to}
            className="label text-2xs text-dim transition-colors hover:text-amber"
          >
            All
          </Link>
        )
      }
    >
      {items.slice(0, 20).map((item) => (
        <RowItem key={item.id}>
          <TitleCard item={item} />
        </RowItem>
      ))}
    </Row>
  )
}

function ContinueWatching() {
  const entries = useContinueWatching()
  const forget = useLibrary((state) => state.forget)
  if (!entries.length) return null

  return (
    <Row heading="Pick up where you left off">
      {entries.slice(0, 12).map((entry) => (
        <RowItem key={`${entry.media}:${entry.id}`}>
          <div className="relative">
            <PosterCard
              id={entry.id}
              media={entry.media}
              title={entry.title}
              posterPath={entry.posterPath}
              year={entry.year}
              progress={
                entry.episode && entry.totalEpisodes
                  ? entry.episode / entry.totalEpisodes
                  : undefined
              }
              caption={
                entry.season !== undefined && entry.episode !== undefined
                  ? episodeCode(entry.season, entry.episode)
                  : entry.year
              }
            />
            <button
              type="button"
              aria-label={`Remove ${entry.title} from continue watching`}
              onClick={() => forget(entry.media, entry.id)}
              className="absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-xs bg-ink/85 text-dim opacity-0 backdrop-blur-sm transition hover:text-paper focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X size={11} />
            </button>
          </div>
        </RowItem>
      ))}
    </Row>
  )
}

export default function HomePage() {
  const trending = useTrending('all')
  const films = useShelf('movie-popular', (region) =>
    tmdb.popular('movie', region),
  )
  const series = useShelf('tv-popular', (region) => tmdb.popular('tv', region))
  const cinemas = useShelf('now-playing', (region) => tmdb.nowPlaying(region))
  const acclaimed = useShelf('movie-top', (region) =>
    tmdb.topRated('movie', region),
  )

  const [lead, ...rest] = trending.data?.results ?? []

  return (
    <div className="space-y-10">
      <ContinueWatching />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="eyebrow">Trending this week</h2>
        </div>
        {trending.isPending ? (
          <SkeletonRow count={12} />
        ) : (
          <Grid>
            {[lead, ...rest]
              .filter(Boolean)
              .slice(0, 14)
              .map((item) => (
                <TitleCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
          </Grid>
        )}
      </section>

      <Shelf
        heading="In cinemas"
        items={cinemas.data?.results}
        loading={cinemas.isPending}
      />
      <Shelf
        heading="Popular films"
        to="/browse/movie"
        items={films.data?.results}
        loading={films.isPending}
      />
      <Shelf
        heading="Popular series"
        to="/browse/tv"
        items={series.data?.results}
        loading={series.isPending}
      />
      <Shelf
        heading="Highest rated"
        to="/browse/movie"
        items={acclaimed.data?.results}
        loading={acclaimed.isPending}
      />
    </div>
  )
}
