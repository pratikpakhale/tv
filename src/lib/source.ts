import type { MediaType, Video } from './types'

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

  const filled = template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? encodeURIComponent(values[key]) : match,
  )

  return withPlaybackDefaults(filled, request.media)
}

/**
 * `autoplay` and `autonext` are near-universal across embed backends, and a
 * player that waits for a second click reads as broken. Set them on unless the
 * template already has an opinion — writing `?autoplay=0` is how you turn them
 * off, which keeps the app source-agnostic rather than dictating behaviour.
 */
function withPlaybackDefaults(rawUrl: string, media: MediaType): string {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  const defaults = media === 'tv' ? ['autoplay', 'autonext'] : ['autoplay']
  for (const key of defaults) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, '1')
  }

  return url.toString()
}

export function watchHref(
  media: MediaType,
  id: number,
  season?: number,
  episode?: number,
): string {
  if (media !== 'tv') return `/watch/movie/${id}`
  return `/watch/tv/${id}?season=${season ?? 1}&episode=${episode ?? 1}`
}

export function trailerHref(media: MediaType, id: number): string {
  return `/watch/${media}/${id}?trailer=1`
}

export function pickTrailer(videos?: Video[]): Video | undefined {
  if (!videos?.length) return undefined
  const youtube = videos.filter((video) => video.site === 'YouTube')
  return (
    youtube.find((video) => video.type === 'Trailer' && video.official) ??
    youtube.find((video) => video.type === 'Trailer') ??
    youtube.find((video) => video.type === 'Teaser') ??
    youtube[0]
  )
}

export function youtubeEmbedUrl(key: string): string {
  return `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&modestbranding=1`
}
