import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CombinationStyle, CellRevealMode, DarkMode, Theme } from '@/shapes/types'
import { log } from '@/lib/logger'

export interface SettingsState {
  gridSize: 2 | 3 | 4 | 5
  cellRevealMode: CellRevealMode
  combinationStyle: CombinationStyle
  adaptiveDifficulty: boolean
  timerEnabled: boolean
  darkMode: DarkMode
  theme: Theme
  language: string
  shapeEditorEnabled: boolean
  updateSetting: <K extends keyof Omit<SettingsState, 'updateSetting'>>(
    key: K,
    value: SettingsState[K]
  ) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      gridSize: 3,
      cellRevealMode: 'visible',
      combinationStyle: 'overlay',
      adaptiveDifficulty: true,
      timerEnabled: false,
      darkMode: 'auto',
      theme: 'default',
      language: 'en',
      shapeEditorEnabled: false,
      updateSetting: (key, value) =>
        set((s) => {
          log.ui.info('setting changed', { key, from: s[key], to: value })
          return { ...s, [key]: value }
        }),
    }),
    { name: 'shapely-settings' }
  )
)
