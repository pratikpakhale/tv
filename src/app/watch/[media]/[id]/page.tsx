'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  redirect,
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useSeason, useTitle } from '@/lib/queries'
import { resolveSourceUrl, youtubeEmbedUrl } from '@/lib/source'
import { usePrefs } from '@/lib/prefs-context'
import { episodeCode, titleOf, yearOf } from '@/lib/format'
import { useDocumentTitle } from '@/lib/seo'
import { Timecode } from '@/components/Timecode'
import { ErrorState } from '@/components/states'
import { useLibrary } from '@/store/library'
import type { MediaType, Video } from '@/lib/types'

function pickTrailer(videos?: Video[]): Video | undefined {
  if (!videos?.length) return undefined
  const youtube = videos.filter((video) => video.site === 'YouTube')
  return (
    youtube.find((video) => video.type === 'Trailer' && video.official) ??
    youtube.find((video) => video.type === 'Trailer') ??
    youtube.find((video) => video.type === 'Teaser') ??
    youtube[0]
  )
}

function Watch({
  mediaType,
  numericId,
}: {
  mediaType: MediaType
  numericId: number
}) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const recordWatch = useLibrary((state) => state.recordWatch)

  const season = Number(params.get('season') ?? 1)
  const episode = Number(params.get('episode') ?? 1)

  const query = useTitle(mediaType, numericId)
  const seasonQuery = useSeason(numericId, season, mediaType === 'tv')

  const prefs = usePrefs()
  const template =
    mediaType === 'tv' ? prefs.sourceUrlSeries : prefs.sourceUrlMovie

  const [useTrailer, setUseTrailer] = useState(!template)

  const detail = query.data
  const trailer = useMemo(
    () => pickTrailer(detail?.videos?.results),
    [detail?.videos?.results],
  )

  const episodes = seasonQuery.data?.episodes ?? []
  const current = episodes.find((item) => item.episode_number === episode)

  useDocumentTitle(
    detail
      ? mediaType === 'tv'
        ? `${titleOf(detail)} ${episodeCode(season, episode)}`
        : titleOf(detail)
      : null,
  )

  useEffect(() => {
    if (!detail) return
    recordWatch({
      id: detail.id,
      media: mediaType,
      title: titleOf(detail),
      posterPath: detail.poster_path,
      year: yearOf(detail),
      season: mediaType === 'tv' ? season : undefined,
      episode: mediaType === 'tv' ? episode : undefined,
      totalEpisodes:
        mediaType === 'tv' ? episodes.length || undefined : undefined,
      watchedAt: Date.now(),
    })
  }, [detail, mediaType, season, episode, episodes.length, recordWatch])

  if (query.isError)
    return (
      <div className="p-8">
        <ErrorState error={query.error} />
      </div>
    )

  const sourceUrl = detail
    ? resolveSourceUrl(template, {
        media: mediaType,
        tmdbId: detail.id,
        imdbId: detail.external_ids?.imdb_id,
        season: mediaType === 'tv' ? season : undefined,
        episode: mediaType === 'tv' ? episode : undefined,
      })
    : null

  const playing = useTrailer
    ? trailer && youtubeEmbedUrl(trailer.key)
    : (sourceUrl ?? (trailer && youtubeEmbedUrl(trailer.key)))

  const step = (direction: 1 | -1) => {
    const next = episode + direction
    if (next < 1 || next > episodes.length) return
    const updated = new URLSearchParams(params.toString())
    updated.set('season', String(season))
    updated.set('episode', String(next))
    router.replace(`${pathname}?${updated}`, { scroll: false })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-ink">
      <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={() => router.push(`/title/${mediaType}/${numericId}`)}
          aria-label="Close player"
          className="grid size-8 shrink-0 place-items-center rounded-xs text-dim transition-colors hover:text-paper"
        >
          <X size={16} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-paper">
            {detail ? titleOf(detail) : 'Loading'}
          </p>
          <Timecode
            parts={[
              mediaType === 'tv'
                ? episodeCode(season, episode)
                : yearOf(detail ?? {}),
              current?.name,
            ]}
          />
        </div>

        {mediaType === 'tv' && episodes.length > 0 && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={episode <= 1}
              aria-label="Previous episode"
              className="grid size-8 place-items-center rounded-xs text-dim transition-colors hover:text-paper disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={episode >= episodes.length}
              aria-label="Next episode"
              className="grid size-8 place-items-center rounded-xs text-dim transition-colors hover:text-paper disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </header>

      <div className="relative min-h-0 flex-1 bg-black">
        {playing ? (
          <iframe
            key={playing}
            src={playing}
            title={detail ? titleOf(detail) : 'Player'}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
            className="absolute inset-0 block size-full border-0"
          />
        ) : (
          <div className="grid h-full place-items-center px-6">
            <div className="max-w-md space-y-3 text-center">
              <p className="display text-xl font-semibold text-paper">
                No source configured
              </p>
              <p className="text-base text-mist">
                Add a playback template on the settings page to point the player
                at a backend, or open a title that has a trailer on file.
              </p>
              <div className="label flex items-center justify-center gap-5 text-2xs text-amber">
                <Link href="/settings" className="underline underline-offset-4">
                  Settings
                </Link>
                <Link
                  href={`/title/${mediaType}/${numericId}`}
                  className="underline underline-offset-4"
                >
                  Back to title
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <span className="eyebrow mr-1">Source</span>

        <button
          type="button"
          onClick={() => setUseTrailer(false)}
          disabled={!sourceUrl}
          aria-pressed={!useTrailer && Boolean(sourceUrl)}
          className={`label rounded-xs border px-2.5 py-1 text-2xs transition-colors disabled:opacity-30 ${
            !useTrailer && sourceUrl
              ? 'border-amber bg-amber text-ink'
              : 'border-line text-mist hover:border-mist/40 hover:text-paper'
          }`}
        >
          {prefs.sourceLabel}
        </button>

        <button
          type="button"
          onClick={() => setUseTrailer(true)}
          disabled={!trailer}
          aria-pressed={useTrailer}
          className={`label rounded-xs border px-2.5 py-1 text-2xs transition-colors disabled:opacity-30 ${
            useTrailer && trailer
              ? 'border-amber bg-amber text-ink'
              : 'border-line text-mist hover:border-mist/40 hover:text-paper'
          }`}
        >
          Trailer
        </button>

        {!template && (
          <Link
            href="/settings"
            className="ml-auto text-2xs text-dim transition-colors hover:text-amber"
          >
            No source configured — trailers only
          </Link>
        )}
      </footer>
    </div>
  )
}

export default function WatchPage() {
  const { media, id } = useParams<{ media: string; id: string }>()
  const numericId = Number(id)
  if ((media !== 'movie' && media !== 'tv') || !Number.isFinite(numericId))
    redirect('/')

  return (
    <Suspense fallback={<div className="h-dvh bg-ink" />}>
      <Watch mediaType={media} numericId={numericId} />
    </Suspense>
  )
}
