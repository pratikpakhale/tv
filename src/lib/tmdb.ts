import type {
  Episode,
  Genre,
  MediaType,
  Paged,
  TitleDetail,
  TitleSummary,
} from './types'

const BASE = '/api/tmdb'

type Params = Record<string, string | number | boolean | undefined>

async function get<T>(path: string, params: Params = {}): Promise<T> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }

  const query = search.toString()
  const response = await fetch(`${BASE}${path}${query ? `?${query}` : ''}`, {
    headers: { accept: 'application/json' },
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(
      detail?.status_message ?? `TMDB request failed (${response.status})`,
    )
  }
  return response.json() as Promise<T>
}

export const tmdb = {
  trending: (media: MediaType | 'all', window: 'day' | 'week' = 'week') =>
    get<Paged<TitleSummary>>(`/trending/${media}/${window}`),

  popular: (media: MediaType, region: string, page = 1) =>
    get<Paged<TitleSummary>>(`/${media}/popular`, { page, region }),

  topRated: (media: MediaType, region: string, page = 1) =>
    get<Paged<TitleSummary>>(`/${media}/top_rated`, { page, region }),

  nowPlaying: (region: string) =>
    get<Paged<TitleSummary>>('/movie/now_playing', { region }),

  discover: (media: MediaType, region: string, params: Params) =>
    get<Paged<TitleSummary>>(`/discover/${media}`, {
      include_adult: false,
      watch_region: region,
      ...params,
    }),

  search: (query: string, page = 1) =>
    get<Paged<TitleSummary>>('/search/multi', {
      query,
      page,
      include_adult: false,
    }),

  genres: (media: MediaType) => get<{ genres: Genre[] }>(`/genre/${media}/list`),

  detail: (media: MediaType, id: number) =>
    get<TitleDetail>(`/${media}/${id}`, {
      append_to_response:
        'credits,videos,recommendations,external_ids,watch/providers',
    }),

  season: (id: number, season: number) =>
    get<{ episodes: Episode[]; name: string; overview: string }>(
      `/tv/${id}/season/${season}`,
    ),
}
