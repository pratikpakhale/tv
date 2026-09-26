import type { NextConfig } from 'next'
import { withSerwist } from '@serwist/turbopack'

export default withSerwist({
  turbopack: { root: import.meta.dirname },
} satisfies NextConfig)
