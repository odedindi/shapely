import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DarkMode, Theme } from '@/shapes/types'
import { log } from '@/lib/logger'

export interface PlatformState {
  darkMode: DarkMode
  theme: Theme
  language: string
  shapeEditorEnabled: boolean
  cardPanelPosition: { xFrac: number; yFrac: number }
  cardPanelCollapsed: boolean
  favoriteShapeIds: string[]
  activeProfileId: string | null
  updatePlatformSetting: <K extends keyof Omit<PlatformState, 'updatePlatformSetting'>>(
    key: K,
    value: PlatformState[K]
  ) => void
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set) => ({
      darkMode: 'auto',
      theme: 'default',
      language: 'en',
      shapeEditorEnabled: false,
      cardPanelPosition: { xFrac: 1, yFrac: 1 },
      cardPanelCollapsed: false,
      favoriteShapeIds: [],
      activeProfileId: null,
      updatePlatformSetting: (key, value) =>
        set((s) => {
          log.ui.info('platform setting changed', { key, from: s[key], to: value })
          return { ...s, [key]: value }
        }),
    }),
    {
      name: 'shapely-platform',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PlatformState>),
      }),
    }
  )
)
