# 0003 — Ship a source registry instead of a blank template field

Status: accepted
Date: 2026-07-31

## Context

[0002](0002-where-user-data-lives.md) moved the playback templates out of env
vars and onto the account, and left the shape alone: two free-text fields,
`sourceUrlMovie` and `sourceUrlSeries`, seeded from `NEXT_PUBLIC_SOURCE_URL*`.
CONTEXT.md described the result as **source-agnostic** — the app fills a
user-supplied template and has no opinion about where bytes come from.

That reads well and does not match how the app is used. The backend in use is
reached through a rotating set of mirror hosts; when one is blocked, playback
dies until someone edits a URL by hand, in Settings, having first found out
which mirror is currently alive. The template field is the right primitive and
the wrong interface for the only thing that actually happens to it.

Nothing about being agnostic was buying anything either: one template was
configured, ever, and it was the same for both media types.

## Decision

**A `Source` is a named entry — `{ id, label, movie, series? }` — and the app
ships a registry of them** in `src/lib/source-registry.ts`, with
`DEFAULT_SOURCE_ID` naming one. Prefs store a `sourceId`, not URLs, so editing a
template in code reaches every account. Mirrors of one backend are generated
from a host list and two shared path shapes, because writing eighteen URLs that
differ by hostname guarantees the nineteenth edit misses one.

One entry carries both media types. A backend is one thing with two URL shapes,
and pairing them is what makes "films-only" expressible (`series` absent) rather
than a half-filled pair of unrelated fields.

**Capabilities are derived, never declared.** Films-only is `!series`; needs-IMDb
is `template.includes('{imdb}')`. A flag beside a template is a second thing to
keep true.

**The custom slot survives, as one entry with the reserved id `custom`.** It is
the escape hatch that keeps the app honest about not being tied to one backend,
and downstream it is a `Source` like any other. It is validated now that it is
the only route to a dead player: the film template is required, templates must
be absolute http(s) and must contain `{tmdb}` or `{imdb}`, and the film template
may not use `{season}`/`{episode}`, which can never resolve.

**Switching in the player is ephemeral**, carried as `?source=<id>` and never
written back. Reaching for another mirror is how you get one stubborn title to
play; it is not a statement about what the account should prefer. Keeping it in
the URL also keeps prefs written only by `savePrefs`, per 0002, and makes the
override survive a refresh.

**An unfillable placeholder makes a source unservable.** `resolveSourceUrl`
returns `null` instead of substituting an empty string. This was already a
latent bug: an `{imdb}` template on a title with no IMDb id built a URL with a
hole in it and loaded a broken embed indistinguishable from a dead host. The
picker greys out entries whose resolution returns `null`, so the same rule
drives the UI.

`NEXT_PUBLIC_SOURCE_URL`, `_MOVIE` and `_SERIES` are deleted. They were inlined
at build time, so changing one already meant a redeploy — exactly what editing
the registry costs, minus a layer of indirection. The legacy `sourceUrl*` keys
in Clerk metadata are ignored rather than migrated; at a handful of invited
users, re-picking once is cheaper than a matching pass nobody will delete.

## Consequences

The app is no longer source-agnostic, and CONTEXT.md no longer claims to be. It
ships an opinion about where bytes come from, in a file in this repository, and
that opinion is visible in the client bundle exactly as the env var was.

Dropping a host from the registry silently moves everyone on it to the default —
`normalizePrefs` coerces an unrecognised `sourceId`, the same way it already
coerces a malformed region. Loud alternatives were rejected as noise at this
scale, but it does mean a rename is indistinguishable from a removal.

Entry ids are derived from hostnames (`vsembed.su` → `vsembed-su`) and persist
in Clerk metadata, so a host string is effectively permanent. Reusing an id for
a different backend would silently repoint accounts.

The switcher cannot detect a *dead embed* — an iframe that loads and plays
nothing looks identical to one that works. It is a manual tool by necessity;
automatic failover would need a probe the browser is not allowed to make
cross-origin.

The film path `…/embed/{type}/{tmdb}` is inferred. The previous shared template
sent films to `…/embed/movie/{tmdb}//` with two empty trailing segments, which
the backend tolerated; the split assumes it also routes the short form.
