'use client'

import { useEffect, useState, useTransition } from 'react'
import { useUser } from '@clerk/nextjs'
import { savePrefs } from '@/app/actions/prefs'
import { usePrefs } from '@/lib/prefs-context'
import { useDocumentTitle } from '@/lib/seo'
import type { Prefs } from '@/lib/prefs'

const FIELD_CLASS =
  'w-full rounded-sm border border-line bg-surface px-3 py-2 font-mono text-xs text-paper placeholder:text-dim focus:border-mist/40 focus:outline-none'

function Field({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string
  hint: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoComplete="off"
        className={`${FIELD_CLASS} mt-2`}
      />
      <span className="mt-2 block text-2xs text-dim">{hint}</span>
    </label>
  )
}

export default function SettingsPage() {
  const prefs = usePrefs()
  const { user } = useUser()
  const [draft, setDraft] = useState<Prefs>(prefs)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  useDocumentTitle('Settings')

  useEffect(() => setDraft(prefs), [prefs])

  const set = (key: keyof Prefs) => (value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setSaved(false)
    setError(null)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    startTransition(async () => {
      const result = await savePrefs(draft)
      if (result.error) {
        setError(result.error)
        return
      }
      await user?.reload()
      setSaved(true)
    })
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="display text-2xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-mist">
        These follow your account, not this browser.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-7">
        <Field
          label="Region"
          hint="Two-letter country code. Drives release dates and the streaming availability list."
          value={draft.region}
          placeholder="IN"
          onChange={set('region')}
        />

        <div className="space-y-7 border-t border-line pt-7">
          <p className="text-sm text-mist">
            Playback templates. Leave both blank and the player shows trailers
            only. Placeholders:{' '}
            <code className="font-mono text-xs text-amber">
              {'{type} {tmdb} {imdb} {season} {episode}'}
            </code>
          </p>

          <Field
            label="Film source"
            hint="Used for movies."
            value={draft.sourceUrlMovie}
            placeholder="https://example.com/embed/{type}/{tmdb}"
            onChange={set('sourceUrlMovie')}
          />

          <Field
            label="Series source"
            hint="Used for episodes."
            value={draft.sourceUrlSeries}
            placeholder="https://example.com/embed/{type}/{tmdb}/{season}/{episode}"
            onChange={set('sourceUrlSeries')}
          />

          <Field
            label="Source label"
            hint="Name shown on the player's source switcher."
            value={draft.sourceLabel}
            placeholder="Configured source"
            onChange={set('sourceLabel')}
          />
        </div>

        <div className="flex items-center gap-4 border-t border-line pt-7">
          <button
            type="submit"
            disabled={pending}
            className="label rounded-xs border border-amber bg-amber px-4 py-2 text-2xs text-ink transition-opacity disabled:opacity-40"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>

          {error && <p className="text-2xs text-flare">{error}</p>}
          {saved && !error && <p className="text-2xs text-dim">Saved</p>}
        </div>
      </form>
    </div>
  )
}
