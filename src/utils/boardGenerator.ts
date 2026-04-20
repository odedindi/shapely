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

export function generateBoard(gridSize: number, shapes: ShapeDefinition[]): BoardState {
  if (shapes.length < gridSize * 2) {
    const msg = `Need at least ${gridSize * 2} shapes for a ${gridSize}×${gridSize} board`
    log.board.error('generateBoard failed', { gridSize, shapeCount: shapes.length, required: gridSize * 2 })
    throw new Error(msg)
  }
  const shuffled = shuffle(shapes)
  const board: BoardState = {
    gridSize,
    columnShapes: shuffled.slice(0, gridSize),
    rowShapes: shuffled.slice(gridSize, gridSize * 2),
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
