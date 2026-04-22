import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import { generateBoard, dealCard } from '@/utils/boardGenerator'
import { useHaptics } from './useHaptics'
import { triggerConfetti } from '@/components/magic/Confetti'
import { markGameStart, markBoardReady } from '@/lib/perf'
import { log } from '@/lib/logger'
import { recordAnswer } from '@/db/shapeMastery'
import type { AnswerEvent } from '@/db/shapeMastery'

export function useGameLogic(allShapes: import('@/shapes/types').ShapeDefinition[]) {
  const store = useGameStore()
  const settings = useSettingsStore()
  const haptics = useHaptics()

  const startNewGame = useCallback(() => {
    markGameStart()
    const filtered = settings.activeShapeIds === 'all'
      ? allShapes
      : allShapes.filter(s => (settings.activeShapeIds as string[]).includes(s.id))
    const pool = filtered.length >= settings.gridSize * 2 ? filtered : allShapes
    if (filtered.length < settings.gridSize * 2 && settings.activeShapeIds !== 'all') {
      log.game.warn('active shape pool too small, falling back to all shapes', { active: filtered.length, required: settings.gridSize * 2 })
    }
    const favoriteIds = new Set(settings.favoriteShapeIds)
    const board = generateBoard(settings.gridSize, pool, { favoriteIds })
    const card = dealCard(board)
    const gameState = useGameStore.getState()
    gameState.startGame(board, settings.gameMode)
    gameState.nextCard(card)
    markBoardReady()
    log.game.info('new game started', { gridSize: settings.gridSize, shapeCount: pool.length, gameMode: settings.gameMode })
  }, [settings.gridSize, settings.gameMode, settings.activeShapeIds, settings.favoriteShapeIds, allShapes])

  const submitAnswer = useCallback(
    (col: number, row: number) => {
      const state = useGameStore.getState()
      if (state.phase !== 'playing' || !state.currentCard || !state.board) return

      const capturedCard = state.currentCard
      const capturedBoard = state.board
      const capturedSolvedCount = state.solvedCells.size
      const capturedAppearedAt = state.cardAppearedAt
      const correct = capturedCard.correctCell.col === col && capturedCard.correctCell.row === row

      state.submitAnswer(col, row)

      const responseTimeMs = performance.now() - capturedAppearedAt
      if (responseTimeMs <= 10000) {
        const event: AnswerEvent = {
          id: crypto.randomUUID(),
          combinationId: `${capturedCard.columnShape.id}::${capturedCard.rowShape.id}`,
          colShapeId: capturedCard.columnShape.id,
          rowShapeId: capturedCard.rowShape.id,
          correct,
          responseTimeMs,
          recordedAt: Date.now(),
          boardContext: {
            gridSize: capturedBoard.gridSize,
            columnShapeIds: capturedBoard.columnShapes.map((s) => s.id),
            rowShapeIds: capturedBoard.rowShapes.map((s) => s.id),
            correctCol: capturedCard.correctCell.col,
            correctRow: capturedCard.correctCell.row,
            totalSolvedAtTime: capturedSolvedCount,
          },
        }
        recordAnswer(event, {}).catch((err: unknown) =>
          log.game.error('failed to record answer event', err),
        )
      }

      if (correct) {
        haptics.correct()
        triggerConfetti()
        log.game.info('correct answer', { col, row, score: state.score + 1, streak: state.streak + 1 })
      } else {
        haptics.wrong()
        log.game.warn('wrong answer', { col, row, correctCol: capturedCard.correctCell.col, correctRow: capturedCard.correctCell.row })
      }
    },
    [haptics]
  )

  useEffect(() => {
    if (store.phase !== 'playing' || !settings.timerEnabled) return
    const interval = setInterval(store.tickTimer, 1000)
    return () => clearInterval(interval)
  }, [store.phase, settings.timerEnabled, store.tickTimer])

  return { startNewGame, submitAnswer }
}
