import type { MediaType } from './types'

interface SourceRequest {
  media: MediaType
  tmdbId: number
  imdbId?: string | null
  season?: number
  episode?: number
}

export function resolveSourceUrl(
  template: string,
  request: SourceRequest,
): string | null {
  if (!template) return null

  const values: Record<string, string> = {
    type: request.media,
    tmdb: String(request.tmdbId),
    imdb: request.imdbId ?? '',
    season: request.season === undefined ? '' : String(request.season),
    episode: request.episode === undefined ? '' : String(request.episode),
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? encodeURIComponent(values[key]) : match,
  )
}

export function youtubeEmbedUrl(key: string): string {
  return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`
}
