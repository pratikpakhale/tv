import type { MetadataRoute } from 'next'
import { BRAND, DESCRIPTION } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: `${BRAND} Films & Series`,
    short_name: BRAND,
    description: DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0B0E14',
    theme_color: '#0B0E14',
    categories: ['entertainment', 'video'],
    icons: [
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    /* Tapping the icon returns to the running app where it was left, rather
       than opening a second copy at the start URL. */
    launch_handler: { client_mode: 'navigate-existing' },
    shortcuts: [
      { name: 'Search', url: '/search' },
      { name: 'Library', url: '/library' },
      { name: 'Films', url: '/browse/movie' },
      { name: 'Series', url: '/browse/tv' },
    ],
  }
}
