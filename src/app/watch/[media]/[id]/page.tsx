'use client'

import type { ReactNode } from 'react'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  redirect,
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import {
  ArrowLeft,
  ListVideo,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { useSeason, useTitle } from '@/lib/queries'
import {
  pickTrailer,
  resolveSourceUrl,
  trailerHref,
  youtubeEmbedUrl,
} from '@/lib/source'
import { usePrefs } from '@/lib/prefs-context'
import { useAutoHide } from '@/lib/useAutoHide'
import { episodeCode, titleOf, yearOf } from '@/lib/format'
import { useDocumentTitle } from '@/lib/seo'
import { Timecode } from '@/components/Timecode'
import { EpisodeDrawer } from '@/components/EpisodeDrawer'
import { ErrorState } from '@/components/states'
import { useLibrary } from '@/store/library'
import type { MediaType, TitleDetail } from '@/lib/types'

const CHROME_DELAY = 3200

function playableSeasons(detail?: TitleDetail) {
  return (detail?.seasons ?? []).filter(
    (season) => season.season_number > 0 && season.episode_count > 0,
  )
}

function ChromeButton({
  label,
  hint,
  onClick,
  disabled,
  children,
}: {
  label: string
  hint?: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={hint ? `${label} (${hint})` : label}
      className="grid size-9 place-items-center rounded-xs border border-line/70 bg-ink/40 text-mist backdrop-blur-sm transition-colors hover:border-mist/40 hover:text-paper disabled:opacity-25 disabled:hover:border-line/70 disabled:hover:text-mist"
    >
      {children}
    </button>
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
  const isTrailer = params.get('trailer') === '1'

  const query = useTitle(mediaType, numericId)
  const seasonQuery = useSeason(
    numericId,
    season,
    mediaType === 'tv' && !isTrailer,
  )

  const prefs = usePrefs()
  const template =
    mediaType === 'tv' ? prefs.sourceUrlSeries : prefs.sourceUrlMovie

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const detail = query.data
  const trailer = useMemo(
    () => pickTrailer(detail?.videos?.results),
    [detail?.videos?.results],
  )

  const episodes = seasonQuery.data?.episodes ?? []
  const current = episodes.find((item) => item.episode_number === episode)

  useDocumentTitle(
    detail
      ? isTrailer
        ? `${titleOf(detail)} — Trailer`
        : mediaType === 'tv'
          ? `${titleOf(detail)} ${episodeCode(season, episode)}`
          : titleOf(detail)
      : null,
  )

  useEffect(() => {
    if (!detail || isTrailer) return
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
  }, [
    detail,
    isTrailer,
    mediaType,
    season,
    episode,
    episodes.length,
    recordWatch,
  ])

  const sourceUrl = detail
    ? resolveSourceUrl(template, {
        media: mediaType,
        tmdbId: detail.id,
        imdbId: detail.external_ids?.imdb_id,
        season: mediaType === 'tv' ? season : undefined,
        episode: mediaType === 'tv' ? episode : undefined,
      })
    : null

  const playing = isTrailer
    ? trailer && youtubeEmbedUrl(trailer.key)
    : sourceUrl

  const seasons = playableSeasons(detail)
  const index = seasons.findIndex((item) => item.season_number === season)
  const count =
    episodes.length ||
    seasons.find((item) => item.season_number === season)?.episode_count ||
    0

  const isSeries = mediaType === 'tv' && seasons.length > 0 && !isTrailer
  const hasPrev = isSeries && (episode > 1 || index > 0)
  const hasNext =
    isSeries &&
    ((count > 0 && episode < count) || (index >= 0 && index < seasons.length - 1))

  const go = useCallback(
    (nextSeason: number, nextEpisode: number) => {
      const updated = new URLSearchParams(params.toString())
      updated.set('season', String(nextSeason))
      updated.set('episode', String(nextEpisode))
      router.replace(`${pathname}?${updated}`, { scroll: false })
    },
    [params, pathname, router],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      if (mediaType !== 'tv') return
      const target = episode + direction
      if (target >= 1 && (count === 0 || target <= count))
        return go(season, target)
      if (index < 0) return

      const neighbour = seasons[index + direction]
      if (!neighbour) return
      go(
        neighbour.season_number,
        direction === 1 ? 1 : neighbour.episode_count,
      )
    },
    [count, episode, go, index, mediaType, season, seasons],
  )

  const exit = useCallback(
    () => router.push(`/title/${mediaType}/${numericId}`),
    [mediaType, numericId, router],
  )

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const { hidden, wake } = useAutoHide(
    CHROME_DELAY,
    drawerOpen || !playing || query.isPending,
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      switch (event.key) {
        case 'Escape':
          if (drawerOpen) setDrawerOpen(false)
          else if (!document.fullscreenElement) exit()
          return
        case 'e':
          if (isSeries) setDrawerOpen((open) => !open)
          return
        case 'f':
          toggleFullscreen()
          return
        case 'n':
          if (hasNext) step(1)
          return
        case 'p':
          if (hasPrev) step(-1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, exit, hasNext, hasPrev, isSeries, step, toggleFullscreen])

  if (query.isError)
    return (
      <div className="grid h-dvh place-items-center bg-ink p-8">
        <ErrorState error={query.error} />
      </div>
    )

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-black ${hidden ? 'cursor-none' : ''}`}
    >
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
      ) : query.isPending ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="eyebrow animate-pulse text-dim">Loading</span>
        </div>
      ) : isTrailer ? (
        <div className="absolute inset-0 grid place-items-center px-6">
          <div className="max-w-md space-y-3 text-center">
            <p className="display text-xl font-semibold text-paper">
              No trailer on file
            </p>
            <p className="text-base text-mist">
              TMDB has no trailer for this title.
            </p>
            <div className="label flex items-center justify-center gap-5 text-2xs text-amber">
              <Link
                href={`/title/${mediaType}/${numericId}`}
                className="underline underline-offset-4"
              >
                Back to title
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center px-6">
          <div className="max-w-md space-y-3 text-center">
            <p className="display text-xl font-semibold text-paper">
              No source configured
            </p>
            <p className="text-base text-mist">
              Add a playback template on the settings page to point the player at
              a backend.
            </p>
            <div className="label flex items-center justify-center gap-5 text-2xs text-amber">
              <Link href="/settings" className="underline underline-offset-4">
                Settings
              </Link>
              {trailer && (
                <Link
                  href={trailerHref(mediaType, numericId)}
                  className="underline underline-offset-4"
                >
                  Play trailer
                </Link>
              )}
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

      <div
        onPointerEnter={wake}
        onPointerMove={wake}
        className={`absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-ink via-ink/75 to-transparent pb-20 transition-opacity duration-500 ease-out-soft ${
          hidden ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-start gap-3 px-4 pt-4 md:gap-5 md:px-8 md:pt-6">
          <button
            type="button"
            onClick={exit}
            aria-label="Back to title"
            title="Back to title (Esc)"
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xs text-mist transition-colors hover:text-paper"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="display truncate text-lg font-semibold text-paper md:text-xl">
              {detail ? titleOf(detail) : 'Loading'}
            </p>
            <Timecode
              className="mt-0.5"
              parts={[
                mediaType === 'tv' && !isTrailer
                  ? episodeCode(season, episode)
                  : yearOf(detail ?? {}),
                isTrailer ? 'Trailer' : current?.name,
              ]}
            />
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {isSeries && (
              <>
                <ChromeButton
                  label="Previous episode"
                  hint="P"
                  onClick={() => step(-1)}
                  disabled={!hasPrev}
                >
                  <SkipBack size={15} />
                </ChromeButton>
                <ChromeButton
                  label="Next episode"
                  hint="N"
                  onClick={() => step(1)}
                  disabled={!hasNext}
                >
                  <SkipForward size={15} />
                </ChromeButton>
                <ChromeButton
                  label="Episodes"
                  hint="E"
                  onClick={() => setDrawerOpen((open) => !open)}
                >
                  <ListVideo size={16} />
                </ChromeButton>
              </>
            )}

            <ChromeButton
              label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              hint="F"
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </ChromeButton>
          </div>
        </div>
      </div>

      {detail && isSeries && (
        <EpisodeDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          detail={detail}
          season={season}
          episode={episode}
          onSelect={(nextSeason, nextEpisode) => {
            go(nextSeason, nextEpisode)
            setDrawerOpen(false)
          }}
        />
      )}
    </div>
  )
}

export default function WatchPage() {
  const { media, id } = useParams<{ media: string; id: string }>()
  const numericId = Number(id)
  if ((media !== 'movie' && media !== 'tv') || !Number.isFinite(numericId))
    redirect('/')

  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <Watch mediaType={media} numericId={numericId} />
    </Suspense>
  )
}
