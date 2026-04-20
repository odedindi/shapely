import { useMemo } from 'react'
import { m } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import type { ShapeDefinition, CombinationStyle, CellRevealMode, GamePhase, ShapeRenderParams } from '@/shapes/types'
import ShapeCombiner from './ShapeCombiner'
import { cn } from '@/lib/utils'

interface BoardCellProps {
  columnShape: ShapeDefinition
  rowShape: ShapeDefinition
  combinationStyle: CombinationStyle
  revealMode: CellRevealMode
  isCorrect: boolean
  isSelected: boolean
  phase: GamePhase
  col: number
  row: number
  onSelect: (col: number, row: number) => void
}

export default function BoardCell({
  columnShape, rowShape, combinationStyle, revealMode,
  isCorrect, isSelected, phase, col, row, onSelect,
}: BoardCellProps) {
  const droppableId = `cell-${col}-${row}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  const paramsA = useMemo<ShapeRenderParams>(() => ({
    fillColor: getComputedStyle(document.documentElement).getPropertyValue(`--shape-color-${Math.min(Math.max(col + 1, 1), 8)}`).trim(),
    strokeColor: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#e5e7eb',
    strokeWidth: 2,
    rotation: 0,
    opacity: 0.9,
  }), [col])

  const paramsB = useMemo<ShapeRenderParams>(() => ({
    ...paramsA,
    fillColor: getComputedStyle(document.documentElement).getPropertyValue(`--shape-color-${Math.min(Math.max(row + 5, 1), 8)}`).trim(),
  }), [row, paramsA])

  const isHidden = revealMode === 'hidden'
  const isPeek = revealMode === 'peek'
  const showCorrectRing = isCorrect && phase === 'correct'
  const showWrongFlash = phase === 'wrong' && isSelected

  const borderClass = cn(
    'border-2',
    showCorrectRing
      ? 'border-[var(--color-success)]'
      : isSelected
        ? 'border-[var(--color-primary)]'
        : isOver
          ? 'border-[var(--color-primary)] border-dashed'
          : 'border-[var(--color-border)]',
  )

  return (
    <m.div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={cn(
        'relative w-full aspect-square rounded-xl flex items-center justify-center cursor-pointer overflow-hidden',
        'bg-[var(--color-surface-raised)]',
        'transition-colors duration-150',
        'self-center justify-self-center-safe',
        borderClass,
      )}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: 1,
        scale: isOver ? 1.04 : 1,
        y: isOver ? -3 : 0,
        boxShadow: isOver
          ? '0 8px 24px color-mix(in srgb, var(--color-primary) 30%, transparent)'
          : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ delay: (col + row) * 0.025, type: 'spring', stiffness: 320, damping: 22 }}
      onPointerUp={() => onSelect(col, row)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(col, row) }}
    >
      {isOver && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[10px]"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
        />
      )}

      {isHidden ? (
        <div className="flex items-center justify-center w-full h-full"
          style={{ background: 'color-mix(in srgb, var(--color-surface-alt) 60%, transparent)', backdropFilter: 'blur(4px)' }}>
          <span className="text-2xl text-[var(--color-content-muted)] select-none">?</span>
        </div>
      ) : (
        <div className={cn('w-full h-full p-[8%]', isPeek && 'blur-sm hover:blur-none focus:blur-none transition-[filter] duration-300')}>
          <ShapeCombiner
            shapeA={columnShape}
            shapeB={rowShape}
            paramsA={paramsA}
            paramsB={paramsB}
            mode={combinationStyle}
          />
        </div>
      )}

      {showCorrectRing && (
        <div
          key="correct-ring"
          className="cell-correct-ring pointer-events-none absolute inset-0 rounded-xl border-4 border-[var(--color-success)]"
        />
      )}

      {showCorrectRing && (
        <m.div
          key="correct-check"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.4, y: 6 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 0.8], y: [6, 0, 0, -4] }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        >
          <span className="text-2xl drop-shadow-sm">✓</span>
        </m.div>
      )}

      {showWrongFlash && (
        <div
          key="wrong-flash"
          className="cell-wrong-flash pointer-events-none absolute inset-0 rounded-xl bg-[var(--color-error)]"
        />
      )}
    </m.div>
  )
}
