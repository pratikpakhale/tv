import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query'
import { tmdb } from './tmdb'
import { usePrefs } from './prefs-context'
import type { MediaType, Paged, TitleSummary } from './types'

const HOUR = 1000 * 60 * 60

export function useTrending(media: MediaType | 'all') {
  return useQuery({
    queryKey: ['trending', media],
    queryFn: () => tmdb.trending(media),
    staleTime: HOUR,
  })
}

export function useShelf(
  key: string,
  fetcher: (region: string) => Promise<Paged<TitleSummary>>,
) {
  const { region } = usePrefs()
  return useQuery({
    queryKey: ['shelf', key, region],
    queryFn: () => fetcher(region),
    staleTime: HOUR,
  })
}

export function useGenres(media: MediaType) {
  return useQuery({
    queryKey: ['genres', media],
    queryFn: () => tmdb.genres(media),
    staleTime: HOUR * 24,
  })
}

export interface DiscoverFilters {
  genre?: string
  year?: string
  sort: string
  minVotes: number
}

export function useDiscover(media: MediaType, filters: DiscoverFilters) {
  const { region } = usePrefs()
  return useInfiniteQuery({
    queryKey: ['discover', media, filters, region],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      tmdb.discover(media, region, {
        page: pageParam,
        with_genres: filters.genre,
        sort_by: filters.sort,
        'vote_count.gte': filters.minVotes,
        primary_release_year: media === 'movie' ? filters.year : undefined,
        first_air_date_year: media === 'tv' ? filters.year : undefined,
      }),
    getNextPageParam: (last) =>
      last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined,
    staleTime: HOUR,
  })
}

export function useSearch(query: string) {
  return useInfiniteQuery({
    queryKey: ['search', query],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => tmdb.search(query, pageParam),
    getNextPageParam: (last) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: query.trim().length > 1,
    staleTime: HOUR,
  })
}

export function useSearchSuggest(query: string) {
  return useQuery({
    queryKey: ['search-suggest', query],
    queryFn: () => tmdb.search(query, 1),
    enabled: query.trim().length > 1,
    placeholderData: keepPreviousData,
    staleTime: HOUR,
  })
}

export function useTitle(media: MediaType, id: number) {
  return useQuery({
    queryKey: ['title', media, id],
    queryFn: () => tmdb.detail(media, id),
    staleTime: HOUR,
  })
}

export function useSeason(id: number, season: number, enabled: boolean) {
  return useQuery({
    queryKey: ['season', id, season],
    queryFn: () => tmdb.season(id, season),
    enabled,
    staleTime: HOUR,
  })
}
