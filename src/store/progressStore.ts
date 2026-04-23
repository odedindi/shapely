import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressState {
  totalXP: number
  unlockedTitleLevels: number[]
  awardXP: (xp: number) => void
  unlockTitleLevel: (level: number) => void
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      totalXP: 0,
      unlockedTitleLevels: [],
      awardXP: (xp: number) =>
        set((s) => ({ totalXP: s.totalXP + xp })),
      unlockTitleLevel: (level: number) =>
        set((s) => ({
          unlockedTitleLevels: s.unlockedTitleLevels.includes(level)
            ? s.unlockedTitleLevels
            : [...s.unlockedTitleLevels, level],
        })),
    }),
    {
      name: 'shapely-progress',
    }
  )
)
