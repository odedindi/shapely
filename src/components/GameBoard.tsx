import type { BoardState, CardState, CombinationStyle, CellRevealMode, GamePhase, ShapeRenderParams } from '@/shapes/types'
import { Fragment, useState } from 'react'
import { m } from 'framer-motion'
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
  const [isPanning, setIsPanning] = useState(false)

  const containerDimension = containerWidth > 0 && containerHeight > 0
    ? Math.min(containerWidth, containerHeight)
    : 400
  const headerColWidth = 44
  const padding = 16
  const layoutGridSize = Math.max(gridSize, 3)
  const gaps = layoutGridSize * 8
  
  const computedCellSize = Math.floor((containerDimension - headerColWidth - padding * 2 - gaps) / layoutGridSize)
  const cellSize = Math.max(44, Math.min(110, computedCellSize))
  const isPanMode = computedCellSize < 44

  const gridContent = (
    <div
      className={`board-dot-bg rounded-2xl bg-[var(--color-surface-alt)] shadow-sm border border-[var(--color-border)] p-4`}
      style={{
        display: 'grid',
        gridTemplateColumns: `${headerColWidth}px repeat(${gridSize}, ${cellSize}px)`,
        gridTemplateRows: `${headerColWidth}px repeat(${gridSize}, ${cellSize}px)`,
        gap: '8px',
      }}
    >
      <div />

      {columnShapes.map((shape, col) => (
        <div key={shape.id} className="flex items-center justify-center">
          <div className="w-[65%] aspect-square min-w-[28px] max-w-[64px]">
            {shape.render(headerParams(col + 1))}
          </div>
        </div>
      ))}

      {rowShapes.map((rowShape, row) => (
        <Fragment key={rowShape.id}>
          <div className="flex items-center justify-center">
            <div className="w-[65%] aspect-square min-w-[28px] max-w-[64px]">
              {rowShape.render(headerParams(row + 5))}
            </div>
          </div>
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
  )

  return (
    <div 
      className={`min-h-full flex items-center justify-center relative w-full h-full ${isPanMode ? 'overflow-hidden' : ''}`}
      style={isPanMode ? { boxShadow: 'inset 0 0 40px rgba(0,0,0,0.15)' } : {}}
    >
      {isPanMode ? (
        <m.div
          drag
          dragElastic={0.15}
          dragTransition={{ bounceStiffness: 500, bounceDamping: 22 }}
          onDragStart={() => setIsPanning(true)}
          onDragEnd={() => setIsPanning(false)}
          onPointerDown={(e) => {
            if (isPanning) e.stopPropagation()
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          {gridContent}
        </m.div>
      ) : (
        gridContent
      )}
    </div>
  )
}
