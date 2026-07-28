'use client'

import { createContext, useContext } from 'react'
import { PREFS_DEFAULTS, type Prefs } from './prefs'

export const PrefsContext = createContext<Prefs>(PREFS_DEFAULTS)

export function usePrefs(): Prefs {
  return useContext(PrefsContext)
}
