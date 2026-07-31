'use client'

import { Suspense, useEffect, useId, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Clock, CornerDownLeft, Loader2, Search, Star, X } from 'lucide-react'
import { useSearchSuggest } from '@/lib/queries'
import { useDebounced } from '@/lib/useDebounced'
import { useRecentSearches } from '@/lib/useRecentSearches'
import { mediaTypeOf, poster, rating, titleOf, yearOf } from '@/lib/format'
import type { TitleSummary } from '@/lib/types'

const MAX_SUGGESTIONS = 6

const FIELD_CLASS =
  'w-full rounded-sm border border-line bg-surface py-2 pr-12 pl-9 text-base text-paper placeholder:text-dim focus:border-mist/40 focus:outline-none'

function SearchFieldInner() {
  const params = useSearchParams()
  const pathname = usePathname()
  const submitted = params.get('q') ?? ''
  const [value, setValue] = useState(submitted)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()

  const { recents, remember, forget, clear } = useRecentSearches()

  const query = value.trim()
  const debounced = useDebounced(query)
  const suggest = useSearchSuggest(debounced)

  const items = (suggest.data?.results ?? [])
    .filter(
      (item: TitleSummary) =>
        item.media_type === 'movie' || item.media_type === 'tv',
    )
    .slice(0, MAX_SUGGESTIONS)

  const showRecents = open && !query && recents.length > 0
  const expanded = showRecents || (open && debounced.length > 1)
  const optionCount = showRecents ? recents.length : items.length

  useEffect(() => {
    setValue(submitted)
    setOpen(false)
  }, [submitted, pathname])

  useEffect(() => {
    setActive(-1)
  }, [debounced, recents.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement !== input.current) {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const dismiss = () => {
    setOpen(false)
    setActive(-1)
    input.current?.blur()
  }

  const runSearch = (raw: string) => {
    const term = raw.trim()
    if (!term) return
    remember(term)
    setValue(term)
    router.push(`/search?q=${encodeURIComponent(term)}`)
    dismiss()
  }

  const seeAll = () => runSearch(query)

  /* The title, not the fragment that found it — "inters" is no use to come back to. */
  const choose = (item: TitleSummary) => {
    remember(titleOf(item))
    router.push(`/title/${mediaTypeOf(item)}/${item.id}`)
    dismiss()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (expanded) setOpen(false)
      else input.current?.blur()
      return
    }
    if (event.key === 'Enter' && active >= 0) {
      if (showRecents && recents[active]) {
        event.preventDefault()
        runSearch(recents[active])
        return
      }
      if (!showRecents && items[active]) {
        event.preventDefault()
        choose(items[active])
        return
      }
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!optionCount) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => {
        const next = current + step
        if (next < -1) return optionCount - 1
        if (next > optionCount - 1) return -1
        return next
      })
    }
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        seeAll()
      }}
      className="relative flex-1"
    >
      <Search
        size={14}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
      />
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Search films and series"
        aria-label="Search films and series"
        className={FIELD_CLASS}
      />
      {suggest.isFetching && query.length > 1 ? (
        <Loader2
          size={13}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-dim"
        />
      ) : (
        <kbd className="data pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-xs border border-line px-1.5 py-0.5 text-2xs text-dim">
          /
        </kbd>
      )}

      {expanded && (
        <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-sm border border-line bg-surface shadow-xl shadow-ink/60">
          {showRecents ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                <span className="eyebrow">Recent</span>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    clear()
                  }}
                  className="label text-2xs text-dim transition-colors hover:text-flare"
                >
                  Clear
                </button>
              </div>

              <ul id={listId} role="listbox" aria-label="Recent searches">
                {recents.map((term, index) => (
                  <li
                    key={term}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      runSearch(term)
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`group/recent flex items-center gap-3 px-3 py-2 transition-colors ${
                      index === active ? 'bg-raise' : ''
                    }`}
                  >
                    <Clock size={13} className="shrink-0 text-dim" />
                    <span className="min-w-0 flex-1 truncate text-sm text-paper/90">
                      {term}
                    </span>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Remove ${term} from recent searches`}
                      onMouseDown={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        forget(term)
                      }}
                      className="grid size-5 shrink-0 place-items-center rounded-xs text-dim opacity-0 transition-colors hover:text-flare group-hover/recent:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : items.length ? (
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {items.map((item, index) => {
                const media = mediaTypeOf(item)
                const src = poster(item.poster_path, 'w185')
                return (
                  <li
                    key={`${item.id}-${index}`}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      choose(item)
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                      index === active ? 'bg-raise' : ''
                    }`}
                  >
                    <div className="h-12 w-8 shrink-0 overflow-hidden rounded-xs bg-raise">
                      {src && (
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-paper">
                        {titleOf(item)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-dim">
                        <span>{media === 'tv' ? 'Series' : 'Film'}</span>
                        <span className="text-line">·</span>
                        <span className="data">{yearOf(item)}</span>
                      </p>
                    </div>
                    {item.vote_average > 0 && (
                      <span className="data flex items-center gap-1 text-2xs text-mist">
                        <Star size={9} className="fill-amber text-amber" />
                        {rating(item.vote_average)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-mist">
              {suggest.isFetching ? 'Searching…' : 'No matches'}
            </p>
          )}

          {!showRecents && (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                seeAll()
              }}
              className="group/all flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left transition-colors hover:bg-raise"
            >
              <span className="label shrink-0 text-2xs text-dim">See all</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-paper">
                {query}
              </span>
              <CornerDownLeft
                size={11}
                className="shrink-0 text-dim transition-colors group-hover/all:text-amber"
              />
            </button>
          )}
        </div>
      )}
    </form>
  )
}

export function SearchField() {
  return (
    <Suspense
      fallback={
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dim"
          />
          <input
            type="search"
            disabled
            placeholder="Search films and series"
            aria-label="Search films and series"
            className={FIELD_CLASS}
          />
        </div>
      }
    >
      <SearchFieldInner />
    </Suspense>
  )
}
