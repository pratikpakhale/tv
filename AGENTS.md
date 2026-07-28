# TV.

A catalog and player for films and series. Next.js (App Router) + React +
TypeScript + Tailwind, TanStack Query for TMDB data, Zustand for the library,
Clerk for accounts, Vercel Blob for sync.

Every page is a client component; the server tier holds the TMDB token, proxies
the API, and owns the library merge. Why there is a server tier at all is in
`docs/adr/`.

See `README.md` for setup, environment variables and how playback sources work.

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # serve the production build
npm run lint     # oxlint
```

## Before changing anything

Read `CONTEXT.md` — it is the domain glossary, and its terms are the ones to use
in names, commit messages and prose. Read the ADRs in `docs/adr/` that touch the
area you're working in. If a change contradicts one, say so rather than quietly
overriding it.
