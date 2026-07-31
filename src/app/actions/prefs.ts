'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { normalizePrefs, prefsProblem, type Prefs } from '@/lib/prefs'

export async function savePrefs(input: Prefs): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Sign in required.' }

  const prefs = {
    region: String(input.region ?? '').trim(),
    sourceId: String(input.sourceId ?? '').trim(),
    customSourceMovie: String(input.customSourceMovie ?? '').trim(),
    customSourceSeries: String(input.customSourceSeries ?? '').trim(),
  }

  const problem = prefsProblem(prefs)
  if (problem) return { error: problem }

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { prefs: normalizePrefs(prefs) },
  })

  return {}
}
