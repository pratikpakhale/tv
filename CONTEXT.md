# Context: TV.

The domain language of this project. Read it before exploring the codebase and
reuse these terms instead of drifting to synonyms.

## Glossary

**Title** — a film or a series, as identified by TMDB. Always paired with a
**media type** to be addressable: `movie` or `tv`. A title is never identified
by its numeric id alone, because ids collide across the two types; the key is
`` `${media}:${id}` ``.

**Media type** — `'movie' | 'tv'`. The internal value is always `tv`, never
"series", even though the UI says "Series". Route params and store keys use
`media`.

**Title summary** — the shallow shape TMDB returns in lists (trending, discover,
search). Enough to render a **poster card**; not enough for a title page.

**Catalog** — everything served from TMDB: trending, popular, discover, search,
credits, videos, recommendations. Read-only, remote, cached by TanStack Query.
Nothing in the catalog is curated or stored by this app. The browser never talks
to TMDB directly — `tmdb.ts` calls `/api/tmdb/[...path]`, which attaches the
token server-side.

**Library** — the user's own data, held in Zustand, cached in `localStorage`
under `tv-library`, and synced to a Vercel Blob document at
`library/${userId}.json`. Two disjoint collections:

- **Saved** — titles the user explicitly bookmarked (`toggleSaved`), each with a
  `savedAt` timestamp.
- **History** — titles the user has played, each with a `watchedAt` timestamp
  and, for series, the `season`/`episode` reached. Drives "continue watching".

Saving and watching are independent: a title can be in history without being
saved.

**Tombstone** — a library entry with `deletedAt` set. Removals are soft, because
a hard delete on one device is indistinguishable from a title the other device
has not heard about yet, and the merge would resurrect it. Selectors
(`useSavedTitles`, `useContinueWatching`) filter tombstones out; the merge drops
them once they are older than the TTL in `library-doc.ts`.

**Prefs** — the account's settings: `region` and the three source fields. Stored
in Clerk `publicMetadata.prefs`, written only by the `savePrefs` server action,
read through `usePrefs()`. The `NEXT_PUBLIC_*` env vars are the defaults a fresh
account starts from, not the live values.

**Source** — where playback bytes come from. The app is **source-agnostic**: it
fills a user-supplied URL **template** taken from prefs. "Configured source"
means a template resolved to a URL; no template means the player has nothing to
play and says so.

**Trailer** — a YouTube video from the catalog, played in the same player under
`?trailer=1`. It is a separate mode, not a fallback for a missing source: it is
reached only from a title page's Trailer button, its chrome drops the
episode controls, and it is never written to history.

**Provider** — a licensed streaming service that carries a title, from TMDB's
`watch/providers` (JustWatch data, attribution required). A provider is a place
to link out to — distinct from a **source**, which is what actually plays
in-app.

## Boundaries

- `src/lib/` — TMDB access (`tmdb.ts`), query definitions (`queries.ts`), source
  template resolution (`source.ts`), prefs shape (`prefs.ts`), the library
  document and its merge (`library-doc.ts`), display formatting (`format.ts`),
  shared types. Hooks live here only where they are thin context readers
  (`prefs-context.ts`); nothing else in `src/lib/` renders.
- `src/app/` — one `page.tsx` per screen, all `'use client'` except the root
  layout. Routes inside the `(shell)` group render within the `Shell` layout;
  `watch/` and the Clerk pages sit outside it. `api/` holds route handlers and
  `actions/` server actions — server-only, the one place secrets are read.
- `src/proxy.ts` — Next 16's middleware entry point. Everything except
  `/sign-in` and `/sign-up` requires a session; `/api/*` answers 401 rather than
  redirecting, so a fetch never parses a sign-in page as JSON.
- `src/store/` — the library and its sync loop. The only writable state in the
  app.
- `src/components/` — presentational; they receive titles, they don't fetch.

## Conventions

- Files under `src/app/` import across boundaries through the `@/` alias
  (`@/lib/queries`); `src/lib`, `src/components` and `src/store` use relative
  paths among themselves. Route nesting is deep enough that `../../../..` stops
  being readable.
- A route that reads `useSearchParams` must sit inside a `Suspense` boundary, or
  Next refuses to prerender the page. Validate route params in the exported
  `page` component, above that boundary — a `redirect()` raised inside it lands
  after the shell has streamed and silently becomes a 200.
- Who may sign up is Clerk dashboard configuration, not code — the app has no
  allowlist of its own. Clerk will not accept `allowlist: true` while sign-up
  mode is `restricted`; the two are alternatives. This instance runs `public`
  mode with the allowlist on, so only allowlisted addresses can sign up, and
  removing an address also revokes sign-in.
- The library sync is one endpoint doing both directions: `PUT /api/library`
  sends the local document, the server merges it into the stored one and returns
  the result. Hydration calls it with whatever `localStorage` had, which is also
  what carries a pre-account library up to the server the first time.
- Display fallbacks are em-dashes (`—`), produced by the helpers in `format.ts`.
  Don't hand-roll `?? 'N/A'` at call sites.
- TMDB's raw field names (`poster_path`, `vote_average`, `first_air_date`)
  survive in `types.ts` because they mirror the API. Anything the app owns
  (`LibraryEntry`, `posterPath`, `watchedAt`) is camelCase.
