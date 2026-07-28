export function Setup({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <span className="display text-xl font-semibold text-amber">TV.</span>
      <h1 className="display mt-6 text-3xl font-semibold">Finish setup</h1>
      <p className="mt-3 text-base text-mist">
        TV. reads its catalog from TMDB and its accounts from Clerk. Both need a
        key before anything renders.
      </p>

      <pre className="mt-6 overflow-x-auto rounded-sm border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-paper/80">
        <code>{`cp .env.example .env.local
# then set:
${missing.join('=\n')}=`}</code>
      </pre>

      <p className="mt-4 text-2xs text-dim">
        From TMDB, copy the API Read Access Token — the long JWT, not the short
        v3 key. Secrets stay on the server; the browser never sees them. Restart
        the dev server after editing, because env is only read at boot.
      </p>

      <div className="mt-8 flex flex-wrap gap-6">
        <a
          href="https://www.themoviedb.org/settings/api"
          target="_blank"
          rel="noreferrer"
          className="label inline-flex w-fit items-center gap-2 border-b border-amber pb-1 text-2xs text-amber"
        >
          TMDB token
        </a>
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noreferrer"
          className="label inline-flex w-fit items-center gap-2 border-b border-amber pb-1 text-2xs text-amber"
        >
          Clerk keys
        </a>
      </div>
    </main>
  )
}
