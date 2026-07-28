import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

const CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
)

const PUBLIC_PATH = /^\/(sign-in|sign-up)(\/|$)/

const guard = clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  if (PUBLIC_PATH.test(pathname)) return

  const { userId } = await auth()
  if (userId) return

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ status_message: 'Sign in required.' }, { status: 401 })
  }

  await auth.protect()
})

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!CONFIGURED) return
  return guard(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|txt|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
