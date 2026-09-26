/// <reference lib="webworker" />

import { defaultCache } from '@serwist/turbopack/worker'
import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  type PrecacheEntry,
  type SerwistGlobalConfig,
} from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const DAY = 24 * 60 * 60

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /* The library is the one per-user document, and the sync loop owns its
       freshness. A cached copy served offline would be merged back up as if
       it were current. */
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith('/api/library'),
      handler: new NetworkOnly(),
    },
    /* Catalog responses are the same for every account and the server already
       caches them for an hour, so a network-first copy is what lets pages that
       were opened once still render offline. */
    {
      matcher: ({ sameOrigin, url }) =>
        sameOrigin && url.pathname.startsWith('/api/tmdb/'),
      method: 'GET',
      handler: new NetworkFirst({
        cacheName: 'tmdb-api',
        networkTimeoutSeconds: 6,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({
            maxEntries: 300,
            maxAgeSeconds: 7 * DAY,
            maxAgeFrom: 'last-used',
          }),
        ],
      }),
    },
    /* Artwork is immutable per path. Plain <img> requests are no-cors, so the
       opaque status 0 has to be allowed through. */
    {
      matcher: ({ url }) => url.origin === 'https://image.tmdb.org',
      handler: new CacheFirst({
        cacheName: 'tmdb-images',
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 500,
            maxAgeSeconds: 30 * DAY,
            maxAgeFrom: 'last-used',
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

serwist.addEventListeners()
