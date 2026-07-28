import type { ReactNode } from 'react'
import Link from 'next/link'

export function PosterSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-sm bg-surface" />
      <div className="mt-2 h-3 w-4/5 rounded-xs bg-surface" />
      <div className="mt-1.5 h-2 w-1/3 rounded-xs bg-surface" />
    </div>
  )
}

export function SkeletonRow({ count = 8 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-hidden">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="w-[122px] shrink-0 sm:w-[136px] lg:w-[150px]">
          <PosterSkeleton />
        </div>
      ))}
    </div>
  )
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string
  hint: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3 border-l-2 border-line py-8 pl-5">
      <p className="display text-xl font-semibold text-paper">{title}</p>
      <p className="max-w-md text-base text-mist">{hint}</p>
      {action}
    </div>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something broke.'
  return (
    <Empty
      title="Nothing loaded"
      hint={message}
      action={
        <Link
          href="/"
          className="label text-2xs text-amber underline underline-offset-4"
        >
          Back to home
        </Link>
      }
    />
  )
}
