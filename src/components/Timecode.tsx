import type { ReactNode } from 'react'

/**
 * The metadata rail: every fact about a title reads as one machine-readable
 * strip. Used on cards, detail headers and the player.
 */
export function Timecode({
  parts,
  className = '',
}: {
  parts: (string | ReactNode | null | undefined | false)[]
  className?: string
}) {
  const visible = parts.filter(Boolean)
  return (
    <div
      className={`data flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-dim ${className}`}
    >
      {visible.map((part, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-line">/</span>}
          {part}
        </span>
      ))}
    </div>
  )
}

export function ProgressRail({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className="h-[3px] w-full bg-line" role="presentation">
      <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
    </div>
  )
}
