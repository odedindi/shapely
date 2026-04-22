import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { m } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useGameSettingsStore } from '@/store/gameSettingsStore'
import { useReplay, type ReplaySpeed } from '@/hooks/useReplay'
import GameBoard from '@/components/GameBoard'
import PlayerCard from '@/components/PlayerCard'
import { Button } from '@/components/ui/button'

const SPEED_OPTIONS: ReplaySpeed[] = [1, 2, 'instant']

function speedLabel(s: ReplaySpeed): string {
  if (s === 'instant') return '⚡'
  return `${s}×`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function ReplayScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const store = useGameStore()
  const gameSettings = useGameSettingsStore()

  const { replay, loading, playing, speed, setSpeed, progress, startPlayback, stopPlayback } = useReplay(id ?? '')

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!replay) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)]">
        <p className="text-[var(--color-content-muted)]">
          {t('replay.notFound', { defaultValue: 'Replay not found.' })}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t('replay.back', { defaultValue: 'Go back' })}
        </Button>
      </div>
    )
  }

  const accuracy = replay.totalAnswers > 0
    ? Math.round((replay.correctAnswers / replay.totalAnswers) * 100)
    : 0

  return (
    <div className="h-screen flex flex-col bg-[var(--color-surface)] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Button>
        <h1 className="text-base font-bold text-[var(--color-content)]">
          {t('replay.title', { defaultValue: 'Replay' })}
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] shrink-0 gap-4">
        <div className="flex items-center gap-3 text-sm text-[var(--color-content-muted)]">
          <span className="font-bold text-[var(--color-primary)] text-base">{replay.score}</span>
          <span>{accuracy}%</span>
          <span>{formatTime(replay.timeElapsed)}</span>
          <span>{replay.gridSize}×{replay.gridSize}</span>
        </div>

        <div className="flex items-center gap-2">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={String(s)}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${speed === s ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-content)] border-[var(--color-border)]'}`}
            >
              {speedLabel(s)}
            </button>
          ))}
        </div>

        <button
          onClick={playing ? stopPlayback : startPlayback}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-[var(--color-primary-fg)] transition-opacity hover:opacity-90"
        >
          {playing ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              {t('replay.pause', { defaultValue: 'Pause' })}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {t('replay.play', { defaultValue: 'Play' })}
            </>
          )}
        </button>
      </div>

      <div className="shrink-0 h-1 bg-[var(--color-border)]">
        <m.div
          className="h-full bg-[var(--color-primary)]"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          {store.board ? (
            <GameBoard
              board={store.board}
              currentCard={store.currentCard}
              combinationStyle={gameSettings.combinationStyle}
              cellRevealMode={gameSettings.cellRevealMode}
              selectedCell={null}
              onCellSelect={() => undefined}
              phase={store.phase}
              hintQuadrant={null}
              solvedCells={store.solvedCells}
              isDragging={false}
              containerWidth={0}
              containerHeight={0}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--color-content-muted)] text-sm">
              {playing
                ? t('replay.loading', { defaultValue: 'Loading…' })
                : t('replay.pressPlay', { defaultValue: 'Press Play to start the replay.' })}
            </div>
          )}
        </div>

        {store.currentCard && (
          <div className="shrink-0 flex items-center justify-center p-4 border-t border-[var(--color-border)] md:border-t-0 md:border-s bg-[var(--color-surface-alt)] md:w-48 lg:w-52">
            <div className="w-32 md:w-40 pointer-events-none">
              <PlayerCard
                card={store.currentCard}
                isSelected={false}
                onSelect={() => undefined}
                phase={store.phase}
                combinationStyle={gameSettings.combinationStyle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
