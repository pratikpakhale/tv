import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Row({
  heading,
  action,
  children,
}: {
  heading: string
  action?: ReactNode
  children: ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)

  const nudge = (direction: 1 | -1) => {
    const node = track.current
    if (!node) return
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="group/row">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="eyebrow">{heading}</h2>
        <div className="flex items-center gap-1">
          {action}
          <div className="hidden opacity-0 transition-opacity group-hover/row:opacity-100 md:flex">
            <button
              type="button"
              aria-label={`Scroll ${heading} left`}
              onClick={() => nudge(-1)}
              className="grid size-6 place-items-center text-dim transition-colors hover:text-paper"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              aria-label={`Scroll ${heading} right`}
              onClick={() => nudge(1)}
              className="grid size-6 place-items-center text-dim transition-colors hover:text-paper"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={track}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
      >
        {children}
      </div>
    </section>
  )
}

export function RowItem({ children }: { children: ReactNode }) {
  return (
    <div className="w-[122px] shrink-0 snap-start sm:w-[136px] lg:w-[150px]">
      {children}
    </div>
  )
}

export function Grid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
      {children}
    </div>
  )
}
