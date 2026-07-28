'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Bookmark, Clapperboard, Home, SlidersHorizontal, Tv } from 'lucide-react'
import { SearchField } from './SearchField'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/browse/movie', label: 'Films', icon: Clapperboard, end: false },
  { to: '/browse/tv', label: 'Series', icon: Tv, end: false },
  { to: '/library', label: 'Library', icon: Bookmark, end: false },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal, end: false },
]

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-dvh md:pl-14">
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-ink/95 backdrop-blur-md md:inset-y-0 md:right-auto md:left-0 md:w-14 md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:pt-4"
      >
        <Link
          href="/"
          aria-label="TV. home"
          className="mb-2 hidden size-9 place-items-center md:grid"
        >
          <span className="display text-lg font-semibold text-amber">TV.</span>
        </Link>

        {NAV.map(({ to, label, icon: Icon, end }) => {
          const isActive = end ? pathname === to : pathname.startsWith(to)
          return (
            <Link
              key={to}
              href={to}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative grid h-12 w-full place-items-center transition-colors md:h-11 ${
                isActive ? 'text-paper' : 'text-dim hover:text-mist'
              }`}
            >
              {isActive && (
                <span className="absolute top-1/2 left-0 hidden h-5 w-0.5 -translate-y-1/2 bg-amber md:block" />
              )}
              <Icon size={17} strokeWidth={1.75} />
              <span className="sr-only">{label}</span>
            </Link>
          )
        })}
      </nav>

      <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 md:px-8">
          <SearchField />
          <UserButton />
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-28 md:px-8 md:pb-16">
        {children}
      </main>
    </div>
  )
}
