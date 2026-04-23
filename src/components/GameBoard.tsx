import type { BoardState, CardState, CombinationStyle, CellRevealMode, GamePhase, ShapeRenderParams } from '@/shapes/types'
import { Fragment, useRef, useCallback, useEffect } from 'react'
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
  boardSnapOnRelease?: boolean
  boardAutoCenterSelected?: boolean
  boardReducedMotion?: boolean
}

const headerParams = (colorIndex: number): ShapeRenderParams => ({
  fillColor: `var(--shape-color-${((colorIndex - 1) % 8) + 1})`,
  strokeColor: 'var(--color-border)',
  strokeWidth: 2,
  rotation: 0,
  opacity: 1,
})

const HEADER_SIZE = 52
const GAP = 8
const PADDING = 16

export default function GameBoard({
  board, currentCard, combinationStyle, cellRevealMode,
  selectedCell, onCellSelect, phase, hintQuadrant, solvedCells, isDragging,
  containerWidth, containerHeight,
  boardSnapOnRelease = false,
  boardAutoCenterSelected = false,
  boardReducedMotion = false,
}: GameBoardProps) {
  const { gridSize, columnShapes, rowShapes } = board
  const mid = gridSize / 2
  const scrollRef = useRef<HTMLDivElement>(null)
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const containerDimension = containerWidth > 0 && containerHeight > 0
    ? Math.min(containerWidth, containerHeight)
    : 400

  const layoutGridSize = Math.max(gridSize, 3)
  const availableForCells = containerDimension - HEADER_SIZE - PADDING * 2 - layoutGridSize * GAP
  const computedCellSize = Math.floor(availableForCells / layoutGridSize)
  const cellSize = Math.max(56, computedCellSize)

  const scrollLeft = useMotionValue(0)
  const scrollTop = useMotionValue(0)

  const negScrollLeft = useTransform(scrollLeft, (v) => -v)
  const negScrollTop = useTransform(scrollTop, (v) => -v)

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    scrollLeft.set(e.currentTarget.scrollLeft)
    scrollTop.set(e.currentTarget.scrollTop)

    if (boardSnapOnRelease) {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
      snapTimerRef.current = setTimeout(() => {
        const el = scrollRef.current
        if (!el) return
        const step = cellSize + GAP
        const snappedLeft = Math.round(el.scrollLeft / step) * step
        const snappedTop = Math.round(el.scrollTop / step) * step
        el.scrollTo({ left: snappedLeft, top: snappedTop, behavior: boardReducedMotion ? 'instant' : 'smooth' })
      }, 120)
    }
  }, [scrollLeft, scrollTop, boardSnapOnRelease, boardReducedMotion, cellSize])

  useEffect(() => {
    if (!boardAutoCenterSelected || !selectedCell || isDragging) return
    const el = scrollRef.current
    if (!el) return
    const step = cellSize + GAP
    const targetLeft = selectedCell.col * step - (el.clientWidth - HEADER_SIZE - cellSize) / 2
    const targetTop = selectedCell.row * step - (el.clientHeight - HEADER_SIZE - cellSize) / 2
    el.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: boardReducedMotion ? 'instant' : 'smooth',
    })
  }, [selectedCell, boardAutoCenterSelected, boardReducedMotion, isDragging, cellSize])

  useEffect(() => () => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
  }, [])

  const colStripWidth = gridSize * cellSize + (gridSize - 1) * GAP
  const rowStripHeight = gridSize * cellSize + (gridSize - 1) * GAP
  const railBg: React.CSSProperties = { backgroundColor: 'var(--color-surface-alt)' }

  return (
    <div className="relative w-full h-full p-4 overflow-hidden">
      <div className="relative w-full h-full rounded-2xl board-dot-bg bg-[var(--color-surface-alt)] shadow-sm border border-[var(--color-border)] overflow-hidden">

        <div
          className="absolute top-0 start-0 z-30"
          style={{ width: HEADER_SIZE + PADDING, height: HEADER_SIZE + PADDING, ...railBg }}
        />

        <div
          className="absolute top-0 z-20 overflow-hidden"
          style={{
            insetInlineStart: HEADER_SIZE + PADDING,
            width: `calc(100% - ${HEADER_SIZE + PADDING}px)`,
            height: HEADER_SIZE + PADDING,
            ...railBg,
          }}
        >
          <m.div
            style={{ x: negScrollLeft, display: 'flex', gap: GAP, paddingTop: PADDING, paddingInlineStart: GAP }}
          >
            {columnShapes.map((shape, col) => (
              <div
                key={shape.id}
                style={{ width: cellSize, flexShrink: 0, height: HEADER_SIZE }}
                className="flex items-center justify-center"
              >
                <div className="w-[65%] aspect-square min-w-[28px] max-w-[56px]">
                  {shape.render(headerParams(col + 1))}
                </div>
              </div>
            ))}
          </m.div>
        </div>

        <div
          className="absolute start-0 z-20 overflow-hidden"
          style={{
            insetBlockStart: HEADER_SIZE + PADDING,
            width: HEADER_SIZE + PADDING,
            height: `calc(100% - ${HEADER_SIZE + PADDING}px)`,
            ...railBg,
          }}
        >
          <m.div
            style={{ y: negScrollTop, display: 'flex', flexDirection: 'column', gap: GAP, paddingInlineStart: PADDING, paddingTop: GAP }}
          >
            {rowShapes.map((rowShape, row) => (
              <div
                key={rowShape.id}
                style={{ height: cellSize, width: HEADER_SIZE, flexShrink: 0 }}
                className="flex items-center justify-center"
              >
                <div className="w-[65%] aspect-square min-w-[28px] max-w-[56px]">
                  {rowShape.render(headerParams(row + 5))}
                </div>
              </div>
            ))}
          </m.div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-auto"
          style={{
            paddingTop: HEADER_SIZE + PADDING + GAP,
            paddingInlineStart: HEADER_SIZE + PADDING + GAP,
            paddingBottom: PADDING,
            paddingInlineEnd: PADDING,
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
            gap: GAP,
            width: colStripWidth,
            height: rowStripHeight,
          }}>
            {rowShapes.map((rowShape, row) => (
              <Fragment key={rowShape.id}>
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
    </div>
  )
}
