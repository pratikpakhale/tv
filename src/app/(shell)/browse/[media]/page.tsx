'use client'

import { Suspense, useEffect, useRef } from 'react'
import {
  redirect,
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { useDiscover, useGenres, type DiscoverFilters } from '@/lib/queries'
import { useDocumentTitle } from '@/lib/seo'
import { TitleCard } from '@/components/PosterCard'
import { Grid } from '@/components/Row'
import { Empty, ErrorState, PosterSkeleton } from '@/components/states'
import type { MediaType } from '@/lib/types'

const SORTS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'vote_average.desc', label: 'Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'revenue.desc', label: 'Box office' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, index) =>
  String(CURRENT_YEAR - index),
)

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-xs border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${
        active
          ? 'border-amber bg-amber text-ink'
          : 'border-line text-mist hover:border-mist/40 hover:text-paper'
      }`}
    >
      {children}
    </button>
  )
}

function useInfiniteScroll(onReach: () => void, enabled: boolean) {
  const sentinel = useRef<HTMLDivElement>(null)
  const callback = useRef(onReach)
  callback.current = onReach

  useEffect(() => {
    const node = sentinel.current
    if (!node || !enabled) return
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && callback.current(),
      { rootMargin: '600px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled])

  return sentinel
}

function BrowseGridSkeleton() {
  return (
    <Grid>
      {Array.from({ length: 14 }, (_, index) => (
        <PosterSkeleton key={index} />
      ))}
    </Grid>
  )
}

function Browse({ media }: { media: MediaType }) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const filters: DiscoverFilters = {
    genre: params.get('genre') ?? undefined,
    year: params.get('year') ?? undefined,
    sort: params.get('sort') ?? 'popularity.desc',
    minVotes: 120,
  }

  useDocumentTitle(media === 'movie' ? 'Films' : 'Series')

  const genres = useGenres(media)
  const discover = useDiscover(media, filters)

  const sentinel = useInfiniteScroll(
    () =>
      discover.hasNextPage &&
      !discover.isFetchingNextPage &&
      discover.fetchNextPage(),
    Boolean(discover.hasNextPage),
  )

  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString())
    if (value && next.get(key) !== value) next.set(key, value)
    else next.delete(key)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const items = discover.data?.pages.flatMap((page) => page.results) ?? []
  const sortOptions =
    media === 'tv'
      ? SORTS.filter((sort) => !sort.value.startsWith('revenue')).map((sort) =>
          sort.value === 'primary_release_date.desc'
            ? { ...sort, value: 'first_air_date.desc' }
            : sort,
        )
      : SORTS

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="display text-2xl font-semibold">
          {media === 'movie' ? 'Films' : 'Series'}
        </h1>
        <span className="data text-2xs text-dim">
          {discover.data?.pages[0].total_results.toLocaleString() ?? '—'} titles
        </span>
      </div>

      <div className="space-y-2">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {sortOptions.map((sort) => (
            <Chip
              key={sort.value}
              active={filters.sort === sort.value}
              onClick={() => update('sort', sort.value)}
            >
              {sort.label}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {YEARS.slice(0, 12).map((year) => (
            <Chip
              key={year}
              active={filters.year === year}
              onClick={() => update('year', year)}
            >
              {year}
            </Chip>
          ))}
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {genres.data?.genres.map((genre) => (
            <Chip
              key={genre.id}
              active={filters.genre === String(genre.id)}
              onClick={() => update('genre', String(genre.id))}
            >
              {genre.name}
            </Chip>
          ))}
        </div>
      </div>

      {discover.isError && <ErrorState error={discover.error} />}

      {discover.isPending ? (
        <BrowseGridSkeleton />
      ) : items.length ? (
        <Grid>
          {items.map((item, index) => (
            <TitleCard key={`${item.id}-${index}`} item={item} media={media} />
          ))}
        </Grid>
      ) : (
        !discover.isError && (
          <Empty
            title="No matches"
            hint="These filters are too narrow. Drop the year or pick a broader genre."
          />
        )
      )}

      <div ref={sentinel} className="h-px" />
      {discover.isFetchingNextPage && (
        <p className="label py-4 text-center text-2xs text-dim">Loading more</p>
      )}
    </div>
  )
}

export default function BrowsePage() {
  const { media } = useParams<{ media: string }>()
  if (media !== 'movie' && media !== 'tv') redirect('/browse/movie')

  return (
    <Suspense fallback={<BrowseGridSkeleton />}>
      <Browse media={media} />
    </Suspense>
  )
}
