import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  keyOf,
  liveEntries,
  type HistoryEntry,
  type LibraryEntry,
  type TitleRef,
} from '../lib/library-doc'
import type { MediaType } from '../lib/types'

export type { HistoryEntry, LibraryEntry, TitleRef }

interface LibraryState {
  saved: Record<string, LibraryEntry>
  history: Record<string, HistoryEntry>
  toggleSaved: (entry: TitleRef) => void
  isSaved: (media: MediaType, id: number) => boolean
  recordWatch: (entry: HistoryEntry) => void
  forget: (media: MediaType, id: number) => void
  clearHistory: () => void
}

function tombstone<T extends { deletedAt?: number }>(entry: T, at: number): T {
  return { ...entry, deletedAt: at }
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      saved: {},
      history: {},

      toggleSaved: (entry) =>
        set((state) => {
          const key = keyOf(entry.media, entry.id)
          const current = state.saved[key]
          const now = Date.now()
          return {
            saved: {
              ...state.saved,
              [key]:
                current && !current.deletedAt
                  ? tombstone(current, now)
                  : { ...entry, savedAt: now },
            },
          }
        }),

      isSaved: (media, id) => {
        const entry = get().saved[keyOf(media, id)]
        return Boolean(entry && !entry.deletedAt)
      },

      recordWatch: (entry) =>
        set((state) => ({
          history: {
            ...state.history,
            [keyOf(entry.media, entry.id)]: { ...entry, deletedAt: undefined },
          },
        })),

      forget: (media, id) =>
        set((state) => {
          const key = keyOf(media, id)
          const current = state.history[key]
          if (!current) return state
          return {
            history: { ...state.history, [key]: tombstone(current, Date.now()) },
          }
        }),

      clearHistory: () =>
        set((state) => {
          const now = Date.now()
          const history: Record<string, HistoryEntry> = {}
          for (const [key, entry] of Object.entries(state.history)) {
            history[key] = entry.deletedAt ? entry : tombstone(entry, now)
          }
          return { history }
        }),
    }),
    { name: 'tv-library' },
  ),
)

export function useContinueWatching(): HistoryEntry[] {
  const history = useLibrary((state) => state.history)
  return liveEntries(history).sort((a, b) => b.watchedAt - a.watchedAt)
}

export function useSavedTitles(): LibraryEntry[] {
  const saved = useLibrary((state) => state.saved)
  return liveEntries(saved).sort((a, b) => b.savedAt - a.savedAt)
}
