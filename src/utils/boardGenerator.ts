import type { ShapeDefinition, BoardState, CardState } from '@/shapes/types'
import { log } from '@/lib/logger'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBoard(gridSize: number, shapes: ShapeDefinition[], options?: { favoriteIds?: Set<string> }): BoardState {
  if (shapes.length < gridSize * 2) {
    const msg = `Need at least ${gridSize * 2} shapes for a ${gridSize}×${gridSize} board`
    log.board.error('generateBoard failed', { gridSize, shapeCount: shapes.length, required: gridSize * 2 })
    throw new Error(msg)
  }
  const pool = [...shapes]
  if (options?.favoriteIds && options.favoriteIds.size > 0) {
    for (const shape of shapes) {
      if (options.favoriteIds.has(shape.id)) {
        pool.push(shape, shape)
      }
    }
  }
  const shuffled = shuffle(pool)
  const seen = new Set<string>()
  const deduped: ShapeDefinition[] = []
  for (const shape of shuffled) {
    if (!seen.has(shape.id)) {
      seen.add(shape.id)
      deduped.push(shape)
    }
  }
  const board: BoardState = {
    gridSize,
    columnShapes: deduped.slice(0, gridSize),
    rowShapes: deduped.slice(gridSize, gridSize * 2),
  }
  log.board.info('board generated', { gridSize, shapeCount: shapes.length })
  return board
}

export function dealCard(board: BoardState): CardState {
  const col = Math.floor(Math.random() * board.gridSize)
  const row = Math.floor(Math.random() * board.gridSize)
  return {
    columnShape: board.columnShapes[col],
    rowShape: board.rowShapes[row],
    correctCell: { col, row },
  }
}

export function dealUniqueCard(board: BoardState, solvedCells: Set<string>): CardState | null {
  const unsolved: Array<{ col: number; row: number }> = []
  for (let col = 0; col < board.gridSize; col++) {
    for (let row = 0; row < board.gridSize; row++) {
      if (!solvedCells.has(`${col}-${row}`)) {
        unsolved.push({ col, row })
      }
    }
  }
  if (unsolved.length === 0) return null
  const pick = unsolved[Math.floor(Math.random() * unsolved.length)]
  return {
    columnShape: board.columnShapes[pick.col],
    rowShape: board.rowShapes[pick.row],
    correctCell: { col: pick.col, row: pick.row },
  }
}

export function dealWeightedCard(board: BoardState, solvedCells: Set<string>): CardState {
  const UNSOLVED_WEIGHT = 10
  const SOLVED_WEIGHT = 1

  const candidates: Array<{ col: number; row: number; weight: number }> = []
  for (let col = 0; col < board.gridSize; col++) {
    for (let row = 0; row < board.gridSize; row++) {
      const weight = solvedCells.has(`${col}-${row}`) ? SOLVED_WEIGHT : UNSOLVED_WEIGHT
      candidates.push({ col, row, weight })
    }
  }

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
  let rand = Math.random() * totalWeight
  for (const candidate of candidates) {
    rand -= candidate.weight
    if (rand <= 0) {
      return {
        columnShape: board.columnShapes[candidate.col],
        rowShape: board.rowShapes[candidate.row],
        correctCell: { col: candidate.col, row: candidate.row },
      }
    }
  }
  const last = candidates[candidates.length - 1]
  return {
    columnShape: board.columnShapes[last.col],
    rowShape: board.rowShapes[last.row],
    correctCell: { col: last.col, row: last.row },
  }
}
