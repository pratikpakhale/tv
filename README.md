# TV.

A minimal catalog and player for films and series. Next.js (App Router) + React
+ TypeScript + Tailwind, TanStack Query for server state, Zustand for the
library.

Pages render on the client; Next serves them and proxies TMDB so the API token
stays on the server. Accounts are Clerk, the library lives in Vercel Blob. Every
route is behind a session — it is built to be deployed for a handful of invited
people, not to the open web.

## Setup

```bash
cp .env.example .env.local   # fill in the values below
npm install
npm run dev
```

Three things are required:

- `TMDB_TOKEN` — free at
  [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Copy
  the **API Read Access Token** (the long JWT), not the short v3 key.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — from your
  [Clerk dashboard](https://dashboard.clerk.com).
- `BLOB_READ_WRITE_TOKEN` — create a Blob store in the Vercel dashboard, or
  `vercel blob create-store <name> --access private`, then `vercel env pull`.
  Without it the library still works, it just stays on this device.

Env is read at boot, so restart the dev server after editing `.env.local`.

## Who can get in

The app itself has no allowlist — it only ever asks "is there a session?".
Membership is Clerk configuration: **Configure → Restrictions**, allowlist on,
with the addresses you want. Turn on *enforce on sign-in* too, or removing an
address only stops new sign-ups and leaves existing accounts working.

Clerk treats the allowlist and *restricted* sign-up mode as alternatives — it
refuses `allowlist: true` while the mode is `restricted`. Allowlist means "these
addresses may sign themselves up"; restricted means "invitation only".

## What the catalog gives you

Everything on screen comes from TMDB and updates itself. There is nothing to
curate and nothing to maintain.

| Surface        | Source                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Home           | `/trending`, `/movie/popular`, `/tv/popular`, `/movie/now_playing`, `/movie/top_rated`                                   |
| Films / Series | `/discover` with genre, year and sort filters, infinite scroll                                                          |
| Search         | `/search/multi` — films and series in one index                                                                         |
| Title page     | `/movie/{id}` or `/tv/{id}` with credits, videos, recommendations, external ids and watch providers in a single request |
| Episodes       | `/tv/{id}/season/{n}`                                                                                                   |
| Availability   | `watch/providers`, scoped to the region on your account                                                                 |

Every one of these goes through `/api/tmdb/[...path]`, which attaches the token
server-side and caches responses for an hour at the edge. The browser never
sees a credential.

## Playback

The player is source-agnostic. It ships knowing about exactly one thing —
YouTube trailers, which come free with the catalog — and otherwise plays
whatever you point it at.

Set a URL template on the **Settings** page — it is stored on your account, not
in this browser — and the app fills in the placeholders:

```
https://your-backend.example/{type}/{tmdb}
```

| Placeholder | Value                                            |
| ----------- | ------------------------------------------------ |
| `{type}`    | `movie` or `tv`                                  |
| `{tmdb}`    | TMDB numeric id                                  |
| `{imdb}`    | IMDb id, e.g. `tt0111161` (empty if not on file) |
| `{season}`  | season number, TV only                           |
| `{episode}` | episode number, TV only                          |

Films and series get separate fields, because backends often need different
shapes for the two. Anything that renders in an iframe works — a self-hosted
media server, an HLS gateway, your own signed-URL service.

Leave them blank and the app runs fine: it plays trailers and links out to the
licensed streaming services that carry each title.

The `NEXT_PUBLIC_SOURCE_URL*` and `NEXT_PUBLIC_REGION` env vars are still read,
but only as the defaults a brand-new account starts from. Once you save on the
Settings page, your account's values win.

## Library

Saved titles and recently played are written to `localStorage` under
`tv-library` first, so the UI never waits on the network, then synced to a
private Vercel Blob document at `library/${userId}.json`. For series, the card
rail shows how far through a season you are.

Two devices converge without a server-side clock: every entry carries a
timestamp, removals are tombstones rather than deletions, and `PUT /api/library`
merges the incoming document into the stored one field by field, newest write
per title winning. Tombstones are swept once they are older than the TTL in
`src/lib/library-doc.ts`.

## Keyboard

`/` focuses search from any screen. `Esc` leaves the field.

## Brand and metadata

The wordmark is `TV.` — amber `#FFB020` on ink `#0B0E14`. Everything the browser
and social crawlers need lives in `public/`:

| File                                        | Used for                                    |
| ------------------------------------------- | ------------------------------------------- |
| `favicon.svg`                               | browser tab, rounded tile                   |
| `apple-touch-icon.png`                      | iOS home screen (180×180)                   |
| `icon-192.png`, `icon-512.png`              | web app manifest, installed app, maskable   |
| `icon-maskable.svg`                         | vector source for the PNGs above            |
| `og.png`                                    | link previews (1200×630)                    |
| `site.webmanifest`                          | installability, standalone display          |
| `robots.txt`                                | crawl rules — everything is disallowed      |

Set `SITE_URL` before a production build. It becomes the `metadataBase` in
`src/app/layout.tsx`, which turns `og:image`, `og:url` and `canonical` into
absolute URLs — most crawlers require that. Left unset, they fall back to
root-relative paths and the build says so.

Because pages render on the client, routes set their own `document.title` at
runtime through `useDocumentTitle` in `src/lib/seo.ts`. Per-title metadata for
crawlers arrives when routes convert to server components — see
[ADR 0001](docs/adr/0001-adopt-a-server-tier.md).

## Deploying

```bash
vercel link
vercel blob create-store <name> --access private
vercel env add TMDB_TOKEN production          # and the rest of .env.example
vercel deploy --prod
```

Clerk **development** keys (`pk_test_…` / `sk_test_…`) do work on a
`*.vercel.app` URL, with the development banner and the development instance's
user cap. A production Clerk instance needs a domain you control — `vercel.app`
is on the public suffix list, so Clerk will not issue one for it. Point a custom
domain at the project first, then `clerk deploy`.

## Notes

Streaming availability is provided by JustWatch via TMDB and must be attributed
as such — the title page already does this.
