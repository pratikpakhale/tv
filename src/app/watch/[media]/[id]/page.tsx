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
  Antenna,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ListVideo,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { useSeason, useTitle } from '@/lib/queries'
import {
  activeSource,
  pickTrailer,
  resolveForSource,
  sourceOptions,
  trailerHref,
  youtubeEmbedUrl,
} from '@/lib/source'
import { usePrefs } from '@/lib/prefs-context'
import { episodeCode, titleOf, yearOf } from '@/lib/format'
import { useDocumentTitle } from '@/lib/seo'
import { Timecode } from '@/components/Timecode'
import { EpisodeDrawer } from '@/components/EpisodeDrawer'
import { SourcePicker } from '@/components/SourcePicker'
import { ErrorState } from '@/components/states'
import { useLibrary } from '@/store/library'
import type { MediaType, TitleDetail } from '@/lib/types'

type Panel = 'episodes' | 'source'

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
      className="grid size-9 place-items-center rounded-xs border border-line bg-surface text-mist transition-colors hover:border-mist/40 hover:text-paper disabled:opacity-25 disabled:hover:border-line disabled:hover:text-mist"
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
  const source = activeSource(prefs, params.get('source'))

  const [panel, setPanel] = useState<Panel | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const togglePanel = useCallback(
    (name: Panel) => setPanel((current) => (current === name ? null : name)),
    [],
  )

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

  const request = detail && {
    media: mediaType,
    tmdbId: detail.id,
    imdbId: detail.external_ids?.imdb_id,
    season: mediaType === 'tv' ? season : undefined,
    episode: mediaType === 'tv' ? episode : undefined,
  }

  const sourceUrl = request ? resolveForSource(source, request) : null

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

  const selectSource = useCallback(
    (id: string) => {
      const updated = new URLSearchParams(params.toString())
      updated.set('source', id)
      router.replace(`${pathname}?${updated}`, { scroll: false })
      setPanel(null)
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

  /* Optional call: iOS Safari on iPhone ships no Element.requestFullscreen. */
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      switch (event.key) {
        case 'Escape':
          if (panel) setPanel(null)
          else if (!document.fullscreenElement) exit()
          return
        case 'e':
          if (isSeries) togglePanel('episodes')
          return
        case 's':
          if (!isTrailer) togglePanel('source')
          return
        case 'c':
          setCollapsed((value) => !value)
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
  }, [
    exit,
    hasNext,
    hasPrev,
    isSeries,
    isTrailer,
    panel,
    step,
    togglePanel,
    toggleFullscreen,
  ])

  if (query.isError)
    return (
      <div className="grid h-dvh place-items-center bg-ink p-8">
        <ErrorState error={query.error} />
      </div>
    )

  return (
    <div className="fixed inset-0 flex flex-col overflow-clip bg-black">
      <header className="relative z-10 shrink-0 border-b border-line bg-ink">
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-expanded={false}
            aria-label="Show controls"
            title="Show controls (C)"
            className="flex h-4 w-full items-center justify-center text-dim transition-colors hover:text-paper"
          >
            <ChevronDown size={12} />
          </button>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2.5 md:gap-5 md:px-6">
            <button
              type="button"
              onClick={exit}
              aria-label="Back to title"
              title="Back to title (Esc)"
              className="grid size-9 shrink-0 place-items-center rounded-xs text-mist transition-colors hover:text-paper"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="display truncate text-base font-semibold text-paper md:text-lg">
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

            <div className="flex shrink-0 items-center gap-2">
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
                    onClick={() => togglePanel('episodes')}
                  >
                    <ListVideo size={16} />
                  </ChromeButton>
                </>
              )}

              {!isTrailer && (
                <ChromeButton
                  label="Source"
                  hint="S"
                  onClick={() => togglePanel('source')}
                >
                  <Antenna size={16} />
                </ChromeButton>
              )}

              <ChromeButton
                label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                hint="F"
                onClick={toggleFullscreen}
              >
                {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </ChromeButton>

              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-expanded
                aria-label="Hide controls"
                title="Hide controls (C)"
                className="ml-1 grid size-9 shrink-0 place-items-center rounded-xs text-dim transition-colors hover:text-paper"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="relative isolate min-h-0 flex-1 overflow-clip">
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
                This source can&rsquo;t play this title
              </p>
              <p className="text-base text-mist">
                <span className="font-mono text-sm text-paper">
                  {source.label}
                </span>{' '}
                has nothing to serve here. Try another one.
              </p>
              <div className="label flex items-center justify-center gap-5 text-2xs text-amber">
                <button
                  type="button"
                  onClick={() => setPanel('source')}
                  className="underline underline-offset-4"
                >
                  Switch source
                </button>
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

        {request && !isTrailer && (
          <SourcePicker
            open={panel === 'source'}
            onClose={() => setPanel(null)}
            sources={sourceOptions(prefs)}
            activeId={source.id}
            media={mediaType}
            playable={(candidate) =>
              resolveForSource(candidate, request) !== null
            }
            onSelect={selectSource}
          />
        )}

        {detail && isSeries && (
          <EpisodeDrawer
            open={panel === 'episodes'}
            onClose={() => setPanel(null)}
            detail={detail}
            season={season}
            episode={episode}
            onSelect={(nextSeason, nextEpisode) => {
              go(nextSeason, nextEpisode)
              setPanel(null)
            }}
          />
        )}
      </div>
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
