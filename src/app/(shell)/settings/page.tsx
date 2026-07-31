'use client'

import { useEffect, useState, useTransition } from 'react'
import { useUser } from '@clerk/nextjs'
import { savePrefs } from '@/app/actions/prefs'
import { usePrefs } from '@/lib/prefs-context'
import { useDocumentTitle } from '@/lib/seo'
import { sourceOptions } from '@/lib/source'
import { CUSTOM_SOURCE_ID } from '@/lib/source-registry'
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

function SourceRow({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string
  hint?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2.5 transition-colors last:border-b-0 ${
        selected ? 'bg-surface' : 'hover:bg-surface/50'
      }`}
    >
      <input
        type="radio"
        name="source"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${selected ? 'bg-amber' : 'bg-line'}`}
      />
      <span
        className={`flex-1 truncate font-mono text-xs ${selected ? 'text-paper' : 'text-mist'}`}
      >
        {label}
      </span>
      {hint && <span className="label shrink-0 text-2xs text-dim">{hint}</span>}
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

  const options = sourceOptions(draft)

  const dirty = (Object.keys(draft) as (keyof Prefs)[]).some(
    (key) => draft[key] !== prefs[key],
  )

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

        <div className="space-y-4 border-t border-line pt-7">
          <div>
            <span className="eyebrow">Source</span>
            <p className="mt-2 text-sm text-mist">
              Where playback comes from. The listed hosts are mirrors of one
              backend — switch when one stops answering, from here or from the
              player.
            </p>
          </div>

          <div className="overflow-hidden rounded-sm border border-line">
            {options.map((source) => (
              <SourceRow
                key={source.id}
                label={source.label}
                hint={source.movie && !source.series ? 'Films only' : undefined}
                selected={draft.sourceId === source.id}
                onSelect={() => set('sourceId')(source.id)}
              />
            ))}
          </div>

          {draft.sourceId === CUSTOM_SOURCE_ID && (
            <div className="space-y-7 pt-3">
              <p className="text-sm text-mist">
                Placeholders:{' '}
                <code className="font-mono text-xs text-amber">
                  {'{type} {tmdb} {imdb} {season} {episode}'}
                </code>
              </p>

              <Field
                label="Film template"
                hint="Required. Films have no season or episode, so those placeholders cannot be used here."
                value={draft.customSourceMovie}
                placeholder="https://example.com/embed/{type}/{tmdb}"
                onChange={set('customSourceMovie')}
              />

              <Field
                label="Series template"
                hint="Optional. Leave blank for a backend that only carries films."
                value={draft.customSourceSeries}
                placeholder="https://example.com/embed/{type}/{tmdb}/{season}/{episode}"
                onChange={set('customSourceSeries')}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-line pt-7">
          <button
            type="submit"
            disabled={pending || !dirty}
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
