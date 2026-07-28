'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { redirect, useParams, useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Play, Star } from 'lucide-react'
import { useSeason, useTitle } from '@/lib/queries'
import { usePrefs } from '@/lib/prefs-context'
import {
  backdrop,
  poster,
  profile,
  rating,
  runtime,
  still,
  titleOf,
  yearOf,
} from '@/lib/format'
import { useDocumentTitle } from '@/lib/seo'
import { Timecode } from '@/components/Timecode'
import { TitleCard } from '@/components/PosterCard'
import { Row, RowItem } from '@/components/Row'
import { ErrorState } from '@/components/states'
import { useLibrary } from '@/store/library'
import { keyOf } from '@/lib/library-doc'
import type { MediaType, TitleDetail } from '@/lib/types'

function Actions({ detail, media }: { detail: TitleDetail; media: MediaType }) {
  const { toggleSaved, saved } = useLibrary()
  const entry = saved[keyOf(media, detail.id)]
  const isSaved = Boolean(entry && !entry.deletedAt)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/watch/${media}/${detail.id}${media === 'tv' ? '?season=1&episode=1' : ''}`}
        className="label inline-flex items-center gap-2 rounded-xs bg-amber px-4 py-2 text-2xs text-ink transition-opacity hover:opacity-90"
      >
        <Play size={12} className="fill-ink" />
        {media === 'tv' ? 'Start series' : 'Play'}
      </Link>

      <button
        type="button"
        onClick={() =>
          toggleSaved({
            id: detail.id,
            media,
            title: titleOf(detail),
            posterPath: detail.poster_path,
            year: yearOf(detail),
          })
        }
        className="label inline-flex items-center gap-2 rounded-xs border border-line px-4 py-2 text-2xs text-mist transition-colors hover:border-mist/40 hover:text-paper"
      >
        {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
        {isSaved ? 'Saved' : 'Save'}
      </button>
    </div>
  )
}

function Availability({ detail }: { detail: TitleDetail }) {
  const { region: code } = usePrefs()
  const region = detail['watch/providers']?.results?.[code]
  const providers = [
    ...(region?.flatrate ?? []),
    ...(region?.rent ?? []),
    ...(region?.buy ?? []),
  ]
  if (!providers.length) return null

  const unique = providers.filter(
    (provider, index, all) =>
      all.findIndex((other) => other.provider_id === provider.provider_id) ===
      index,
  )

  return (
    <div className="space-y-2">
      <h2 className="eyebrow">Streaming in {code}</h2>
      <div className="flex flex-wrap items-center gap-2">
        {unique.slice(0, 10).map((provider) => (
          <img
            key={provider.provider_id}
            src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
            alt={provider.provider_name}
            title={provider.provider_name}
            className="size-8 rounded-xs ring-1 ring-line"
            loading="lazy"
          />
        ))}
        {region?.link && (
          <a
            href={region.link}
            target="_blank"
            rel="noreferrer"
            className="label ml-1 text-2xs text-dim transition-colors hover:text-amber"
          >
            Where to watch
          </a>
        )}
      </div>
      <p className="text-2xs text-dim">Availability data by JustWatch</p>
    </div>
  )
}

function Episodes({ detail }: { detail: TitleDetail }) {
  const seasons = (detail.seasons ?? []).filter(
    (season) => season.season_number > 0 && season.episode_count > 0,
  )
  const [active, setActive] = useState(seasons[0]?.season_number ?? 1)
  const router = useRouter()

  useEffect(() => {
    if (seasons.length && !seasons.some((s) => s.season_number === active))
      setActive(seasons[0].season_number)
  }, [seasons, active])

  const season = useSeason(detail.id, active, seasons.length > 0)
  if (!seasons.length) return null

  return (
    <section className="space-y-4">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
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

      <ul className="divide-y divide-line border-y border-line">
        {season.isPending &&
          Array.from({ length: 6 }, (_, index) => (
            <li key={index} className="h-16 animate-pulse bg-surface/40" />
          ))}

        {season.data?.episodes.map((episode) => (
          <li key={episode.id}>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/watch/tv/${detail.id}?season=${episode.season_number}&episode=${episode.episode_number}`,
                )
              }
              className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-surface/50"
            >
              <span className="data w-10 shrink-0 text-center text-2xs text-dim">
                {String(episode.episode_number).padStart(2, '0')}
              </span>

              <div className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-xs bg-surface sm:block">
                {still(episode.still_path) && (
                  <img
                    src={still(episode.still_path)!}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute inset-0 grid place-items-center bg-ink/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Play size={14} className="fill-paper text-paper" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-paper/90 group-hover:text-paper">
                  {episode.name}
                </p>
                <Timecode
                  className="mt-1"
                  parts={[
                    episode.air_date?.slice(0, 10),
                    episode.runtime ? runtime(episode.runtime) : null,
                    episode.vote_average > 0
                      ? `★ ${rating(episode.vote_average)}`
                      : null,
                  ]}
                />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function TitlePage() {
  const { media, id } = useParams<{ media: string; id: string }>()
  const isMedia = media === 'movie' || media === 'tv'
  const mediaType = (isMedia ? media : 'movie') as MediaType
  const numericId = Number(id)

  const query = useTitle(mediaType, numericId)
  useDocumentTitle(query.data ? titleOf(query.data) : null)

  if (!isMedia || !Number.isFinite(numericId)) redirect('/')

  if (query.isError) return <ErrorState error={query.error} />

  if (query.isPending)
    return (
      <div className="animate-pulse space-y-4">
        <div className="aspect-[21/9] w-full rounded-sm bg-surface" />
        <div className="h-8 w-2/3 rounded-xs bg-surface" />
        <div className="h-3 w-1/3 rounded-xs bg-surface" />
      </div>
    )

  const detail = query.data
  const hero = backdrop(detail.backdrop_path)
  const art = poster(detail.poster_path, 'w342')
  const cast = detail.credits?.cast.slice(0, 12) ?? []
  const related = detail.recommendations?.results.slice(0, 14) ?? []
  const length =
    mediaType === 'movie'
      ? runtime(detail.runtime)
      : `${detail.number_of_seasons ?? '—'} seasons`

  const score = detail.vote_average > 0 && (
    <span className="flex items-center gap-1 text-paper/70">
      <Star size={9} className="fill-amber text-amber" />
      {rating(detail.vote_average)}
    </span>
  )

  return (
    <div className="space-y-10">
      <header className="relative">
        {hero && (
          <div className="absolute inset-x-0 -top-6 h-[46vh] overflow-hidden md:-mx-8">
            <img
              src={hero}
              alt=""
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
          </div>
        )}

        <div className="relative flex flex-col gap-5 pt-[18vh] sm:flex-row sm:items-end sm:gap-6">
          {art && (
            <img
              src={art}
              alt=""
              className="w-28 shrink-0 rounded-sm ring-1 ring-line sm:w-40"
            />
          )}

          <div className="min-w-0 flex-1 space-y-3">
            <h1 className="display text-2xl font-semibold sm:text-3xl">
              {titleOf(detail)}
            </h1>

            <Timecode
              parts={[
                yearOf(detail),
                length,
                detail.genres
                  .slice(0, 3)
                  .map((genre) => genre.name)
                  .join(', '),
                score,
              ]}
            />

            <Actions detail={detail} media={mediaType} />
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {detail.tagline && (
            <p className="display border-l-2 border-amber pl-4 text-lg text-mist">
              {detail.tagline}
            </p>
          )}
          <p className="max-w-2xl text-base text-paper/80">
            {detail.overview || 'No synopsis on file.'}
          </p>

          {mediaType === 'tv' && <Episodes detail={detail} />}
        </div>

        <aside className="space-y-6">
          <Availability detail={detail} />

          {cast.length > 0 && (
            <div className="space-y-2">
              <h2 className="eyebrow">Cast</h2>
              <ul className="space-y-2">
                {cast.slice(0, 8).map((member) => (
                  <li key={member.id} className="flex items-center gap-2.5">
                    <div className="size-8 shrink-0 overflow-hidden rounded-full bg-surface">
                      {profile(member.profile_path) && (
                        <img
                          src={profile(member.profile_path)!}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-paper/90">
                        {member.name}
                      </p>
                      <p className="truncate text-2xs text-dim">
                        {member.character}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <Row heading="More like this">
          {related.map((item) => (
            <RowItem key={item.id}>
              <TitleCard item={item} />
            </RowItem>
          ))}
        </Row>
      )}
    </div>
  )
}
