import { useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import { generateBoard, dealCard, dealUniqueCard, dealWeightedCard } from '@/utils/boardGenerator'
import { stepDifficulty } from '@/utils/difficultyEngine'
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

      state.submitAnswer(col, row)
      const correct =
        capturedCard.correctCell.col === col &&
        capturedCard.correctCell.row === row

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
        setTimeout(() => {
          const freshStore = useGameStore.getState()
          const freshSettings = useSettingsStore.getState()
          if (!freshStore.board) return
          if (freshStore.phase === 'complete') return
          if (freshStore.phase !== 'correct') return
          if (freshSettings.adaptiveDifficulty) {
            const prevRevealMode = freshSettings.cellRevealMode
            stepDifficulty(freshStore.streak, freshSettings)
            const nextRevealMode = useSettingsStore.getState().cellRevealMode
            if (nextRevealMode !== prevRevealMode) {
              log.game.info('level up triggered', { from: prevRevealMode, to: nextRevealMode })
              freshStore.triggerLevelUp()
            }
          }
          if (freshStore.gameMode === 'unique') {
            const nextCard = dealUniqueCard(freshStore.board, freshStore.solvedCells)
            if (nextCard !== null) {
              freshStore.nextCard(nextCard)
            }
          } else {
            freshStore.nextCard(dealWeightedCard(freshStore.board, freshStore.solvedCells))
          }
        }, 800)
      } else {
        haptics.wrong()
        log.game.warn('wrong answer', { col, row, correctCol: capturedCard.correctCell.col, correctRow: capturedCard.correctCell.row })
        setTimeout(() => {
          const freshStore = useGameStore.getState()
          if (freshStore.phase !== 'wrong') return
          if (freshStore.currentCard) freshStore.nextCard(freshStore.currentCard)
        }, 600)
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
