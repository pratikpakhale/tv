'use client'

import Link from 'next/link'
import { Play, Star } from 'lucide-react'
import { useShelf, useTrending } from '@/lib/queries'
import { tmdb } from '@/lib/tmdb'
import { TitleCard } from '@/components/PosterCard'
import { HistoryCard } from '@/components/HistoryCard'
import { Grid, Row, RowItem } from '@/components/Row'
import { SkeletonRow } from '@/components/states'
import { useContinueWatching } from '@/store/library'
import {
  backdrop,
  episodeCode,
  mediaTypeOf,
  rating,
  titleOf,
  yearOf,
} from '@/lib/format'
import { watchHref } from '@/lib/source'
import { Timecode } from '@/components/Timecode'
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

/* Full-bleed on phones, where it is the first thing under the thumb; a framed
   letterbox from `md` up, where the rail and header already frame the page. */
function Feature({ item }: { item: TitleSummary }) {
  const media = mediaTypeOf(item)
  const details = `/title/${media}/${item.id}`
  const score = item.vote_average > 0 && (
    <span className="flex items-center gap-1">
      <Star size={9} className="fill-amber text-amber" />
      {rating(item.vote_average)}
    </span>
  )

  return (
    <section className="relative -mx-4 -mt-5 overflow-hidden bg-surface md:mx-0 md:mt-0 md:rounded-sm md:ring-1 md:ring-line">
      <img
        src={backdrop(item.backdrop_path)!}
        alt=""
        className="aspect-[4/5] w-full object-cover sm:aspect-[16/7]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent sm:bg-gradient-to-r sm:from-ink/90 sm:via-ink/40" />

      <div className="absolute inset-x-0 bottom-0 space-y-3 px-4 pb-5 sm:max-w-xl sm:p-8">
        <p className="eyebrow text-amber">
          Trending · {media === 'tv' ? 'Series' : 'Film'}
        </p>
        <h2 className="display text-2xl font-semibold text-paper sm:text-3xl">
          <Link href={details}>{titleOf(item)}</Link>
        </h2>
        <Timecode
          className="text-paper/70"
          parts={[yearOf(item), score]}
        />
        {item.overview && (
          <p className="line-clamp-2 hidden max-w-lg text-sm text-paper/75 sm:block">
            {item.overview}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Link
            href={watchHref(media, item.id)}
            className="label inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xs bg-amber px-5 text-2xs text-ink transition active:scale-[0.97] sm:h-9 sm:flex-none"
          >
            <Play size={12} className="fill-ink" />
            Play
          </Link>
          <Link
            href={details}
            className="label inline-flex h-11 flex-1 items-center justify-center rounded-xs border border-paper/20 bg-ink/40 px-5 text-2xs text-paper backdrop-blur-sm transition hover:border-paper/40 active:scale-[0.97] sm:h-9 sm:flex-none"
          >
            Details
          </Link>
        </div>
      </div>
    </section>
  )
}

function ContinueWatching() {
  const entries = useContinueWatching()
  if (!entries.length) return null

  return (
    <Row heading="Pick up where you left off">
      {entries.slice(0, 12).map((entry) => (
        <RowItem key={`${entry.media}:${entry.id}`}>
          <HistoryCard
            entry={entry}
            caption={
              entry.season !== undefined && entry.episode !== undefined
                ? episodeCode(entry.season, entry.episode)
                : entry.year
            }
          />
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

  const results = trending.data?.results ?? []
  const lead = results.find(
    (item) =>
      item.backdrop_path &&
      (item.media_type === 'movie' || item.media_type === 'tv'),
  )
  const rest = results.filter((item) => item !== lead)

  return (
    <div className="space-y-10">
      {trending.isPending ? (
        <div className="-mx-4 -mt-5 aspect-[4/5] animate-pulse bg-surface sm:aspect-[16/7] md:mx-0 md:mt-0 md:rounded-sm" />
      ) : (
        lead && <Feature item={lead} />
      )}

      <ContinueWatching />

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="eyebrow">Trending this week</h2>
        </div>
        {trending.isPending ? (
          <SkeletonRow count={12} />
        ) : (
          <Grid>
            {rest
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
