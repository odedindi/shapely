import { createElement } from 'react'
import type { ShapeDefinition, ShapeRenderParams, BoardState, CardState } from '@/shapes/types'
import { log } from '@/lib/logger'

const VARIANT_COLORS = [
  'var(--shape-color-1)',
  'var(--shape-color-2)',
  'var(--shape-color-3)',
  'var(--shape-color-4)',
  'var(--shape-color-5)',
  'var(--shape-color-6)',
  'var(--shape-color-7)',
  'var(--shape-color-8)',
]

const VARIANT_SIZES: { suffix: string; label: string; scale: number }[] = [
  { suffix: 'small', label: 'Small', scale: 0.65 },
  { suffix: 'large', label: 'Large', scale: 1.35 },
]

function makeColorVariant(base: ShapeDefinition, colorIndex: number): ShapeDefinition {
  const color = VARIANT_COLORS[colorIndex % VARIANT_COLORS.length]
  const id = `${base.id}--c${colorIndex}`
  return {
    id,
    name: `${base.name} ${colorIndex + 1}`,
    source: base.source,
    viewBox: base.viewBox,
    svgBody: (params: ShapeRenderParams) => base.svgBody({ ...params, fillColor: color }),
    render: (params: ShapeRenderParams) => base.render({ ...params, fillColor: color }),
  }
}

function makeSizeVariant(base: ShapeDefinition, scale: number, suffix: string, label: string): ShapeDefinition {
  const id = `${base.id}--${suffix}`
  const [, , vbW, vbH] = base.viewBox.split(' ').map(Number)
  const cx = vbW / 2
  const cy = vbH / 2
  const tx = cx * (1 - scale)
  const ty = cy * (1 - scale)
  return {
    id,
    name: `${base.name} (${label})`,
    source: base.source,
    viewBox: base.viewBox,
    svgBody: (params: ShapeRenderParams) => {
      const inner = base.svgBody(params)
      return `<g transform="translate(${tx} ${ty}) scale(${scale})">${inner}</g>`
    },
    render: (params: ShapeRenderParams) =>
      createElement(
        'g',
        { transform: `translate(${tx} ${ty}) scale(${scale})` },
        base.render(params),
      ),
  }
}

export function expandWithVariants(shapes: ShapeDefinition[], needed: number): ShapeDefinition[] {
  if (shapes.length >= needed) return shapes

  const result = [...shapes]
  const usedIds = new Set(shapes.map((s) => s.id))

  let colorIdx = 0
  for (const base of shapes) {
    if (result.length >= needed) break
    if (base.id.includes('--')) continue
    while (colorIdx < VARIANT_COLORS.length) {
      const variant = makeColorVariant(base, colorIdx)
      colorIdx++
      if (!usedIds.has(variant.id)) {
        usedIds.add(variant.id)
        result.push(variant)
        break
      }
    }
    if (colorIdx >= VARIANT_COLORS.length) colorIdx = 0
  }

  for (const { suffix, label, scale } of VARIANT_SIZES) {
    for (const base of shapes) {
      if (result.length >= needed) break
      if (base.id.includes('--')) continue
      const variant = makeSizeVariant(base, scale, suffix, label)
      if (!usedIds.has(variant.id)) {
        usedIds.add(variant.id)
        result.push(variant)
      }
    }
  }

  return result
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateBoard(gridSize: number, shapes: ShapeDefinition[], options?: { favoriteIds?: Set<string> }): BoardState {
  const expanded = expandWithVariants(shapes, gridSize * 2)
  if (expanded.length < gridSize * 2) {
    const msg = `Need at least ${gridSize * 2} shapes for a ${gridSize}×${gridSize} board`
    log.board.error('generateBoard failed', { gridSize, shapeCount: expanded.length, required: gridSize * 2 })
    throw new Error(msg)
  }
  const pool = [...expanded]
  if (options?.favoriteIds && options.favoriteIds.size > 0) {
    for (const shape of expanded) {
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
