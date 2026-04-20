import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import { generateBoard, dealCard } from '@/utils/boardGenerator'
import { stepDifficulty } from '@/utils/difficultyEngine'
import { useHaptics } from './useHaptics'
import { triggerConfetti } from '@/components/magic/Confetti'
import { markGameStart, markBoardReady } from '@/lib/perf'
import { log } from '@/lib/logger'

export function useGameLogic(allShapes: import('@/shapes/types').ShapeDefinition[]) {
  const store = useGameStore()
  const settings = useSettingsStore()
  const haptics = useHaptics()

  const startNewGame = useCallback(() => {
    markGameStart()
    const board = generateBoard(settings.gridSize, allShapes)
    const card = dealCard(board)
    store.startGame(board)
    store.nextCard(card)
    markBoardReady()
    log.game.info('new game started', { gridSize: settings.gridSize, shapeCount: allShapes.length })
  }, [settings.gridSize, allShapes, store])

  const submitAnswer = useCallback(
    (col: number, row: number) => {
      store.submitAnswer(col, row)
      const correct =
        store.currentCard?.correctCell.col === col &&
        store.currentCard?.correctCell.row === row

      if (correct) {
        haptics.correct()
        triggerConfetti()
        log.game.info('correct answer', { col, row, score: store.score + 1, streak: store.streak + 1 })
        setTimeout(() => {
          const freshStore = useGameStore.getState()
          const freshSettings = useSettingsStore.getState()
          if (!freshStore.board) return
          if (freshSettings.adaptiveDifficulty) {
            stepDifficulty(freshStore.streak, freshSettings)
          }
          freshStore.nextCard(dealCard(freshStore.board))
        }, 800)
      } else {
        haptics.wrong()
        log.game.warn('wrong answer', { col, row, correctCol: store.currentCard?.correctCell.col, correctRow: store.currentCard?.correctCell.row })
        setTimeout(() => {
          const freshStore = useGameStore.getState()
          if (freshStore.currentCard) freshStore.nextCard(freshStore.currentCard)
        }, 600)
      }
    },
    [store, haptics]
  )

  useEffect(() => {
    if (store.phase !== 'playing' || !settings.timerEnabled) return
    const interval = setInterval(store.tickTimer, 1000)
    return () => clearInterval(interval)
  }, [store.phase, settings.timerEnabled, store.tickTimer])

  return { startNewGame, submitAnswer }
}
