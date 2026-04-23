import type { BoardState, CardState, CombinationStyle, CellRevealMode, GamePhase, ShapeRenderParams } from '@/shapes/types'
import { Fragment, useRef } from 'react'
import type { UIEvent } from 'react'
import { m, useMotionValue, useTransform } from 'framer-motion'
import BoardCell from './BoardCell'

interface GameBoardProps {
  board: BoardState
  currentCard: CardState | null
  combinationStyle: CombinationStyle
  cellRevealMode: CellRevealMode
  selectedCell: { col: number; row: number } | null
  onCellSelect: (col: number, row: number) => void
  phase: GamePhase
  hintQuadrant?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | null
  solvedCells?: Set<string>
  isDragging?: boolean
  containerWidth: number
  containerHeight: number
}

const headerParams = (colorIndex: number): ShapeRenderParams => ({
  fillColor: `var(--shape-color-${((colorIndex - 1) % 8) + 1})`,
  strokeColor: 'var(--color-border)',
  strokeWidth: 2,
  rotation: 0,
  opacity: 1,
})

export default function GameBoard({
  board, currentCard, combinationStyle, cellRevealMode,
  selectedCell, onCellSelect, phase, hintQuadrant, solvedCells, isDragging,
  containerWidth, containerHeight
}: GameBoardProps) {
  const { gridSize, columnShapes, rowShapes } = board
  const mid = gridSize / 2
  const scrollRef = useRef<HTMLDivElement>(null)

  const containerDimension = containerWidth > 0 && containerHeight > 0
    ? Math.min(containerWidth, containerHeight)
    : 400
  const headerColWidth = 44
  const padding = 16
  const layoutGridSize = Math.max(gridSize, 3)
  const gaps = layoutGridSize * 8
  
  const computedCellSize = Math.floor((containerDimension - headerColWidth - padding * 2 - gaps) / layoutGridSize)
  const cellSize = Math.max(56, computedCellSize)

  const scrollX = useMotionValue(0)
  const scrollY = useMotionValue(0)
  
  const colHeaderY = useTransform(scrollY, [0, 30], [-8, 0])
  const colHeaderOpacity = useTransform(scrollY, [0, 30], [0.7, 1])
  
  const rowHeaderX = useTransform(scrollX, [0, 30], [-8, 0])
  const rowHeaderOpacity = useTransform(scrollX, [0, 30], [0.7, 1])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    scrollX.set(e.currentTarget.scrollLeft)
    scrollY.set(e.currentTarget.scrollTop)
  }

  return (
    <div className="relative w-full h-full p-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="board-dot-bg rounded-2xl bg-[var(--color-surface-alt)] shadow-sm border border-[var(--color-border)] w-full h-full overflow-auto p-4"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${headerColWidth}px repeat(${gridSize}, ${cellSize}px)`,
          gridTemplateRows: `${headerColWidth}px repeat(${gridSize}, ${cellSize}px)`,
          gap: '8px',
          width: 'fit-content',
          minWidth: '100%',
        }}>
          <div 
            style={{ position: 'sticky', top: 0, insetInlineStart: 0, zIndex: 3, backgroundColor: 'var(--color-surface-alt)', boxShadow: '0 8px 0 var(--color-surface-alt)' }} 
          />

          {columnShapes.map((shape, col) => (
            <m.div 
              key={shape.id} 
              style={{ position: 'sticky', top: 0, zIndex: 2, y: colHeaderY, opacity: colHeaderOpacity, backgroundColor: 'var(--color-surface-alt)', boxShadow: '0 8px 0 var(--color-surface-alt)' }}
              className="flex items-center justify-center"
            >
              <div className="w-[65%] aspect-square min-w-[28px] max-w-[64px]">
                {shape.render(headerParams(col + 1))}
              </div>
            </m.div>
          ))}

          {rowShapes.map((rowShape, row) => (
            <Fragment key={rowShape.id}>
              <m.div 
                style={{ position: 'sticky', insetInlineStart: 0, zIndex: 2, x: rowHeaderX, opacity: rowHeaderOpacity, backgroundColor: 'var(--color-surface-alt)', boxShadow: '8px 0 0 var(--color-surface-alt)' }}
                className="flex items-center justify-center"
              >
                <div className="w-[65%] aspect-square min-w-[28px] max-w-[64px]">
                  {rowShape.render(headerParams(row + 5))}
                </div>
              </m.div>
              
              {columnShapes.map((colShape, col) => {
                const isCorrect =
                  currentCard?.correctCell.col === col && currentCard?.correctCell.row === row
                const isSelected =
                  selectedCell?.col === col && selectedCell?.row === row

                let isHintTarget = false
                if (hintQuadrant && !isCorrect) {
                  if (hintQuadrant === 'topLeft' && col < mid && row < mid) isHintTarget = true
                  if (hintQuadrant === 'topRight' && col >= mid && row < mid) isHintTarget = true
                  if (hintQuadrant === 'bottomLeft' && col < mid && row >= mid) isHintTarget = true
                  if (hintQuadrant === 'bottomRight' && col >= mid && row >= mid) isHintTarget = true
                }

                return (
                  <BoardCell
                    key={`${col}-${row}`}
                    columnShape={colShape}
                    rowShape={rowShape}
                    combinationStyle={combinationStyle}
                    revealMode={cellRevealMode}
                    isCorrect={isCorrect}
                    isSelected={isSelected}
                    isHintTarget={isHintTarget}
                    isSolved={solvedCells?.has(`${col}-${row}`)}
                    isDragging={isDragging}
                    phase={phase}
                    col={col}
                    row={row}
                    onSelect={onCellSelect}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
