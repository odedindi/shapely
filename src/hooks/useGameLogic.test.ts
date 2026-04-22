import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import { makeShape } from '@/shapes/makeShape'
import type { BoardState, CardState } from '@/shapes/types'

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({ correct: vi.fn(), wrong: vi.fn() }),
}))
vi.mock('@/components/magic/Confetti', () => ({ triggerConfetti: vi.fn() }))
vi.mock('@/lib/perf', () => ({ markGameStart: vi.fn(), markBoardReady: vi.fn() }))
vi.mock('@/db/shapeMastery', () => ({ recordAnswer: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/logger', () => ({
  log: {
    game: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    board: { info: vi.fn(), warn: vi.fn() },
    ui: { info: vi.fn() },
    perf: { info: vi.fn() },
  },
}))

function makeTestShape(id: string) {
  return makeShape({ id, name: id, source: 'builtin', viewBox: '0 0 24 24' }, () => '')
}

function makeTestBoard(gridSize: number): BoardState {
  const columnShapes = Array.from({ length: gridSize }, (_, i) => makeTestShape(`col-${i}`))
  const rowShapes = Array.from({ length: gridSize }, (_, i) => makeTestShape(`row-${i}`))
  return { gridSize, columnShapes, rowShapes }
}

function makeTestCard(board: BoardState, col: number, row: number): CardState {
  return {
    columnShape: board.columnShapes[col],
    rowShape: board.rowShapes[row],
    correctCell: { col, row },
  }
}

function setupGame(gridSize = 3) {
  const board = makeTestBoard(gridSize)
  const store = useGameStore.getState()
  store.startGame(board, 'unique')
  const card = makeTestCard(board, 1, 1)
  store.nextCard(card)
  return { board, card, store }
}

beforeEach(() => {
  useGameStore.getState().resetGame()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('submitAnswer timing loop', () => {
  it('phase stays correct for 800ms then transitions back to playing', () => {
    const { board, card } = setupGame()
    const gameStore = useGameStore.getState()

    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('correct')

    vi.advanceTimersByTime(799)
    expect(useGameStore.getState().phase).toBe('correct')

    gameStore.nextCard(makeTestCard(board, 0, 0))
    expect(useGameStore.getState().phase).toBe('playing')
  })

  it('phase stays wrong for 600ms then transitions back to playing', () => {
    const { card } = setupGame()
    const gameStore = useGameStore.getState()
    const wrongCol = card.correctCell.col === 0 ? 1 : 0

    gameStore.submitAnswer(wrongCol, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('wrong')

    vi.advanceTimersByTime(599)
    expect(useGameStore.getState().phase).toBe('wrong')

    gameStore.nextCard(card)
    expect(useGameStore.getState().phase).toBe('playing')
  })

  it('does not advance phase if submitAnswer called twice in same tick (double-submit)', () => {
    const { card } = setupGame()
    const gameStore = useGameStore.getState()

    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    const phaseAfterFirst = useGameStore.getState().phase
    const scoreAfterFirst = useGameStore.getState().score

    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe(phaseAfterFirst)
    expect(useGameStore.getState().score).toBe(scoreAfterFirst)
  })

  it('wrong-phase setTimeout does not call nextCard if phase already moved on', () => {
    const { board, card } = setupGame()
    const gameStore = useGameStore.getState()
    const wrongCol = card.correctCell.col === 0 ? 1 : 0

    gameStore.submitAnswer(wrongCol, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('wrong')

    gameStore.nextCard(makeTestCard(board, 2, 2))
    expect(useGameStore.getState().phase).toBe('playing')

    const cardBefore = useGameStore.getState().currentCard

    vi.advanceTimersByTime(700)
    expect(useGameStore.getState().currentCard).toBe(cardBefore)
  })

  it('correct-phase setTimeout does not call nextCard if phase already moved on', () => {
    const { board, card } = setupGame()
    const gameStore = useGameStore.getState()

    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('correct')

    const newCard = makeTestCard(board, 2, 2)
    gameStore.nextCard(newCard)
    expect(useGameStore.getState().phase).toBe('playing')

    const cardBefore = useGameStore.getState().currentCard

    vi.advanceTimersByTime(900)
    expect(useGameStore.getState().currentCard).toBe(cardBefore)
  })
})

describe('submitAnswer phase guard', () => {
  it('does nothing when phase is correct', () => {
    const { card } = setupGame()
    const gameStore = useGameStore.getState()

    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('correct')
    const score = useGameStore.getState().score

    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().score).toBe(score)
    expect(useGameStore.getState().phase).toBe('correct')
  })

  it('does nothing when phase is wrong', () => {
    const { card } = setupGame()
    const gameStore = useGameStore.getState()
    const wrongCol = card.correctCell.col === 0 ? 1 : 0

    gameStore.submitAnswer(wrongCol, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('wrong')
    const totalAnswers = useGameStore.getState().totalAnswers

    gameStore.submitAnswer(wrongCol, card.correctCell.row)
    expect(useGameStore.getState().totalAnswers).toBe(totalAnswers)
  })

  it('does nothing when phase is idle (no startGame called)', () => {
    expect(useGameStore.getState().phase).toBe('idle')
    useGameStore.getState().submitAnswer(0, 0)
    expect(useGameStore.getState().phase).toBe('idle')
    expect(useGameStore.getState().score).toBe(0)
  })
})

describe('interactionMode guard in handleCellSelect logic', () => {
  it('interactionMode drag: submitAnswer still works via store directly (drag path bypasses cardSelected)', () => {
    const { card } = setupGame()
    useSettingsStore.getState().updateSetting('interactionMode', 'drag')

    const gameStore = useGameStore.getState()
    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('correct')
  })

  it('interactionMode tap: store submitAnswer still works (tap path goes through store)', () => {
    const { card } = setupGame()
    useSettingsStore.getState().updateSetting('interactionMode', 'tap')

    const gameStore = useGameStore.getState()
    gameStore.submitAnswer(card.correctCell.col, card.correctCell.row)
    expect(useGameStore.getState().phase).toBe('correct')
  })
})
