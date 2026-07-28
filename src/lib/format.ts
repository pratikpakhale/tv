import type { MediaType, TitleSummary } from './types'

export function titleOf(item: { title?: string; name?: string }): string {
  return item.title ?? item.name ?? 'Untitled'
}

export function yearOf(item: {
  release_date?: string
  first_air_date?: string
}): string {
  const date = item.release_date || item.first_air_date
  return date ? date.slice(0, 4) : '—'
}

export function mediaTypeOf(item: TitleSummary): MediaType {
  if (item.media_type === 'movie' || item.media_type === 'tv')
    return item.media_type
  return item.first_air_date || item.name ? 'tv' : 'movie'
}

export function runtime(minutes?: number | null): string {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export function rating(vote?: number): string {
  return vote ? vote.toFixed(1) : '—'
}

export function episodeCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export function relativeTime(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, secondsPerUnit] of units) {
    if (seconds >= secondsPerUnit)
      return formatter.format(-Math.floor(seconds / secondsPerUnit), unit)
  }
  return 'just now'
}

const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function poster(
  path: string | null,
  size: 'w185' | 'w342' | 'w500' = 'w342',
): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null
}

export function backdrop(
  path: string | null,
  size: 'w780' | 'w1280' | 'original' = 'w1280',
): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null
}

export function still(path: string | null): string | null {
  return path ? `${IMAGE_BASE}/w300${path}` : null
}

export function profile(path: string | null): string | null {
  return path ? `${IMAGE_BASE}/w185${path}` : null
}
