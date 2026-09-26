'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Bookmark,
  ChevronLeft,
  Clapperboard,
  Home,
  SlidersHorizontal,
  Tv,
} from 'lucide-react'
import { SearchField } from './SearchField'
import { InstallHint } from './InstallHint'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/browse/movie', label: 'Films', icon: Clapperboard, end: false },
  { to: '/browse/tv', label: 'Series', icon: Tv, end: false },
  { to: '/library', label: 'Library', icon: Bookmark, end: false },
  { to: '/settings', label: 'Settings', icon: SlidersHorizontal, end: false },
]

/* Screens reached from a tab rather than being one. An installed app has no
   browser back button, so these carry their own. */
const isDetail = (pathname: string) =>
  pathname.startsWith('/title/') || pathname === '/search'

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const back = () => {
    if (window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <div className="min-h-dvh md:pl-[calc(3.5rem+env(safe-area-inset-left))]">
      <nav
        aria-label="Primary"
        className="touch-chrome fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-line bg-ink/95 pr-safe pb-safe pl-safe backdrop-blur-md md:inset-y-0 md:right-auto md:left-0 md:w-[calc(3.5rem+env(safe-area-inset-left))] md:flex-col md:justify-start md:gap-1 md:border-t-0 md:border-r md:pt-4 md:pr-0 md:pb-0"
      >
        <Link
          href="/"
          aria-label="TV. home"
          className="mb-2 hidden size-9 place-items-center self-center md:grid"
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
              title={label}
              className={`group relative flex h-[3.25rem] flex-1 flex-col items-center justify-center gap-1 transition-colors active:opacity-60 md:h-11 md:flex-none ${
                isActive
                  ? 'text-amber md:text-paper'
                  : 'text-dim hover:text-mist'
              }`}
            >
              {isActive && (
                <span className="absolute top-1/2 left-0 hidden h-5 w-0.5 -translate-y-1/2 bg-amber md:block" />
              )}
              <Icon size={19} strokeWidth={isActive ? 2 : 1.75} className="md:size-[17px]" />
              <span className="text-[0.625rem] leading-none font-medium tracking-wide md:sr-only">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      <header className="sticky top-0 z-20 border-b border-line bg-ink/90 pt-safe backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 py-2.5 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] md:gap-3 md:py-3 md:pr-[max(2rem,env(safe-area-inset-right))] md:pl-8">
          {isDetail(pathname) && (
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className="-ml-2 grid size-10 shrink-0 place-items-center rounded-xs text-mist transition-colors hover:text-paper active:opacity-60 md:hidden"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <SearchField />
          <div className="grid size-10 shrink-0 place-items-center">
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-[max(1rem,env(safe-area-inset-left))] pt-5 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pt-6 md:pr-[max(2rem,env(safe-area-inset-right))] md:pb-16 md:pl-8">
        {children}
      </main>

      <InstallHint />
    </div>
  )
}
