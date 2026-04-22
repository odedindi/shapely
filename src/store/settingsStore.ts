import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CombinationStyle, CellRevealMode, DarkMode, Theme, GameMode, InteractionMode } from '@/shapes/types'
import { log } from '@/lib/logger'

export interface SettingsState {
  gridSize: 2 | 3 | 4 | 5 | 6 | 7
  cellRevealMode: CellRevealMode
  combinationStyle: CombinationStyle
  adaptiveDifficulty: boolean
  timerEnabled: boolean
  darkMode: DarkMode
  theme: Theme
  language: string
  shapeEditorEnabled: boolean
  gameMode: GameMode
  interactionMode: InteractionMode
  cardPanelPosition: { xFrac: number; yFrac: number }
  cardPanelCollapsed: boolean
  activeShapeIds: string[] | 'all'
  favoriteShapeIds: string[]
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
      interactionMode: 'both' as InteractionMode,
      cardPanelPosition: { xFrac: 1, yFrac: 1 },
      cardPanelCollapsed: false,
      activeShapeIds: 'all' as const,
      favoriteShapeIds: [],
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
    { name: 'shapely-settings', merge: (persisted, current) => {
      const p = persisted as Partial<SettingsState>
      const clampedGridSize = Math.min(p.gridSize ?? current.gridSize, 7) as SettingsState['gridSize']
      return {
        ...current,
        ...p,
        gridSize: clampedGridSize,
        activeShapeIds: p.activeShapeIds ?? 'all',
        favoriteShapeIds: p.favoriteShapeIds ?? [],
      }
    } }
  )
)
