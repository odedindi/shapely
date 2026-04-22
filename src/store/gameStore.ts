import { create } from 'zustand'
import type { BoardState, CardState, Difficulty, GamePhase, GameMode } from '@/shapes/types'
import { log } from '@/lib/logger'
import { dealUniqueCard, dealWeightedCard } from '@/utils/boardGenerator'
import { stepDifficulty } from '@/utils/difficultyEngine'
import { useSettingsStore } from '@/store/settingsStore'
import { triggerConfetti } from '@/components/magic/Confetti'

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export interface GameState {
  board: BoardState | null
  currentCard: CardState | null
  score: number
  streak: number
  bestStreak: number
  timeElapsed: number
  difficulty: Difficulty
  phase: GamePhase
  totalAnswers: number
  correctAnswers: number
  levelUpPulse: number
  solvedCells: Set<string>
  gameMode: GameMode
  cardAppearedAt: number
  startGame: (board: BoardState, gameMode?: GameMode) => void
  submitAnswer: (col: number, row: number) => void
  nextCard: (card: CardState) => void
  tickTimer: () => void
  resetGame: () => void
  triggerLevelUp: () => void
  markCellSolved: (col: number, row: number) => void
  isBoardComplete: () => boolean
}

export const useGameStore = create<GameState>()((set, get) => ({
  board: null,
  currentCard: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  timeElapsed: 0,
  difficulty: 'easy',
  phase: 'idle',
  totalAnswers: 0,
  correctAnswers: 0,
  levelUpPulse: 0,
  solvedCells: new Set<string>(),
  gameMode: 'unique',
  cardAppearedAt: 0,

  startGame: (board, gameMode = 'unique') =>
    set({
      board,
      phase: 'playing',
      score: 0,
      streak: 0,
      bestStreak: 0,
      timeElapsed: 0,
      totalAnswers: 0,
      correctAnswers: 0,
      solvedCells: new Set<string>(),
      gameMode,
    }),

  submitAnswer: (col, row) => {
    const { currentCard, phase, score, streak, bestStreak, totalAnswers, correctAnswers, board } = get()
    if (!currentCard || phase !== 'playing') return
    const correct =
      currentCard.correctCell.col === col && currentCard.correctCell.row === row
    const newPhase: GamePhase = correct ? 'correct' : 'wrong'
    const newStreak = correct ? streak + 1 : 0
    const newBestStreak = Math.max(bestStreak, newStreak)
    log.game.info('answer submitted', { col, row, correct, streak, score })

    if (correct) {
      const key = `${col}-${row}`
      const newSolvedCells = new Set(get().solvedCells)
      newSolvedCells.add(key)
      const gridSize = board?.gridSize ?? 0
      const boardComplete = newSolvedCells.size >= gridSize * gridSize
      set({
        phase: boardComplete ? 'complete' : newPhase,
        score: score + 10 + streak,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAnswers: totalAnswers + 1,
        correctAnswers: correctAnswers + 1,
        solvedCells: newSolvedCells,
      })
      if (boardComplete) {
        log.game.info('board complete', { solvedCells: newSolvedCells.size, gridSize })
        vibrate(50)
        triggerConfetti()
        return
      }
      vibrate(50)
      triggerConfetti()
      setTimeout(() => {
        const s = get()
        const settings = useSettingsStore.getState()
        log.game.info('correct timeout fired', { phase: s.phase, board: !!s.board, card: !!s.currentCard })
        if (!s.board || s.phase !== 'correct') {
          if (s.phase !== 'correct') log.game.warn('correct timeout: phase not correct, bailing', { phase: s.phase })
          return
        }
        if (settings.adaptiveDifficulty) {
          const prevRevealMode = settings.cellRevealMode
          stepDifficulty(s.streak, settings)
          const nextRevealMode = useSettingsStore.getState().cellRevealMode
          if (nextRevealMode !== prevRevealMode) {
            log.game.info('level up triggered', { from: prevRevealMode, to: nextRevealMode })
            get().triggerLevelUp()
          }
        }
        if (s.gameMode === 'unique') {
          const nextCard = dealUniqueCard(s.board, s.solvedCells)
          log.game.info('dealing unique card', { nextCard: !!nextCard, solvedCells: s.solvedCells.size })
          if (nextCard !== null) {
            get().nextCard(nextCard)
          } else {
            log.game.warn('dealUniqueCard returned null but phase not complete', { phase: s.phase })
          }
        } else {
          get().nextCard(dealWeightedCard(s.board, s.solvedCells))
        }
      }, 800)
    } else {
      set({
        phase: newPhase,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAnswers: totalAnswers + 1,
      })
      vibrate([30, 50, 30])
      setTimeout(() => {
        const s = get()
        log.game.info('wrong timeout fired', { phase: s.phase, card: !!s.currentCard })
        if (s.phase !== 'wrong') {
          log.game.warn('wrong timeout: phase not wrong, bailing', { phase: s.phase })
          return
        }
        if (s.currentCard) get().nextCard(s.currentCard)
      }, 600)
    }
  },

  nextCard: (card) => set({ currentCard: card, phase: 'playing', cardAppearedAt: performance.now() }),

  tickTimer: () => set((s) => ({ timeElapsed: s.timeElapsed + 1 })),

  resetGame: () => {
    log.game.info('game reset')
    set({
      board: null,
      currentCard: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      timeElapsed: 0,
      phase: 'idle',
      totalAnswers: 0,
      correctAnswers: 0,
      solvedCells: new Set<string>(),
      cardAppearedAt: 0,
    })
  },

  triggerLevelUp: () => set((s) => ({ levelUpPulse: s.levelUpPulse + 1 })),

  markCellSolved: (col, row) => {
    const key = `${col}-${row}`
    set((s) => ({ solvedCells: new Set(s.solvedCells).add(key) }))
  },

  isBoardComplete: () => {
    const { solvedCells, board } = get()
    if (!board) return false
    return solvedCells.size >= board.gridSize * board.gridSize
  },
}))
