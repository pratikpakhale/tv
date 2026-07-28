# 0002 — Where user data lives: prefs in Clerk, library in Blob

Status: accepted
Date: 2026-07-28

## Context

[0001](0001-adopt-a-server-tier.md) brings identity but not storage. Two kinds
of user-owned data need a home once accounts exist:

- **Prefs** — region, the playback source templates, the source label. Today
  these are `VITE_*` build-time env vars, shared by everyone and changeable only
  by redeploying.
- **Library** — `saved` and `history` from `src/store/library.ts`, today a
  `localStorage` document per browser.

They look similar and are not. Prefs are small, read on nearly every render, and
change a few times a year. The library is unbounded, written on every play, and
grows for as long as the app is used.

Clerk stores arbitrary JSON on a user (`publicMetadata`, `privateMetadata`,
`unsafeMetadata`), which raises the obvious question of whether it can serve as
the database and save us a dependency.

For prefs, yes. For the library, no, and the limit is specific: Clerk caps
**total metadata at 8KB per user** across all three fields. Measured against the
actual shapes in `library.ts` — 121 bytes for a `LibraryEntry`, 187 for a
`HistoryEntry` once the `${media}:${id}` key is counted — that is roughly **53
titles**, saved and watched combined, permanently. A personal catalog passes
that in months. `recordWatch` also fires on every play, so each playback would
be a full-document rewrite against a rate-limited API. Clerk's own documentation
says to use a database past this point.

## Decision

**Prefs go in Clerk `publicMetadata`.** The whole set is 300–500 bytes, well
inside the cap. `publicMetadata` is backend-write, frontend-read, which is
exactly right: the settings page writes through a server action, and the client
reads prefs off the session with no extra fetch. `unsafeMetadata` was rejected
because the user could write it directly. Prefs stay out of session-token custom
claims — Clerk recommends keeping those under 1.2KB, and exceeding it prevents
the cookie being set, which breaks authentication itself. There is no reason to
go near that line.

`src/lib/source.ts` stops reading `import.meta.env`. The existing env vars
remain as the defaults a user starts with, so a fresh instance still works
before anyone opens settings.

**The library goes in Vercel Blob**, one JSON document per user at
`library/${userId}.json`, read and written through `app/api/library`.

The library is already a single JSON document — the Zustand persist payload —
so this stores what we have rather than modelling it twice. No schema, no
migrations, no ORM, no second vendor. Postgres (Neon, or Supabase's) was the
alternative and is the better answer at a scale this app does not have; it costs
setup we would be paying for query capability we would not use. Upstash Redis
was close, and its atomic operations are a genuine advantage over
read-modify-write, but it is another service to justify. Clerk metadata is ruled
out above.

Persistence hangs off Zustand's `storage` option: `localStorage` stays as the
offline cache with debounced write-through to Blob. `useLibrary`,
`useContinueWatching` and `useSavedTitles` — and every call site — are unchanged.

Two things the current shape cannot express correctly across devices, added
here rather than later:

- `LibraryEntry` gains `savedAt`, and un-saving becomes a soft delete. Without
  both, `history` merges cleanly on `watchedAt` while `saved` does not, and an
  un-save on one device loses to a stale sync from another.
- On first sign-in, an existing anonymous `localStorage` library merges upward.
  An empty remote must never overwrite it.

Merging happens server-side in the `PUT` handler, so the rule lives in one place
rather than in each client.

## Consequences

Every read pulls the whole library and every write rewrites it. At one user, or
a handful, this is unnoticeable. It stops being reasonable if we ever want
server-side filtering or questions like "what did I watch in March" — that is
the signal to move to Postgres, and the JSON document migrates into rows without
the client noticing.

Two details settled during implementation. The store is created with
`--access private`: with `addRandomSuffix: false` the blob path is
`library/<clerk user id>.json`, which is guessable, so a public store would put
one person's history behind nothing but an unpublished URL. And `put` accepts
`ifMatch` with the etag from `get`, so the read-merge-write in the `PUT` handler
is a compare-and-set with a bounded retry rather than the last-write-wins this
ADR originally assumed — two tabs saving at once no longer lose an entry.

Two writers racing on the same document can lose an entry, since Blob has no
compare-and-set. Debounced write-through plus server-side merge makes the window
small and the loss recoverable from the other device's cache; it does not close
it. Redis is the upgrade if this ever bites.

Prefs and library live in different places, so "export everything about me" has
to read from two systems.

Source URL templates become user-supplied values stored on the server and
rendered into an iframe. Restricted sign-up ([0001](0001-adopt-a-server-tier.md))
is what keeps that uninteresting — the only people who can store one are people
we invited. Opening sign-up makes it a stored-injection surface that needs real
validation first.
