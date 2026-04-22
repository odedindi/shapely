import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CombinationStyle, CellRevealMode, GameMode, InteractionMode } from '@/shapes/types'
import { log } from '@/lib/logger'

export interface GameSettingsState {
  gridSize: 2 | 3 | 4 | 5 | 6 | 7
  cellRevealMode: CellRevealMode
  combinationStyle: CombinationStyle
  adaptiveDifficulty: boolean
  timerEnabled: boolean
  gameMode: GameMode
  interactionMode: InteractionMode
  activeShapeIds: string[] | 'all'
  bestScores: Record<string, number>
  updateSetting: <K extends keyof Omit<GameSettingsState, 'updateSetting' | 'updateBestScore'>>(
    key: K,
    value: GameSettingsState[K]
  ) => void
  updateBestScore: (key: string, score: number) => void
}

export const useGameSettingsStore = create<GameSettingsState>()(
  persist(
    (set) => ({
      gridSize: 3,
      cellRevealMode: 'visible',
      combinationStyle: 'overlay',
      adaptiveDifficulty: true,
      timerEnabled: false,
      gameMode: 'unique',
      interactionMode: 'both' as InteractionMode,
      activeShapeIds: 'all' as const,
      bestScores: {},
      updateSetting: (key, value) =>
        set((s) => {
          log.ui.info('game setting changed', { key, from: s[key], to: value })
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
    {
      name: 'shapely-game-settings',
      merge: (persisted, current) => {
        const p = persisted as Partial<GameSettingsState>
        const clampedGridSize = Math.min(p.gridSize ?? current.gridSize, 7) as GameSettingsState['gridSize']
        return {
          ...current,
          ...p,
          gridSize: clampedGridSize,
          activeShapeIds: p.activeShapeIds ?? 'all',
        }
      },
    }
  )
)
