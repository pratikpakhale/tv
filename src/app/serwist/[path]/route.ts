import { spawnSync } from 'node:child_process'
import { createSerwistRoute } from '@serwist/turbopack'

/* Versions the precached offline page, so a deploy that changes it replaces
   the copy installed devices are holding. */
const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  crypto.randomUUID()

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: 'src/app/sw.ts',
    additionalPrecacheEntries: [{ url: '/~offline', revision }],
    useNativeEsbuild: true,
  })
