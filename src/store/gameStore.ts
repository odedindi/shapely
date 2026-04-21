import { create } from 'zustand'
import type { BoardState, CardState, Difficulty, GamePhase, GameMode } from '@/shapes/types'
import { log } from '@/lib/logger'

interface GameState {
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
    const { currentCard, score, streak, bestStreak, totalAnswers, correctAnswers, board } = get()
    if (!currentCard) return
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
      }
    } else {
      set({
        phase: newPhase,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAnswers: totalAnswers + 1,
      })
    }
  },

  nextCard: (card) => set({ currentCard: card, phase: 'playing' }),

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
