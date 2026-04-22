import { usePlatformStore, type PlatformState } from './platformStore'
import { useGameSettingsStore, type GameSettingsState } from './gameSettingsStore'

export type { PlatformState, GameSettingsState }

export type SettingsState = PlatformState & GameSettingsState & {
  updateSetting: GameSettingsState['updateSetting'] & PlatformState['updatePlatformSetting']
}

export function useSettingsStore(): SettingsState {
  const platform = usePlatformStore()
  const game = useGameSettingsStore()
  return {
    ...platform,
    ...game,
    updateSetting: (key: string, value: unknown) => {
      if (key in game && key !== 'updateSetting' && key !== 'updateBestScore') {
        ;(game.updateSetting as (k: string, v: unknown) => void)(key, value)
      } else {
        ;(platform.updatePlatformSetting as (k: string, v: unknown) => void)(key, value)
      }
    },
  } as unknown as SettingsState
}

useSettingsStore.getState = () => {
  const platform = usePlatformStore.getState()
  const game = useGameSettingsStore.getState()
  return {
    ...platform,
    ...game,
    updateSetting: (key: string, value: unknown) => {
      if (key in game && key !== 'updateSetting' && key !== 'updateBestScore') {
        ;(game.updateSetting as (k: string, v: unknown) => void)(key, value)
      } else {
        ;(platform.updatePlatformSetting as (k: string, v: unknown) => void)(key, value)
      }
    },
  } as unknown as SettingsState
}
