import { ImageResponse } from 'next/og'
import { SPLASH_SCREENS } from '@/lib/splash'

export const dynamicParams = false

export function generateStaticParams() {
  return SPLASH_SCREENS.map((screen) => ({ size: `${screen.size}.png` }))
}

/* The glyph paths from favicon.svg, without its tile. */
const MARK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 18 53 28"><g fill="#FFB020"><rect x="6" y="18" width="21" height="7"/><rect x="12.5" y="18" width="8" height="28"/><path d="M29 18h7.5l3 18 3.5-18h7l-6.5 28h-7.5z"/><rect x="52" y="39" width="7" height="7"/></g></svg>',
)}`

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params
  const screen = SPLASH_SCREENS.find((item) => `${item.size}.png` === size)
  if (!screen) return new Response(null, { status: 404 })

  const markWidth = Math.round(Math.min(screen.width, screen.height) * 0.26)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0E14',
        }}
      >
        <img
          src={MARK}
          alt=""
          width={markWidth}
          height={Math.round((markWidth * 28) / 53)}
        />
      </div>
    ),
    { width: screen.width, height: screen.height },
  )
}
