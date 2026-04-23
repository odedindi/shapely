import { create } from 'zustand'
import type { BoardState, CardState, Difficulty, GamePhase, GameMode } from '@/shapes/types'
import { log } from '@/lib/logger'
import { dealUniqueCard, dealWeightedCard } from '@/utils/boardGenerator'
import { stepDifficulty } from '@/utils/difficultyEngine'
import { useGameSettingsStore } from '@/store/gameSettingsStore'
import { triggerConfetti } from '@/components/magic/Confetti'
import { saveReplay, type ReplayEvent } from '@/db/replays'
import { usePlatformStore } from '@/store/platformStore'

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export interface BoardBonusBreakdown {
  speedClear: number
  perfectBoard: number
  flawlessStreak: number
  difficultyMultiplier: number
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
  currentReplayEvents: ReplayEvent[]
  responseTimes: number[]
  boardBonus: number
  boardBonusBreakdown: BoardBonusBreakdown
  startGame: (board: BoardState, gameMode?: GameMode) => void
  submitAnswer: (col: number, row: number, responseTimeMs?: number) => void
  nextCard: (card: CardState) => void
  tickTimer: () => void
  resetGame: () => void
  triggerLevelUp: () => void
  markCellSolved: (col: number, row: number) => void
  isBoardComplete: () => boolean
}

const initialBoardBonusBreakdown: BoardBonusBreakdown = {
  speedClear: 0,
  perfectBoard: 0,
  flawlessStreak: 0,
  difficultyMultiplier: 1.0,
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
  currentReplayEvents: [],
  responseTimes: [],
  boardBonus: 0,
  boardBonusBreakdown: { ...initialBoardBonusBreakdown },

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
      currentReplayEvents: [{ type: 'startGame', board, gameMode, ts: Date.now() }],
      responseTimes: [],
      boardBonus: 0,
      boardBonusBreakdown: { ...initialBoardBonusBreakdown },
    }),

  submitAnswer: (col, row, responseTimeMs) => {
    const { currentCard, phase, score, streak, bestStreak, totalAnswers, correctAnswers, board, currentReplayEvents, timeElapsed, responseTimes } = get()
    if (!currentCard || phase !== 'playing') return
    const correct =
      currentCard.correctCell.col === col && currentCard.correctCell.row === row
    const newPhase: GamePhase = correct ? 'correct' : 'wrong'
    const newStreak = correct ? streak + 1 : 0
    const newBestStreak = Math.max(bestStreak, newStreak)
    log.game.info('answer submitted', { col, row, correct, streak, score })
    const replayEvent: ReplayEvent = { type: 'submitAnswer', col, row, ts: Date.now() }

    if (correct) {
      const basePoints = 100
      const streakMultiplier = 1 + streak * 0.1
      const speedBonus = responseTimeMs !== undefined
        ? Math.max(0, Math.floor((5000 - responseTimeMs) / 100))
        : 0
      const answerPoints = Math.round(basePoints * streakMultiplier) + speedBonus
      const newResponseTimes = [...responseTimes, responseTimeMs ?? 0]

      const key = `${col}-${row}`
      const newSolvedCells = new Set(get().solvedCells)
      newSolvedCells.add(key)
      const gridSize = board?.gridSize ?? 0
      const boardComplete = newSolvedCells.size >= gridSize * gridSize
      const updatedEvents = [...currentReplayEvents, replayEvent]

      if (boardComplete) {
        const settings = useGameSettingsStore.getState()
        const speedClearThreshold = gridSize * gridSize * 5
        const speedClear = timeElapsed <= speedClearThreshold ? 500 : 0
        const perfectBoard = totalAnswers === correctAnswers ? 300 : 0
        const flawlessStreak = newStreak === gridSize * gridSize ? 200 : 0
        const difficultyMultiplier = settings.cellRevealMode === 'hidden' ? 1.5 : 1.0
        const rawBoardBonus = speedClear + perfectBoard + flawlessStreak
        const totalBoardBonus = Math.round(rawBoardBonus * difficultyMultiplier)

        set({
          phase: 'complete',
          score: score + answerPoints + totalBoardBonus,
          streak: newStreak,
          bestStreak: newBestStreak,
          totalAnswers: totalAnswers + 1,
          correctAnswers: correctAnswers + 1,
          solvedCells: newSolvedCells,
          currentReplayEvents: updatedEvents,
          responseTimes: newResponseTimes,
          boardBonus: totalBoardBonus,
          boardBonusBreakdown: { speedClear, perfectBoard, flawlessStreak, difficultyMultiplier },
        })
        log.game.info('board complete', { solvedCells: newSolvedCells.size, gridSize })
        vibrate(50)
        triggerConfetti()
        const finalState = get()
        const profileId = usePlatformStore.getState().activeProfileId ?? ''
        saveReplay({
          id: crypto.randomUUID(),
          profileId,
          events: updatedEvents,
          gridSize,
          score: finalState.score,
          correctAnswers: finalState.correctAnswers,
          totalAnswers: finalState.totalAnswers,
          timeElapsed: finalState.timeElapsed,
          recordedAt: Date.now(),
        }).catch((err: unknown) => log.game.error('failed to save replay', err))
        return
      }

      set({
        phase: newPhase,
        score: score + answerPoints,
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAnswers: totalAnswers + 1,
        correctAnswers: correctAnswers + 1,
        solvedCells: newSolvedCells,
        currentReplayEvents: updatedEvents,
        responseTimes: newResponseTimes,
      })
      vibrate(50)
      triggerConfetti()
      setTimeout(() => {
        const s = get()
        const settings = useGameSettingsStore.getState()
        log.game.info('correct timeout fired', { phase: s.phase, board: !!s.board, card: !!s.currentCard })
        if (!s.board || s.phase !== 'correct') {
          if (s.phase !== 'correct') log.game.warn('correct timeout: phase not correct, bailing', { phase: s.phase })
          return
        }
        if (settings.adaptiveDifficulty) {
          const prevRevealMode = settings.cellRevealMode
          stepDifficulty(s.streak, settings)
          const nextRevealMode = useGameSettingsStore.getState().cellRevealMode
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
        currentReplayEvents: [...currentReplayEvents, replayEvent],
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

  nextCard: (card) => set((s) => ({
    currentCard: card,
    phase: 'playing',
    cardAppearedAt: performance.now(),
    currentReplayEvents: [...s.currentReplayEvents, { type: 'nextCard', card, ts: Date.now() }],
  })),

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
      currentReplayEvents: [],
      responseTimes: [],
      boardBonus: 0,
      boardBonusBreakdown: { ...initialBoardBonusBreakdown },
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
