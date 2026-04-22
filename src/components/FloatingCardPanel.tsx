import { useEffect, useState } from 'react'
import { m, useMotionValue, useDragControls, animate } from 'framer-motion'
import { useSettingsStore } from '@/store/settingsStore'
import { cn } from '@/lib/utils'
import PlayerCard from './PlayerCard'
import type { CardState, GamePhase, CombinationStyle } from '@/shapes/types'

interface FloatingCardPanelProps {
  card: CardState
  isSelected: boolean
  onSelect: () => void
  phase: GamePhase
  combinationStyle: CombinationStyle
}

export default function FloatingCardPanel({
  card,
  isSelected,
  onSelect,
  phase,
  combinationStyle,
}: FloatingCardPanelProps) {
  const { cardPanelPosition, cardPanelCollapsed, updateSetting } = useSettingsStore()
  const dragControls = useDragControls()
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const initX = window.innerWidth * cardPanelPosition.xFrac
    const initY = window.innerHeight * cardPanelPosition.yFrac
    x.set(initX)
    y.set(initY)
    
    snapToNearestCorner(initX, initY)
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const currentX = window.innerWidth * cardPanelPosition.xFrac
      const currentY = window.innerHeight * cardPanelPosition.yFrac
      x.set(currentX)
      y.set(currentY)
      snapToNearestCorner(currentX, currentY)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [cardPanelPosition])


  const snapToNearestCorner = (currentX: number, currentY: number) => {
    const w = window.innerWidth
    const h = window.innerHeight
    
    const panelWidth = cardPanelCollapsed ? 180 : 160
    const panelHeight = cardPanelCollapsed ? 40 : 200
    
    const margin = 16
    
    const targetX = currentX < w / 2 ? margin : w - panelWidth - margin
    const targetY = currentY < h / 2 ? margin : h - panelHeight - margin

    animate(x, targetX, { type: 'spring', stiffness: 300, damping: 25 })
    animate(y, targetY, { type: 'spring', stiffness: 300, damping: 25, onComplete: () => {
       updateSetting('cardPanelPosition', {
        xFrac: targetX / w,
        yFrac: targetY / h
      })
    } })
  }

  const handleDragEnd = (_: any, info: any) => {
     snapToNearestCorner(info.point.x, info.point.y)
  }

  if (!isMounted) return null

  const colIdx = (card.correctCell.col % 8) + 1
  const rowIdx = ((card.correctCell.row + 4) % 8) + 1

  return (
    <m.div
      style={{ x, y }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      className={cn(
        'fixed z-40 flex flex-col items-center pointer-events-auto',
        cardPanelCollapsed ? 'w-[180px]' : 'w-[160px]'
      )}
      initial={false}
      animate={{ 
        height: cardPanelCollapsed ? 40 : 'auto',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-lg cursor-grab active:cursor-grabbing',
          cardPanelCollapsed ? 'rounded-full' : 'rounded-t-xl border-b-0'
        )}
        onPointerDown={(e) => {
          e.stopPropagation()
          dragControls.start(e)
        }}
        onClick={() => updateSetting('cardPanelCollapsed', !cardPanelCollapsed)}
      >
        <div className="flex flex-col gap-[3px] opacity-50">
           <div className="w-4 h-[2px] bg-current rounded-full" />
           <div className="w-4 h-[2px] bg-current rounded-full" />
           <div className="w-4 h-[2px] bg-current rounded-full" />
        </div>
        
        {cardPanelCollapsed && (
           <div className="flex items-center gap-1.5 ms-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[60px]"
              style={{ background: `color-mix(in srgb, var(--shape-color-${colIdx}) 18%, transparent)`, color: `var(--shape-color-${colIdx})` }}
            >
              {card.columnShape.name}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[60px]"
              style={{ background: `color-mix(in srgb, var(--shape-color-${rowIdx}) 18%, transparent)`, color: `var(--shape-color-${rowIdx})` }}
            >
              {card.rowShape.name}
            </span>
          </div>
        )}
      </div>

      <m.div
        className="w-full origin-top"
        initial={false}
        animate={{ 
          opacity: cardPanelCollapsed ? 0 : 1,
          scaleY: cardPanelCollapsed ? 0 : 1,
          display: cardPanelCollapsed ? 'none' : 'block'
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="w-full bg-[var(--color-surface-raised)] rounded-b-xl border border-[var(--color-border)] border-t-0 p-2 shadow-xl">
           <PlayerCard
              card={card}
              isSelected={isSelected}
              onSelect={onSelect}
              phase={phase}
              combinationStyle={combinationStyle}
            />
        </div>
      </m.div>
    </m.div>
  )
}

