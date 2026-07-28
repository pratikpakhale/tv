import type { MediaType } from './types'

export interface TitleRef {
  id: number
  media: MediaType
  title: string
  posterPath: string | null
  year: string
}

export interface LibraryEntry extends TitleRef {
  savedAt: number
  deletedAt?: number
}

export interface HistoryEntry extends TitleRef {
  season?: number
  episode?: number
  totalEpisodes?: number
  watchedAt: number
  deletedAt?: number
}

export interface LibraryDoc {
  saved: Record<string, LibraryEntry>
  history: Record<string, HistoryEntry>
}

export const EMPTY_DOC: LibraryDoc = { saved: {}, history: {} }

const MAX_ENTRIES = 5000

/** Long enough that a device offline for a season still learns about a delete. */
const TOMBSTONE_TTL = 1000 * 60 * 60 * 24 * 90

export function keyOf(media: MediaType, id: number) {
  return `${media}:${id}`
}

function stamp(entry: LibraryEntry | HistoryEntry) {
  const written = 'savedAt' in entry ? entry.savedAt : entry.watchedAt
  return Math.max(written || 0, entry.deletedAt ?? 0)
}

function mergeMap<T extends LibraryEntry | HistoryEntry>(
  mine: Record<string, T>,
  theirs: Record<string, T>,
  now: number,
): Record<string, T> {
  const merged: Record<string, T> = {}

  for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const left = mine[key]
    const right = theirs[key]
    const winner = !left
      ? right
      : !right
        ? left
        : stamp(right) >= stamp(left)
          ? right
          : left

    if (winner.deletedAt && now - winner.deletedAt > TOMBSTONE_TTL) continue
    merged[key] = winner
  }

  return merged
}

export function mergeDocs(a: LibraryDoc, b: LibraryDoc, now: number): LibraryDoc {
  return {
    saved: mergeMap(a.saved, b.saved, now),
    history: mergeMap(a.history, b.history, now),
  }
}

function isEntry(value: unknown): value is TitleRef {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Partial<TitleRef>
  return (
    typeof entry.id === 'number' &&
    (entry.media === 'movie' || entry.media === 'tv') &&
    typeof entry.title === 'string'
  )
}

function normalizeMap<T>(raw: unknown): Record<string, T> {
  if (typeof raw !== 'object' || raw === null) return {}
  const out: Record<string, T> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (Object.keys(out).length >= MAX_ENTRIES) break
    if (isEntry(value)) out[key] = value as T
  }
  return out
}

export function normalizeDoc(raw: unknown): LibraryDoc {
  const doc = (raw ?? {}) as Partial<LibraryDoc>
  return {
    saved: normalizeMap<LibraryEntry>(doc.saved),
    history: normalizeMap<HistoryEntry>(doc.history),
  }
}

export function liveEntries<T extends { deletedAt?: number }>(
  map: Record<string, T>,
): T[] {
  return Object.values(map).filter((entry) => !entry.deletedAt)
}
