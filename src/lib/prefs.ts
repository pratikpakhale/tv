import {
  CUSTOM_SOURCE_ID,
  DEFAULT_SOURCE_ID,
  findSource,
} from './source-registry'

export interface Prefs {
  region: string
  sourceId: string
  customSourceMovie: string
  customSourceSeries: string
}

export const PREFS_DEFAULTS: Prefs = {
  region: (process.env.NEXT_PUBLIC_REGION || 'US').toUpperCase(),
  sourceId: DEFAULT_SOURCE_ID,
  customSourceMovie: '',
  customSourceSeries: '',
}

const REGION_PATTERN = /^[a-z]{2}$/i

export function isKnownSourceId(id: string): boolean {
  return id === CUSTOM_SOURCE_ID || Boolean(findSource(id))
}

export function normalizePrefs(raw: unknown): Prefs {
  const stored = (raw ?? {}) as Partial<Record<keyof Prefs, unknown>>

  const text = (value: unknown, fallback: string) =>
    typeof value === 'string' ? value.trim() : fallback

  const region = text(stored.region, PREFS_DEFAULTS.region)
  const sourceId = text(stored.sourceId, PREFS_DEFAULTS.sourceId)

  return {
    region: REGION_PATTERN.test(region)
      ? region.toUpperCase()
      : PREFS_DEFAULTS.region,
    sourceId: isKnownSourceId(sourceId) ? sourceId : PREFS_DEFAULTS.sourceId,
    customSourceMovie: text(
      stored.customSourceMovie,
      PREFS_DEFAULTS.customSourceMovie,
    ),
    customSourceSeries: text(
      stored.customSourceSeries,
      PREFS_DEFAULTS.customSourceSeries,
    ),
  }
}

export function prefsProblem(prefs: Prefs): string | null {
  if (!REGION_PATTERN.test(prefs.region))
    return 'Region must be a two-letter country code, like IN or US.'

  if (!isKnownSourceId(prefs.sourceId)) return 'Pick a source from the list.'
  if (prefs.sourceId !== CUSTOM_SOURCE_ID) return null

  if (!prefs.customSourceMovie)
    return 'A custom source needs a film template at least.'

  for (const template of [prefs.customSourceMovie, prefs.customSourceSeries]) {
    if (!template) continue
    if (!/^https?:\/\/\S+$/.test(template))
      return 'Custom templates must be absolute http(s) URLs.'
    if (!template.includes('{tmdb}') && !template.includes('{imdb}'))
      return 'Custom templates need {tmdb} or {imdb}, or every title plays the same URL.'
  }

  if (/\{(season|episode)\}/.test(prefs.customSourceMovie))
    return 'The film template cannot use {season} or {episode} — films have neither.'

  return null
}
