export interface Source {
  id: string
  label: string
  movie: string
  series?: string
}

export const CUSTOM_SOURCE_ID = 'custom'
export const DEFAULT_SOURCE_ID = 'vsembed-su'

/** Mirrors of one backend, sharing a path shape. They rotate as domains get blocked. */
const MIRROR_HOSTS = [
  'vsembed.su',
  'vidsrcme.su',
  'vidsrc-me.su',
  'vsrc.su',
  'vidsrc.sbs',
]

const MIRROR_PATH = {
  movie: '/embed/{type}/{tmdb}',
  series: '/embed/{type}/{tmdb}/{season}/{episode}',
}

function mirror(host: string): Source {
  return {
    id: host.replaceAll('.', '-'),
    label: host,
    movie: `https://${host}${MIRROR_PATH.movie}`,
    series: `https://${host}${MIRROR_PATH.series}`,
  }
}

export const SOURCES: Source[] = MIRROR_HOSTS.map(mirror)

export function findSource(id: string): Source | undefined {
  return SOURCES.find((source) => source.id === id)
}

export function defaultSource(): Source {
  return findSource(DEFAULT_SOURCE_ID) ?? SOURCES[0]
}
