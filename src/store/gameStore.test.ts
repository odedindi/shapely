import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'
import { makeShape } from '@/shapes/makeShape'
import type { BoardState, CardState } from '@/shapes/types'

function makeTestShape(id: string) {
  return makeShape({ id, name: id, source: 'builtin', viewBox: '0 0 24 24' }, () => '')
}

function makeTestBoard(gridSize: number): BoardState {
  const colShapes = Array.from({ length: gridSize }, (_, i) => makeTestShape(`col-${i}`))
  const rowShapes = Array.from({ length: gridSize }, (_, i) => makeTestShape(`row-${i}`))
  return { gridSize, columnShapes: colShapes, rowShapes }
}

function makeTestCard(board: BoardState, col: number, row: number): CardState {
  return {
    columnShape: board.columnShapes[col],
    rowShape: board.rowShapes[row],
    correctCell: { col, row },
  }
}

beforeEach(() => {
  useGameStore.getState().resetGame()
})

describe('gameStore.submitAnswer', () => {
  it('does nothing when phase is not playing', () => {
    const store = useGameStore.getState()
    const board = makeTestBoard(3)
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(0, 0)
    expect(useGameStore.getState().phase).toBe('correct')
    const solvedAfterFirst = useGameStore.getState().solvedCells.size

    useGameStore.getState().submitAnswer(0, 0)
    expect(useGameStore.getState().solvedCells.size).toBe(solvedAfterFirst)
  })

  it('sets phase to correct on right answer', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 1, 2))
    store.submitAnswer(1, 2)
    expect(useGameStore.getState().phase).toBe('correct')
  })

  it('sets phase to wrong on wrong answer', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(1, 1)
    expect(useGameStore.getState().phase).toBe('wrong')
  })

  it('increments score and streak on correct answer', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(0, 0)
    const s = useGameStore.getState()
    expect(s.score).toBe(10)
    expect(s.streak).toBe(1)
    expect(s.correctAnswers).toBe(1)
  })

  it('resets streak on wrong answer', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(0, 0)
    store.nextCard(makeTestCard(board, 1, 1))
    store.submitAnswer(2, 2)
    expect(useGameStore.getState().streak).toBe(0)
  })

  it('adds to solvedCells on correct answer', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 2, 1))
    store.submitAnswer(2, 1)
    expect(useGameStore.getState().solvedCells.has('2-1')).toBe(true)
  })

  it('sets phase to complete when all cells solved on a 2x2 board', () => {
    const board = makeTestBoard(2)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(0, 0)
    store.nextCard(makeTestCard(board, 0, 1))
    store.submitAnswer(0, 1)
    store.nextCard(makeTestCard(board, 1, 0))
    store.submitAnswer(1, 0)
    store.nextCard(makeTestCard(board, 1, 1))
    store.submitAnswer(1, 1)
    expect(useGameStore.getState().phase).toBe('complete')
  })

  it('does not double-count a solved cell when submitAnswer called twice for same cell', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(0, 0)
    const scoreAfterFirst = useGameStore.getState().score
    useGameStore.getState().submitAnswer(0, 0)
    expect(useGameStore.getState().score).toBe(scoreAfterFirst)
    expect(useGameStore.getState().solvedCells.size).toBe(1)
  })
})

describe('gameStore.nextCard', () => {
  it('sets phase back to playing', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(1, 1)
    expect(useGameStore.getState().phase).toBe('wrong')
    store.nextCard(makeTestCard(board, 0, 0))
    expect(useGameStore.getState().phase).toBe('playing')
  })

  it('updates currentCard', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    const card = makeTestCard(board, 2, 2)
    store.nextCard(card)
    expect(useGameStore.getState().currentCard?.correctCell).toEqual({ col: 2, row: 2 })
  })
})

describe('gameStore.startGame', () => {
  it('resets score/streak/solvedCells', () => {
    const board = makeTestBoard(3)
    const store = useGameStore.getState()
    store.startGame(board)
    store.nextCard(makeTestCard(board, 0, 0))
    store.submitAnswer(0, 0)
    store.startGame(board)
    const s = useGameStore.getState()
    expect(s.score).toBe(0)
    expect(s.streak).toBe(0)
    expect(s.solvedCells.size).toBe(0)
    expect(s.phase).toBe('playing')
  })
})
