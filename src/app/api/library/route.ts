import type { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { get, put } from '@vercel/blob'
import {
  EMPTY_DOC,
  mergeDocs,
  normalizeDoc,
  type LibraryDoc,
} from '@/lib/library-doc'

const MAX_BODY_BYTES = 1024 * 1024
const WRITE_ATTEMPTS = 3

function pathFor(userId: string) {
  return `library/${userId}.json`
}

async function readDoc(userId: string) {
  try {
    const result = await get(pathFor(userId), {
      access: 'private',
      useCache: false,
    })
    if (!result || result.statusCode !== 200) return { doc: EMPTY_DOC }
    const text = await new Response(result.stream).text()
    return { doc: normalizeDoc(JSON.parse(text)), etag: result.blob.etag }
  } catch {
    return { doc: EMPTY_DOC }
  }
}

async function writeDoc(userId: string, doc: LibraryDoc, etag?: string) {
  await put(pathFor(userId), JSON.stringify(doc), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    ifMatch: etag,
  })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json(EMPTY_DOC)

  const { doc } = await readDoc(userId)
  return Response.json(doc)
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'No blob store configured.' }, { status: 501 })
  }

  const body = await request.text()
  if (body.length > MAX_BODY_BYTES) {
    return Response.json({ error: 'Library too large.' }, { status: 413 })
  }

  let incoming: LibraryDoc
  try {
    incoming = normalizeDoc(JSON.parse(body))
  } catch {
    return Response.json({ error: 'Malformed library.' }, { status: 400 })
  }

  const now = Date.now()

  for (let attempt = 1; attempt <= WRITE_ATTEMPTS; attempt++) {
    const { doc, etag } = await readDoc(userId)
    const merged = mergeDocs(doc, incoming, now)
    try {
      await writeDoc(userId, merged, etag)
      return Response.json(merged)
    } catch (error) {
      if (attempt === WRITE_ATTEMPTS) throw error
    }
  }

  return Response.json({ error: 'Could not save library.' }, { status: 500 })
}
