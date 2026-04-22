import type { GameSettingsState } from '@/store/gameSettingsStore'
import { log } from '@/lib/logger'

type Settings = Pick<GameSettingsState, 'gridSize' | 'cellRevealMode' | 'combinationStyle' | 'updateSetting'>

export function stepDifficulty(streak: number, settings: Settings) {
  if (streak > 0 && streak % 3 === 0) {
    increaseChallenge(settings)
  } else if (streak === 0) {
    decreaseChallenge(settings)
  }
}

function increaseChallenge(settings: Settings) {
  if (settings.cellRevealMode === 'visible') {
    log.game.info('difficulty increased', { from: 'visible', to: 'peek' })
    settings.updateSetting('cellRevealMode', 'peek')
  } else if (settings.cellRevealMode === 'peek') {
    log.game.info('difficulty increased', { from: 'peek', to: 'hidden' })
    settings.updateSetting('cellRevealMode', 'hidden')
  }
}

function decreaseChallenge(settings: Settings) {
  if (settings.cellRevealMode === 'hidden') {
    log.game.info('difficulty decreased', { from: 'hidden', to: 'peek' })
    settings.updateSetting('cellRevealMode', 'peek')
  } else if (settings.cellRevealMode === 'peek') {
    log.game.info('difficulty decreased', { from: 'peek', to: 'visible' })
    settings.updateSetting('cellRevealMode', 'visible')
  }
}
