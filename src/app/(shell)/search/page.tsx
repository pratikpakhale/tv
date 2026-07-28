'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSearch } from '@/lib/queries'
import { useDocumentTitle } from '@/lib/seo'
import { TitleCard } from '@/components/PosterCard'
import { Grid } from '@/components/Row'
import { Empty, ErrorState, PosterSkeleton } from '@/components/states'
import type { TitleSummary } from '@/lib/types'

function ResultsSkeleton() {
  return (
    <Grid>
      {Array.from({ length: 14 }, (_, index) => (
        <PosterSkeleton key={index} />
      ))}
    </Grid>
  )
}

function SearchResults() {
  const params = useSearchParams()
  const query = params.get('q') ?? ''
  const search = useSearch(query)

  useDocumentTitle(query.trim() ? `${query.trim()} — search` : 'Search')

  const items = (search.data?.pages.flatMap((page) => page.results) ?? []).filter(
    (item: TitleSummary) =>
      item.media_type === 'movie' || item.media_type === 'tv',
  )

  if (!query.trim())
    return (
      <Empty
        title="Search the catalog"
        hint="Type a film or series name above. Press / from anywhere to jump to the field."
      />
    )

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h1 className="display text-2xl font-semibold">{query}</h1>
        <span className="data text-2xs text-dim">
          {search.data?.pages[0].total_results ?? '—'} results
        </span>
      </div>

      {search.isError && <ErrorState error={search.error} />}

      {search.isPending ? (
        <ResultsSkeleton />
      ) : items.length ? (
        <>
          <Grid>
            {items.map((item, index) => (
              <TitleCard key={`${item.id}-${index}`} item={item} />
            ))}
          </Grid>
          {search.hasNextPage && (
            <button
              type="button"
              onClick={() => search.fetchNextPage()}
              disabled={search.isFetchingNextPage}
              className="label mx-auto block border-b border-line pb-1 text-2xs text-mist transition-colors hover:border-amber hover:text-amber"
            >
              {search.isFetchingNextPage ? 'Loading' : 'Load more'}
            </button>
          )}
        </>
      ) : (
        !search.isError && (
          <Empty
            title="No results"
            hint={`Nothing in the catalog matches "${query}". Check the spelling, or try the original-language title.`}
          />
        )
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <SearchResults />
    </Suspense>
  )
}
