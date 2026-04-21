import type { BoardState, CardState, CombinationStyle, CellRevealMode, GamePhase, ShapeRenderParams } from '@/shapes/types'
import { Fragment } from 'react'
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
  selectedCell, onCellSelect, phase, hintQuadrant, solvedCells
}: GameBoardProps) {
  const { gridSize, columnShapes, rowShapes } = board
  const mid = gridSize / 2

  return (
    <div className="w-full h-full flex items-center justify-center p-2 md:p-4">
      <div
        className="board-dot-bg rounded-2xl bg-[var(--color-surface-alt)] shadow-sm border border-[var(--color-border)] p-3 md:p-4 lg:p-5"
        style={{
          display: 'grid',
          gridTemplateColumns: `min-content repeat(${gridSize}, minmax(44px, 96px))`,
          gridTemplateRows: `min-content repeat(${gridSize}, minmax(44px, 96px))`,
          gap: 'clamp(4px, 1vw, 8px)',
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
  )
}
