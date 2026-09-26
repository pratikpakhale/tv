import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Geist_Mono, Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { SerwistProvider } from '@serwist/turbopack/react'
import { BRAND, DEFAULT_TITLE, DESCRIPTION } from '@/lib/brand'
import { CLERK_APPEARANCE } from '@/lib/clerk-appearance'
import { SPLASH_SCREENS, splashUrl } from '@/lib/splash'
import { Setup } from '@/components/Setup'
import { Providers } from './providers'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-fraunces',
})

const sans = Inter({ subsets: ['latin'], variable: '--font-inter' })

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

const site = process.env.SITE_URL?.replace(/\/+$/, '')

export const metadata: Metadata = {
  metadataBase: site ? new URL(site) : null,
  title: DEFAULT_TITLE,
  description: DESCRIPTION,
  applicationName: BRAND,
  alternates: { canonical: '/' },
  icons: {
    icon: { url: '/favicon.svg', type: 'image/svg+xml' },
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    title: BRAND,
    capable: true,
    statusBarStyle: 'black-translucent',
    startupImage: SPLASH_SCREENS.map((screen) => ({
      url: splashUrl(screen),
      media: screen.media,
    })),
  },
  formatDetection: { telephone: false },
  /* `appleWebApp.capable` above emits the standard `mobile-web-app-capable`,
     which is all Safari 16.4 and newer reads. Older iOS only launches
     standalone off the `apple-` prefixed spelling, and Next no longer writes
     it, so it is set by hand rather than duplicating the standard one. */
  other: { 'apple-mobile-web-app-capable': 'yes' },
  openGraph: {
    type: 'website',
    siteName: BRAND,
    title: `${BRAND} — Films & Series`,
    description: DESCRIPTION,
    url: '/',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: `${BRAND} — Films & Series`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND} — Films & Series`,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
}

/* `cover` hands the notch and home-indicator areas to the page; every edge
   that touches them pads itself with the `*-safe` utilities in globals.css. */
export const viewport: Viewport = {
  themeColor: '#0B0E14',
  colorScheme: 'dark',
  viewportFit: 'cover',
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: BRAND,
  applicationCategory: 'EntertainmentApplication',
  operatingSystem: 'Any',
  description: DESCRIPTION,
}

const REQUIRED_KEYS = [
  'TMDB_TOKEN',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
]

export default function RootLayout({ children }: { children: ReactNode }) {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key])

  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body>
        {missing.length ? (
          <Setup missing={missing} />
        ) : (
          <SerwistProvider
            swUrl="/serwist/sw.js"
            disable={process.env.NODE_ENV === 'development'}
            reloadOnOnline={false}
          >
            <ClerkProvider appearance={CLERK_APPEARANCE}>
              <Providers>{children}</Providers>
            </ClerkProvider>
          </SerwistProvider>
        )}
      </body>
    </html>
  )
}