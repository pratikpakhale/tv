import Link from 'next/link'
import { Star } from 'lucide-react'
import { mediaTypeOf, poster, rating, titleOf, yearOf } from '../lib/format'
import type { MediaType, TitleSummary } from '../lib/types'
import { ProgressRail } from './Timecode'

interface PosterCardProps {
  id: number
  media: MediaType
  title: string
  posterPath: string | null
  year: string
  score?: number
  progress?: number
  caption?: string
}

export function PosterCard({
  id,
  media,
  title,
  posterPath,
  year,
  score,
  progress,
  caption,
}: PosterCardProps) {
  const src = poster(posterPath)

  return (
    <Link
      href={`/title/${media}/${id}`}
      className="group block w-full focus-visible:outline-offset-4"
    >
      <div className="relative overflow-hidden rounded-sm bg-surface ring-1 ring-line transition duration-300 ease-out-soft group-hover:ring-mist/40">
        <div className="aspect-[2/3]">
          {src ? (
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 ease-out-soft group-hover:scale-[1.03]"
            />
          ) : (
            <div className="label flex h-full items-center justify-center px-3 text-center text-2xs text-dim">
              No artwork
            </div>
          )}
        </div>

        {score !== undefined && score > 0 && (
          <div className="data absolute top-1.5 right-1.5 flex items-center gap-1 rounded-xs bg-ink/85 px-1.5 py-0.5 text-2xs text-paper backdrop-blur-sm">
            <Star size={9} className="fill-amber text-amber" />
            {rating(score)}
          </div>
        )}

        {progress !== undefined && (
          <div className="absolute inset-x-0 bottom-0">
            <ProgressRail value={progress} />
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="truncate text-sm leading-tight font-medium text-paper/90 transition-colors group-hover:text-paper">
          {title}
        </p>
        <p className="data text-2xs text-dim">{caption ?? year}</p>
      </div>
    </Link>
  )
}

export function TitleCard({
  item,
  media,
}: {
  item: TitleSummary
  media?: MediaType
}) {
  return (
    <PosterCard
      id={item.id}
      media={media ?? mediaTypeOf(item)}
      title={titleOf(item)}
      posterPath={item.poster_path}
      year={yearOf(item)}
      score={item.vote_average}
    />
  )
}
