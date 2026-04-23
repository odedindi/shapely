import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useGameSettingsStore } from '@/store/gameSettingsStore'
import { usePlatformStore } from '@/store/platformStore'
import { generateBoard, dealCard } from '@/utils/boardGenerator'
import { markGameStart, markBoardReady } from '@/lib/perf'
import { log } from '@/lib/logger'
import { recordAnswer } from '@/db/shapeMastery'
import type { AnswerEvent } from '@/db/shapeMastery'

export function useGameLogic(allShapes: import('@/shapes/types').ShapeDefinition[]) {
  const store = useGameStore()
  const settings = useGameSettingsStore()
  const platform = usePlatformStore()

  const startNewGame = useCallback(() => {
    markGameStart()
    const filtered = settings.activeShapeIds === 'all'
      ? allShapes
      : allShapes.filter(s => (settings.activeShapeIds as string[]).includes(s.id))
    if (filtered.length === 0) {
      log.game.warn('no active shapes selected, using all shapes')
    }
    const pool = filtered.length > 0 ? filtered : allShapes
    const favoriteIds = new Set(platform.favoriteShapeIds)
    const board = generateBoard(settings.gridSize, pool, { favoriteIds })
    const card = dealCard(board)
    const gameState = useGameStore.getState()
    gameState.startGame(board, settings.gameMode)
    gameState.nextCard(card)
    markBoardReady()
    log.game.info('new game started', { gridSize: settings.gridSize, shapeCount: pool.length, gameMode: settings.gameMode })
  }, [settings.gridSize, settings.gameMode, settings.activeShapeIds, platform.favoriteShapeIds, allShapes])

  const submitAnswer = useCallback(
    (col: number, row: number) => {
      const state = useGameStore.getState()
      if (state.phase !== 'playing' || !state.currentCard || !state.board) return

      const capturedCard = state.currentCard
      const capturedBoard = state.board
      const capturedSolvedCount = state.solvedCells.size
      const capturedAppearedAt = state.cardAppearedAt
      const correct = capturedCard.correctCell.col === col && capturedCard.correctCell.row === row
      const responseTimeMs = performance.now() - capturedAppearedAt

      state.submitAnswer(col, row, responseTimeMs <= 10000 ? responseTimeMs : undefined)

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
        log.game.info('correct answer', { col, row, score: state.score + 1, streak: state.streak + 1 })
      } else {
        log.game.warn('wrong answer', { col, row, correctCol: capturedCard.correctCell.col, correctRow: capturedCard.correctCell.row })
      }
    },
    []
  )

  useEffect(() => {
    if (store.phase !== 'playing' || !settings.timerEnabled) return
    const interval = setInterval(store.tickTimer, 1000)
    return () => clearInterval(interval)
  }, [store.phase, settings.timerEnabled, store.tickTimer])

  return { startNewGame, submitAnswer }
}
