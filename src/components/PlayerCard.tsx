import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { CardState, GamePhase, ShapeRenderParams } from '@/shapes/types'
import ShapeCombiner from './ShapeCombiner'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  card: CardState
  isSelected: boolean
  onSelect: () => void
  phase: GamePhase
  isGhost?: boolean
}

export default function PlayerCard({ card, isSelected, onSelect, phase, isGhost = false }: PlayerCardProps) {
  const { t } = useTranslation()

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'player-card',
    disabled: isGhost || phase !== 'playing',
  })

  const colIdx = (card.correctCell.col % 8) + 1
  const rowIdx = ((card.correctCell.row + 4) % 8) + 1

  const paramsA: ShapeRenderParams = {
    fillColor: `var(--shape-color-${colIdx})`,
    strokeColor: 'var(--color-border)',
    strokeWidth: 2,
    rotation: 0,
    opacity: 1,
  }

  const paramsB: ShapeRenderParams = {
    fillColor: `var(--shape-color-${rowIdx})`,
    strokeColor: 'var(--color-border)',
    strokeWidth: 2,
    rotation: 0,
    opacity: 1,
  }

  const shakeAnimate = phase === 'wrong' ? { x: [0, -9, 9, -9, 9, -5, 5, 0] } : {}
  const correctAnimate = phase === 'correct' ? { scale: [1, 1.13, 0.97, 1.04, 1] } : {}
  const floatAnimate = phase === 'playing' && !isDragging ? { y: [0, -8, 0] } : { y: 0 }

  const floatTransition = phase === 'playing' && !isDragging
    ? { y: { repeat: Infinity, duration: 3, ease: [0.45, 0, 0.55, 1] as [number, number, number, number] } }
    : {}

  const glowStyle: React.CSSProperties = isGhost
    ? { boxShadow: '0 28px 56px rgba(0,0,0,0.32)', willChange: 'transform' }
    : phase === 'correct'
      ? { boxShadow: '0 0 0 3px var(--color-success), 0 8px 32px rgba(16,185,129,0.25)', willChange: 'transform' }
      : isSelected
        ? { boxShadow: '0 0 0 3px var(--color-primary), 0 8px 24px rgba(99,102,241,0.2)', willChange: 'transform' }
        : { boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)', willChange: 'transform' }

  const dndStyle: React.CSSProperties = isGhost
    ? {}
    : { transform: CSS.Transform.toString(transform), opacity: isDragging ? 0 : 1 }

  function handlePointerUp() {
    if (!isDragging) onSelect()
  }

  return (
    <m.div
      ref={isGhost ? undefined : setNodeRef}
      key={card.columnShape.id + card.rowShape.id}
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]',
        'touch-none select-none',
        'w-full flex flex-col overflow-hidden',
        isGhost ? 'cursor-grabbing' : 'cursor-grab active:cursor-grabbing',
      )}
      style={{ ...glowStyle, ...dndStyle }}
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{
        opacity: isDragging ? 0 : 1,
        scale: 1,
        ...floatAnimate,
        ...shakeAnimate,
        ...correctAnimate,
      }}
      whileHover={isGhost || isDragging ? {} : { scale: 1.04, rotate: 1.5, y: -4 }}
      transition={{
        default: { type: 'spring', stiffness: 280, damping: 18 },
        ...floatTransition,
      }}
      onPointerUp={isGhost ? undefined : handlePointerUp}
      aria-label={t('game.card')}
      role="button"
      tabIndex={isGhost ? -1 : 0}
      {...(isGhost ? {} : { ...attributes, ...listeners })}
    >
      <div
        className="px-3 py-1.5 border-b border-[var(--color-border)] text-center"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent)' }}
      >
        <p className="text-[10px] font-bold text-[var(--color-content-muted)] uppercase tracking-widest">
          {t('game.card')}
        </p>
      </div>

      <div className="relative aspect-square p-[10%]">
        <ShapeCombiner
          shapeA={card.columnShape}
          shapeB={card.rowShape}
          paramsA={paramsA}
          paramsB={paramsB}
          mode="overlay"
        />

        {!isGhost && (
          <div className="absolute bottom-1.5 end-1.5 opacity-30">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--color-content-muted)]">
              <circle cx="9" cy="7" r="2" />
              <circle cx="15" cy="7" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="15" cy="12" r="2" />
              <circle cx="9" cy="17" r="2" />
              <circle cx="15" cy="17" r="2" />
            </svg>
          </div>
        )}
      </div>

      <div className="px-2 py-1.5 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)] flex items-center justify-center gap-1.5 flex-wrap">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full truncate max-w-[5rem]"
          style={{ background: `color-mix(in srgb, var(--shape-color-${colIdx}) 18%, transparent)`, color: `var(--shape-color-${colIdx})` }}
        >
          {card.columnShape.name}
        </span>
        <span className="text-[9px] text-[var(--color-content-muted)]">·</span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full truncate max-w-[5rem]"
          style={{ background: `color-mix(in srgb, var(--shape-color-${rowIdx}) 18%, transparent)`, color: `var(--shape-color-${rowIdx})` }}
        >
          {card.rowShape.name}
        </span>
      </div>

      {phase === 'correct' && (
        <m.div
          className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[var(--color-success)]"
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.12 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
    </m.div>
  )
}
