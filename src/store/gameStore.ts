import { create } from 'zustand'
import type { BoardState, CardState, Difficulty, GamePhase } from '@/shapes/types'
import { log } from '@/lib/logger'

interface GameState {
  board: BoardState | null
  currentCard: CardState | null
  score: number
  streak: number
  timeElapsed: number
  difficulty: Difficulty
  phase: GamePhase
  startGame: (board: BoardState) => void
  submitAnswer: (col: number, row: number) => void
  nextCard: (card: CardState) => void
  tickTimer: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()((set, get) => ({
  board: null,
  currentCard: null,
  score: 0,
  streak: 0,
  timeElapsed: 0,
  difficulty: 'easy',
  phase: 'idle',

  startGame: (board) =>
    set({ board, phase: 'playing', score: 0, streak: 0, timeElapsed: 0 }),

  submitAnswer: (col, row) => {
    const { currentCard, score, streak } = get()
    if (!currentCard) return
    const correct =
      currentCard.correctCell.col === col && currentCard.correctCell.row === row
    const newPhase: GamePhase = correct ? 'correct' : 'wrong'
    log.game.info('answer submitted', { col, row, correct, streak, score })
    set({
      phase: newPhase,
      score: correct ? score + 10 + streak : score,
      streak: correct ? streak + 1 : 0,
    })
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
      timeElapsed: 0,
      phase: 'idle',
    })
  },
}))
