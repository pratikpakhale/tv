import type { NextRequest } from 'next/server'

const BASE = 'https://api.themoviedb.org/3'
const CACHE_SECONDS = 60 * 60

function fail(status: number, message: string) {
  return Response.json({ status_message: message }, { status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = process.env.TMDB_TOKEN
  if (!token) return fail(500, 'No TMDB token configured on the server.')

  const { path } = await params
  const url = new URL(`${BASE}/${path.join('/')}`)
  url.search = request.nextUrl.search

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    next: { revalidate: CACHE_SECONDS },
  })

  return new Response(response.body, {
    status: response.status,
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
    },
  })
}
