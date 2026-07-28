export type MediaType = 'movie' | 'tv'

export interface TitleSummary {
  id: number
  media_type?: MediaType
  title?: string
  name?: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  vote_average: number
  release_date?: string
  first_air_date?: string
  genre_ids?: number[]
}

export interface Genre {
  id: number
  name: string
}

export interface Video {
  key: string
  site: string
  type: string
  name: string
  official: boolean
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface SeasonSummary {
  id: number
  season_number: number
  name: string
  episode_count: number
  air_date: string | null
  poster_path: string | null
}

export interface Episode {
  id: number
  episode_number: number
  season_number: number
  name: string
  overview: string
  still_path: string | null
  air_date: string | null
  runtime: number | null
  vote_average: number
}

export interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string
}

export interface TitleDetail extends TitleSummary {
  tagline?: string
  status?: string
  runtime?: number
  episode_run_time?: number[]
  number_of_seasons?: number
  number_of_episodes?: number
  genres: Genre[]
  seasons?: SeasonSummary[]
  external_ids?: { imdb_id?: string | null }
  credits?: { cast: CastMember[] }
  videos?: { results: Video[] }
  recommendations?: { results: TitleSummary[] }
  'watch/providers'?: {
    results: Record<
      string,
      {
        link?: string
        flatrate?: WatchProvider[]
        rent?: WatchProvider[]
        buy?: WatchProvider[]
      }
    >
  }
}

export interface Paged<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}
