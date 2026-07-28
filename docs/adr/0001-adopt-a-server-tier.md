# 0001 — Adopt a server tier: Next.js and Clerk

Status: accepted
Date: 2026-07-28

## Context

The app was built client-only on purpose. Vite builds it to static files, TMDB
is called straight from the browser, and the library lives in `localStorage`.
`README.md` advertised the consequence: no backend, no database, deploys
anywhere.

Three wanted features each break that property, and they break it in the same
place:

- **Gating.** The deployment should not be open to the public web.
- **Identity.** Prefs and history should follow a person across devices, which
  requires knowing who the person is.
- **Sync.** `localStorage` is per-browser. Two devices are two libraries.

None of these can be done honestly in the browser alone. A shared passphrase or
an export/import file gets close enough to fool yourself, but there is no way to
keep a secret in a static bundle, so any "gate" is decoration.

Separately, the client-only design already leaked `VITE_TMDB_TOKEN` into the
bundle. `README.md` acknowledged this and recommended a proxy for public
deployments — which is the same server tier these features need.

## Decision

Adopt Next.js (App Router) on Vercel, and Clerk for authentication.

**Next.js over "Vite plus a few `api/` functions."** Vercel will serve functions
alongside a Vite SPA, so the minimum viable server tier does not strictly
require a framework change. But once there is a server, per-title metadata for
crawlers, request-time prefs and a session-aware shell all become things worth
having, and each one is awkward to bolt onto a static bundle. Next is where that
work is cheap. The app is seven routes and five components; the migration is
bounded.

**Client-rendered first, RSC later.** Every route stays `'use client'` with
TanStack Query fetching as it does today, and Next acts as host and API layer.
The URL structure is unchanged. Converting `Home`, `Title` and `Browse` to
server components is a follow-up, done per route, and the payoff is real —
`generateMetadata` gives every film and series its own crawlable title and
poster preview, which a static build cannot do. That conversion is deliberately
not part of this decision, so that the migration has a working checkpoint before
the rendering model changes.

**Clerk over Supabase Auth, better-auth or Auth.js.** All four work. Clerk
provisions through the Vercel Marketplace with env vars wired automatically, and
`clerkMiddleware()` gates every route in one file. It also settles the gating
question without code: Clerk's dashboard has a **Restricted** sign-up mode and
an email/domain allowlist, so "invite only" is configuration rather than an
allowlist check we write and maintain. Supabase would have been the pick had we
stayed client-only, because it needs no server; that advantage disappears once
Next is in the picture, and it brings a Postgres we do not otherwise want (see
[0002](0002-where-user-data-lives.md)).

The TMDB token moves behind `app/api/tmdb/[...path]`, becoming `TMDB_TOKEN`,
server-only.

## Consequences

The app no longer deploys as static files anywhere. It needs Vercel, or a Node
host. This is the real cost and it is not recoverable without undoing the three
features that motivated it.

Local development now needs Clerk keys as well as a TMDB token, so a fresh
clone has more setup than `npm install`. `README.md` and `AGENTS.md` change
their claims accordingly when the migration lands, not before.

The TMDB token stops shipping to browsers, which closes a known weakness the
old README could only apologise for.

The allowlist turned out to be available on the free plan, so the middleware
never grew an email check. It did come with a constraint the docs bury: Clerk
rejects `allowlist: true` while sign-up mode is `restricted`, with
`sign_up_mode_restricted_invalid_value`. The two are alternatives, not layers —
allowlist means "these addresses may sign themselves up", restricted means
"invitation only". We run `public` mode with the allowlist on, plus
*enforce on sign-in*, so removing an address closes the door on an account that
already exists rather than only on new ones.

`auth.protect()` answers a signed-out request with a 404 rewrite unless it can
tell the request is a document navigation — it reads `Sec-Fetch-Dest`. A browser
gets the redirect; `curl` without that header gets a 404 and looks like a broken
deployment. Check `x-clerk-auth-reason` before believing the status code.

`react-router-dom` is removed. Most of that is mechanical, with one exception
worth knowing about: Next's `useSearchParams` is read-only, and the two places
that currently write to the query string — genre and year filters in `Browse`,
season and episode selection in `Watch` — have to rebuild the URL through the
router instead.
