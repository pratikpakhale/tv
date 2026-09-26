/**
 * iOS ignores the manifest's background colour at launch and shows white
 * unless it finds an `apple-touch-startup-image` whose media query matches the
 * device exactly — CSS size, pixel ratio and orientation. One entry per
 * distinct screen, portrait; landscape is derived.
 */
const SCREENS: [width: number, height: number, ratio: number][] = [
  [440, 956, 3], // iPhone 16/17 Pro Max
  [420, 912, 3], // iPhone Air
  [402, 874, 3], // iPhone 16/17 Pro
  [430, 932, 3], // iPhone 14 Pro Max, 15/16 Plus, 15 Pro Max
  [393, 852, 3], // iPhone 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // iPhone 12/13 Pro Max, 14 Plus
  [390, 844, 3], // iPhone 12, 13, 14, 16e
  [375, 812, 3], // iPhone X, XS, 11 Pro, 12/13 mini
  [414, 896, 3], // iPhone XS Max, 11 Pro Max
  [414, 896, 2], // iPhone XR, 11
  [414, 736, 3], // iPhone 8 Plus
  [375, 667, 2], // iPhone 8, SE
  [1032, 1376, 2], // iPad Pro 13"
  [1024, 1366, 2], // iPad Pro 12.9"
  [834, 1210, 2], // iPad Pro 11" (M4)
  [834, 1194, 2], // iPad Pro 11"
  [820, 1180, 2], // iPad Air 10.9"
  [810, 1080, 2], // iPad 10.2"
  [768, 1024, 2], // iPad 9.7", mini 5
  [744, 1133, 2], // iPad mini 6+
]

export interface SplashScreen {
  size: string
  width: number
  height: number
  media: string
}

export const SPLASH_SCREENS: SplashScreen[] = SCREENS.flatMap(
  ([width, height, ratio]) =>
    (['portrait', 'landscape'] as const).map((orientation) => {
      const [w, h] =
        orientation === 'portrait'
          ? [width * ratio, height * ratio]
          : [height * ratio, width * ratio]
      return {
        size: `${w}x${h}`,
        width: w,
        height: h,
        media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation})`,
      }
    }),
)

export const splashUrl = (screen: SplashScreen) => `/splash/${screen.size}.png`
