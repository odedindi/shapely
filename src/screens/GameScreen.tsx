import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { m, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useGameSettingsStore } from '@/store/gameSettingsStore'
import { usePlatformStore } from '@/store/platformStore'
import { useShapeRegistry } from '@/hooks/useShapeRegistry'
import { useGameLogic } from '@/hooks/useGameLogic'
import GameBoard from '@/components/GameBoard'
import PlayerCard from '@/components/PlayerCard'
import ScoreBar from '@/components/ScoreBar'
import SettingsPanel from '@/components/SettingsPanel'
import LevelUpOverlay from '@/components/LevelUpOverlay'
import VictoryScreen from '@/screens/VictoryScreen'
import { Sparkles } from '@/components/magic/Sparkles'
import { useHaptics } from '@/hooks/useHaptics'
import { log } from '@/lib/logger'
import { saveLeaderboardEntry, getLeaderboardEntries, type LeaderboardEntry } from '@/db/leaderboard'
import { getLevelForXP, type LevelDefinition } from '@/progression/levels'
import { useProgressStore } from '@/store/progressStore'

export default function GameScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { allShapes } = useShapeRegistry()
  const store = useGameStore()
  const settings = useGameSettingsStore()
  const platform = usePlatformStore()
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [cardSelected, setCardSelected] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activeCellId, setActiveCellId] = useState<string | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [sparklesPos, setSparklesPos] = useState<{ x: number; y: number } | null>(null)
  const [hintQuadrant, setHintQuadrant] = useState<'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | null>(null)
  const [victoryStats, setVictoryStats] = useState<{ isNewRecord: boolean; previousBest: number } | null>(null)
  const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([])
  const [victoryXP, setVictoryXP] = useState<{
    earned: number
    totalBefore: number
    totalAfter: number
    didLevelUp: boolean
    levelBefore: LevelDefinition
    levelAfter: LevelDefinition
  } | null>(null)
  const [victoryGameStats, setVictoryGameStats] = useState<{
    fastestAnswer: number
    avgResponseMs: number
    clutchRate: number
  } | null>(null)
  const prevStreakRef = useRef(0)
  const prevLevelUpPulseRef = useRef(0)
  const cardAreaRef = useRef<HTMLDivElement>(null)
  const boardContainerRef = useRef<HTMLDivElement>(null)
  const [boardContainerSize, setBoardContainerSize] = useState({ width: 0, height: 0 })

  const { startNewGame, submitAnswer } = useGameLogic(allShapes)

  const isTouchDevice = useMemo(
    () => window.matchMedia('(pointer: coarse)').matches,
    []
  )

  const haptics = useHaptics()

  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } })
  const sensors = useSensors(
    ...(settings.interactionMode !== 'tap' ? [mouseSensor, touchSensor] : []),
  )

  useEffect(() => {
    if (!boardContainerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoardContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(boardContainerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    store.resetGame()
  }, [settings.gridSize])

  useEffect(() => {
    if (allShapes.length > 0 && store.phase === 'idle') {
      startNewGame()
    }
  }, [allShapes.length, store.phase, startNewGame])

  useEffect(() => {
    if (store.phase === 'playing' && isTouchDevice) {
      setCardSelected(true)
    } else if (store.phase !== 'playing') {
      setCardSelected(false)
    }
  }, [store.phase, isTouchDevice])

  useEffect(() => {
    if (store.phase === 'correct') haptics.correct()
    else if (store.phase === 'wrong') haptics.wrong()
  }, [store.phase])

  useEffect(() => {
    if (store.levelUpPulse > 0 && store.levelUpPulse !== prevLevelUpPulseRef.current) {
      prevLevelUpPulseRef.current = store.levelUpPulse
      setShowLevelUp(true)
      const timer = setTimeout(() => setShowLevelUp(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [store.levelUpPulse])

  useEffect(() => {
    const current = store.streak
    const prev = prevStreakRef.current
    prevStreakRef.current = current
    if (current > 0 && current % 3 === 0 && current !== prev) {
      log.game.info('streak milestone sparkles', { streak: current })
      haptics.streak()
      if (cardAreaRef.current) {
        const rect = cardAreaRef.current.getBoundingClientRect()
        setSparklesPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
        setTimeout(() => setSparklesPos(null), 700)
      }
    }
  }, [store.streak])

  useEffect(() => {
    if (store.phase === 'complete') {
      if (!victoryStats) {
        const bestKey = `${settings.gridSize}-${store.gameMode}`
        const prevBest = settings.bestScores[bestKey] ?? 0
        const isNewRecord = store.score > prevBest
        setVictoryStats({ isNewRecord, previousBest: prevBest })
        settings.updateBestScore(bestKey, store.score)

        getLeaderboardEntries({ gridSize: settings.gridSize, gameMode: store.gameMode }, 5).then((top) => {
          setTopEntries(top)
        })

        const rTimes = store.responseTimes.filter(t => t > 0)
        const fastestAnswer = rTimes.length > 0 ? Math.min(...rTimes) : 0
        const avgResponseMs = rTimes.length > 0 ? rTimes.reduce((a, b) => a + b, 0) / rTimes.length : 0
        const clutchRate = rTimes.length > 0 ? rTimes.filter(t => t < 1000).length / rTimes.length : 0
        setVictoryGameStats({ fastestAnswer, avgResponseMs, clutchRate })

        const progress = useProgressStore.getState()
        const prevTotalXP = progress.totalXP
        const currentLevel = getLevelForXP(prevTotalXP)
        const baseXP = Math.floor(store.score / 10)
        const perfectBonus = store.boardBonusBreakdown.perfectBoard > 0 ? 30 : 0
        const sharpshooterBonus = currentLevel.level >= 12 && store.boardBonusBreakdown.perfectBoard > 0 ? 50 : 0
        const xpMultiplier = currentLevel.xpMultiplier ?? 1.0
        const totalXPEarned = Math.round((baseXP + perfectBonus + sharpshooterBonus) * xpMultiplier)
        const newTotalXP = prevTotalXP + totalXPEarned
        progress.awardXP(totalXPEarned)
        const levelAfter = getLevelForXP(newTotalXP)
        setVictoryXP({
          earned: totalXPEarned,
          totalBefore: prevTotalXP,
          totalAfter: newTotalXP,
          didLevelUp: levelAfter.level > currentLevel.level,
          levelBefore: currentLevel,
          levelAfter,
        })
      }
    } else {
      setVictoryStats(null)
      setTopEntries([])
      setVictoryXP(null)
      setVictoryGameStats(null)
    }
  }, [store.phase, store.score, store.gameMode, store.responseTimes, store.boardBonusBreakdown, settings.gridSize, settings.bestScores, settings.updateBestScore, victoryStats])

  function handleDragStart(_event: DragStartEvent) {
    if (settings.interactionMode === 'tap') return
    setIsDragging(true)
    setCardSelected(false)
    setActiveCellId(null)
    haptics.tap()
  }

  function handleDragOver(event: DragOverEvent) {
    setActiveCellId(event.over?.id as string | null ?? null)
  }

  function computeHintQuadrant(correctCol: number, correctRow: number) {
    if (!store.board) return null
    const mid = store.board.gridSize / 2
    if (correctCol < mid && correctRow < mid) return 'topLeft'
    if (correctCol >= mid && correctRow < mid) return 'topRight'
    if (correctCol < mid && correctRow >= mid) return 'bottomLeft'
    if (correctCol >= mid && correctRow >= mid) return 'bottomRight'
    return 'center'
  }

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false)
    setActiveCellId(null)
    if (settings.interactionMode === 'tap') return
    const overId = event.over?.id
    const droppedOnCell = typeof overId === 'string' && overId.startsWith('cell-')
    if (droppedOnCell) {
      setCardSelected(false)
    } else {
      setCardSelected(isTouchDevice && store.phase === 'playing')
    }
    if (store.phase !== 'playing') return
    if (droppedOnCell) {
      const parts = (overId as string).split('-')
      const col = parseInt(parts[1], 10)
      const row = parseInt(parts[2], 10)
      if (!isNaN(col) && !isNaN(row)) {
        submitAnswer(col, row)
        setSelectedCell({ col, row })
        const currentCard = useGameStore.getState().currentCard
        if (currentCard && (currentCard.correctCell.col !== col || currentCard.correctCell.row !== row)) {
          const quad = computeHintQuadrant(currentCard.correctCell.col, currentCard.correctCell.row)
          setHintQuadrant(quad)
          setTimeout(() => setHintQuadrant(null), 1200)
        }
        setTimeout(() => setSelectedCell(null), 900)
      }
    }
  }

  function handleCellSelect(col: number, row: number) {
    if (store.phase !== 'playing') return
    if (settings.interactionMode === 'drag') return
    if (!cardSelected) return
    setSelectedCell({ col, row })
    submitAnswer(col, row)
    const currentCard = useGameStore.getState().currentCard
    if (currentCard && (currentCard.correctCell.col !== col || currentCard.correctCell.row !== row)) {
      const quad = computeHintQuadrant(currentCard.correctCell.col, currentCard.correctCell.row)
      setHintQuadrant(quad)
      setTimeout(() => setHintQuadrant(null), 1200)
    }
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
    const accuracy =
      store.totalAnswers > 0 ? (store.correctAnswers / store.totalAnswers) * 100 : 0
      
    const handleSaveRecord = (name: string) => {
      saveLeaderboardEntry({
        id: crypto.randomUUID(),
        profileId: platform.activeProfileId ?? '',
        emoji: '🎮',
        name,
        score: store.score,
        timeElapsed: store.timeElapsed,
        accuracy,
        streak: store.bestStreak,
        gridSize: settings.gridSize,
        gameMode: store.gameMode,
        recordedAt: Date.now()
      }).then(() => {
        getLeaderboardEntries({ gridSize: settings.gridSize, gameMode: store.gameMode }, 5).then((top) => {
          setTopEntries(top)
        })
      })
    }
    
    return (
      <VictoryScreen
        score={store.score}
        timeElapsed={store.timeElapsed}
        streak={store.bestStreak}
        accuracy={accuracy}
        isNewRecord={victoryStats?.isNewRecord ?? false}
        previousBest={victoryStats?.previousBest ?? 0}
        gridSize={settings.gridSize}
        gameMode={store.gameMode}
        onPlayAgain={startNewGame}
        onHome={() => navigate('/')}
        onSaveRecord={handleSaveRecord}
        topEntries={topEntries}
        boardBonusBreakdown={store.boardBonusBreakdown}
        boardBonus={store.boardBonus}
        fastestAnswer={victoryGameStats?.fastestAnswer ?? 0}
        avgResponseMs={victoryGameStats?.avgResponseMs ?? 0}
        clutchRate={victoryGameStats?.clutchRate ?? 0}
        xpEarned={victoryXP?.earned ?? 0}
        xpBefore={victoryXP?.totalBefore ?? 0}
        xpAfter={victoryXP?.totalAfter ?? 0}
        didLevelUp={victoryXP?.didLevelUp ?? false}
        levelBefore={victoryXP?.levelBefore ?? null}
        levelAfter={victoryXP?.levelAfter ?? null}
      />
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
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
          <div ref={boardContainerRef} className="flex-1 min-h-0 overflow-hidden relative">
            {store.board && (
                <GameBoard
                  board={store.board}
                  currentCard={store.currentCard}
                  combinationStyle={settings.combinationStyle}
                  cellRevealMode={settings.cellRevealMode}
                  selectedCell={selectedCell}
                  onCellSelect={handleCellSelect}
                  phase={store.phase}
                  hintQuadrant={hintQuadrant}
                  solvedCells={store.solvedCells}
                  isDragging={isDragging}
                  containerWidth={boardContainerSize.width}
                  containerHeight={boardContainerSize.height}
                  boardSnapOnRelease={settings.boardSnapOnRelease}
                  boardAutoCenterSelected={settings.boardAutoCenterSelected}
                  boardReducedMotion={settings.boardReducedMotion}
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
              <div className="w-32 md:w-40" ref={cardAreaRef}>
                <PlayerCard
                  card={store.currentCard}
                  isSelected={cardSelected}
                  onSelect={handleCardSelect}
                  phase={store.phase}
                  combinationStyle={settings.combinationStyle}
                  isTouchDevice={isTouchDevice}
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
              <SettingsPanel availableShapeCount={allShapes.length} allShapes={allShapes} />
            </div>
          </div>
        )}

        <AnimatePresence>
          {showLevelUp && <LevelUpOverlay key="level-up" />}
        </AnimatePresence>

        {sparklesPos && (
          <Sparkles x={sparklesPos.x} y={sparklesPos.y} color="var(--color-primary)" />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {isDragging && store.currentCard ? (
          <m.div
            className="pointer-events-none"
            animate={activeCellId ? { width: 72, rotate: 0, scale: 1.0 } : { width: 132, rotate: 4, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <PlayerCard
              card={store.currentCard}
              isSelected={false}
              onSelect={() => undefined}
              phase={store.phase}
              combinationStyle={settings.combinationStyle}
              isGhost
            />
          </m.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
