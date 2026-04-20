import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { m } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useShapeRegistry } from '@/hooks/useShapeRegistry'
import { useGameLogic } from '@/hooks/useGameLogic'
import GameBoard from '@/components/GameBoard'
import PlayerCard from '@/components/PlayerCard'
import ScoreBar from '@/components/ScoreBar'
import SettingsPanel from '@/components/SettingsPanel'
import { Button } from '@/components/ui/button'
import { log } from '@/lib/logger'

export default function GameScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { allShapes } = useShapeRegistry()
  const store = useGameStore()
  const settings = useSettingsStore()
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cardSelected, setCardSelected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const { startNewGame, submitAnswer } = useGameLogic(allShapes)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  useEffect(() => {
    store.resetGame()
  }, [settings.gridSize, settings.combinationStyle])

  useEffect(() => {
    if (allShapes.length > 0 && store.phase === 'idle') {
      startNewGame()
    }
  }, [allShapes.length, store.phase, startNewGame])

  function handleDragStart(_event: DragStartEvent) {
    setIsDragging(true)
    setCardSelected(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false)
    const overId = event.over?.id
    if (typeof overId === 'string' && overId.startsWith('cell-')) {
      const parts = overId.split('-')
      const col = parseInt(parts[1], 10)
      const row = parseInt(parts[2], 10)
      if (!isNaN(col) && !isNaN(row)) {
        submitAnswer(col, row)
        setSelectedCell({ col, row })
        setTimeout(() => setSelectedCell(null), 900)
      }
    }
  }

  function handleCellSelect(col: number, row: number) {
    if (store.phase !== 'playing') return
    setSelectedCell({ col, row })
    submitAnswer(col, row)
    setCardSelected(false)
    setTimeout(() => setSelectedCell(null), 900)
  }

  function handleCardSelect() {
    setCardSelected((v) => !v)
  }

  function handleBack() {
    if (store.phase === 'playing') {
      if (window.confirm(t('game.confirmQuit', { defaultValue: 'Quit the current game?' }))) {
        log.ui.info('navigate', { to: '/', reason: 'quit-confirmed', score: store.score })
        navigate('/')
      }
    } else {
      log.ui.info('navigate', { to: '/', reason: 'game-not-playing' })
      navigate('/')
    }
  }

  if (store.phase === 'idle') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[var(--color-surface)]">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (store.phase === 'complete') {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-surface)]">
        <header className="h-14 flex items-center gap-3 px-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] shrink-0">
          <button
            aria-label={t('nav.back')}
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-content-muted)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="font-bold text-lg text-[var(--color-content)]">Shapely</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <p className="text-5xl mb-2">🎉</p>
            <p className="text-2xl font-bold text-[var(--color-content)]">
              {t('game.score', { defaultValue: 'Score' })}: {store.score}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button onClick={startNewGame} size="lg" className="w-full">
              {t('game.playAgain', { defaultValue: 'Play Again' })}
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              {t('nav.home', { defaultValue: 'Home' })}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-[var(--color-surface)] overflow-hidden">
        <ScoreBar
          score={store.score}
          streak={store.streak}
          timeElapsed={store.timeElapsed}
          timerEnabled={settings.timerEnabled}
          onSettingsOpen={() => { log.ui.info('settings panel opened'); setSettingsOpen(true) }}
          onBack={handleBack}
        />

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center">
            {store.board && (
              <GameBoard
                board={store.board}
                currentCard={store.currentCard}
                combinationStyle={settings.combinationStyle}
                cellRevealMode={settings.cellRevealMode}
                selectedCell={selectedCell}
                onCellSelect={handleCellSelect}
                phase={store.phase}
              />
            )}
          </div>

          <m.div
            className="
              shrink-0 flex items-center justify-center
              p-4 gap-3
              border-t border-[var(--color-border)]
              md:border-t-0 md:border-s md:flex-col
              md:w-48 lg:w-52
              bg-[var(--color-surface-alt)]
            "
            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {store.currentCard && (
              <div className="w-32 md:w-40">
                <PlayerCard
                  card={store.currentCard}
                  isSelected={cardSelected}
                  onSelect={handleCardSelect}
                  phase={store.phase}
                />
              </div>
            )}
          </m.div>
        </div>

        {settingsOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('game.settings')}
            className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center"
            onClick={() => setSettingsOpen(false)}
          >
            <div
              className="w-full md:w-auto md:max-w-lg bg-[var(--color-surface)] rounded-t-2xl md:rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 flex justify-end p-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <button
                  aria-label="Close settings"
                  onClick={() => { log.ui.info('settings panel closed'); setSettingsOpen(false) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-alt)] text-[var(--color-content-muted)]"
                >
                  ✕
                </button>
              </div>
              <SettingsPanel />
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {isDragging && store.currentCard ? (
          <div className="w-32 md:w-40 pointer-events-none" style={{ transform: 'scale(1.1) rotate(4deg)' }}>
            <PlayerCard
              card={store.currentCard}
              isSelected={false}
              onSelect={() => undefined}
              phase={store.phase}
              isGhost
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
