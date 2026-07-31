export interface Prefs {
  region: string
  sourceUrlMovie: string
  sourceUrlSeries: string
}

const SHARED_SOURCE = process.env.NEXT_PUBLIC_SOURCE_URL || ''

export const PREFS_DEFAULTS: Prefs = {
  region: (process.env.NEXT_PUBLIC_REGION || 'US').toUpperCase(),
  sourceUrlMovie: process.env.NEXT_PUBLIC_SOURCE_URL_MOVIE || SHARED_SOURCE,
  sourceUrlSeries: process.env.NEXT_PUBLIC_SOURCE_URL_SERIES || SHARED_SOURCE,
}

const REGION_PATTERN = /^[a-z]{2}$/i

export function normalizePrefs(raw: unknown): Prefs {
  const stored = (raw ?? {}) as Partial<Record<keyof Prefs, unknown>>

  const text = (value: unknown, fallback: string) =>
    typeof value === 'string' ? value.trim() : fallback

  const region = text(stored.region, PREFS_DEFAULTS.region)

  return {
    region: REGION_PATTERN.test(region)
      ? region.toUpperCase()
      : PREFS_DEFAULTS.region,
    sourceUrlMovie: text(stored.sourceUrlMovie, PREFS_DEFAULTS.sourceUrlMovie),
    sourceUrlSeries: text(
      stored.sourceUrlSeries,
      PREFS_DEFAULTS.sourceUrlSeries,
    ),
  }
}

export function prefsProblem(prefs: Prefs): string | null {
  if (!REGION_PATTERN.test(prefs.region))
    return 'Region must be a two-letter country code, like IN or US.'

  for (const url of [prefs.sourceUrlMovie, prefs.sourceUrlSeries]) {
    if (url && !/^https?:\/\/\S+$/.test(url))
      return 'Source templates must be absolute http(s) URLs, or left blank.'
  }

  return null
}
