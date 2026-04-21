import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CombinationStyle, CellRevealMode, DarkMode, Theme, GameMode } from '@/shapes/types'
import { log } from '@/lib/logger'

export interface SettingsState {
  gridSize: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  cellRevealMode: CellRevealMode
  combinationStyle: CombinationStyle
  adaptiveDifficulty: boolean
  timerEnabled: boolean
  darkMode: DarkMode
  theme: Theme
  language: string
  shapeEditorEnabled: boolean
  gameMode: GameMode
  bestScores: Record<string, number>
  updateSetting: <K extends keyof Omit<SettingsState, 'updateSetting' | 'updateBestScore'>>(
    key: K,
    value: SettingsState[K]
  ) => void
  updateBestScore: (key: string, score: number) => void
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
      gameMode: 'unique',
      bestScores: {},
      updateSetting: (key, value) =>
        set((s) => {
          log.ui.info('setting changed', { key, from: s[key], to: value })
          return { ...s, [key]: value }
        }),
      updateBestScore: (key, score) =>
        set((s) => {
          const prev = s.bestScores[key] ?? 0
          if (score > prev) {
            log.ui.info('new best score', { key, score, previous: prev })
            return { ...s, bestScores: { ...s.bestScores, [key]: score } }
          }
          return s
        }),
    }),
    { name: 'shapely-settings' }
  )
)
